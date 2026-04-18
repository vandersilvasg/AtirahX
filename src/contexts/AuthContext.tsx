/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseModule } from '@/lib/supabaseClientLoader';

export type UserRole = 'owner' | 'doctor' | 'secretary';

export interface User {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  debugMessage: string;
}

type ProfileRow = {
  id: string;
  name: string | null;
  role: string | null;
  avatar_url: string | null;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ROLES: UserRole[] = ['owner', 'doctor', 'secretary'];

function normalizeRole(role: unknown): UserRole | null {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole)
    ? (role as UserRole)
    : null;
}

async function mapSupabaseUserToAppUser(
  supabase: SupabaseClient,
  supaUser: SupabaseUser,
): Promise<User> {
  const queryPromise = supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', supaUser.id)
    .maybeSingle();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Tempo limite ao buscar perfil do usuario.')), 10000);
  });

  const { data: profile, error } = (await Promise.race([
    queryPromise,
    timeoutPromise,
  ])) as { data: ProfileRow | null; error: { code?: string; message?: string } | null };

  if (error) {
    throw new Error(error.message || 'Erro ao carregar perfil do usuario.');
  }

  if (!profile) {
    throw new Error('Perfil de usuario nao encontrado para esta conta.');
  }

  const role = normalizeRole(profile.role);
  if (!role) {
    throw new Error('Role de usuario invalida no perfil.');
  }

  return {
    id: profile.id,
    auth_id: supaUser.id,
    email: supaUser.email || '',
    name: profile.name || supaUser.email || 'Usuario',
    role,
    avatar_url: profile.avatar_url || undefined,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugMessage, setDebugMessage] = useState<string>('Inicializando...');
  const isMountedRef = useRef(true);

  const applySessionUser = async (sessionUser: SupabaseUser | null) => {
    if (!isMountedRef.current) return;

    if (!sessionUser) {
      setUser(null);
      setDebugMessage('Sessao vazia.');
      return;
    }

    setDebugMessage('Mapeando usuario...');
    try {
      const { supabase } = await getSupabaseModule();
      const mapped = await mapSupabaseUserToAppUser(supabase, sessionUser);
      if (isMountedRef.current) {
        setUser(mapped);
        setDebugMessage('Sessao carregada.');
      }
    } catch (error) {
      setDebugMessage(`Erro no mapeamento: ${getErrorMessage(error, 'erro desconhecido')}`);
      throw error;
    }
  };

  const refreshUser = async () => {
    const { supabase } = await getSupabaseModule();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message || 'Erro ao carregar sessao atual.');
    }
    await applySessionUser(data.session?.user ?? null);
  };

  useEffect(() => {
    isMountedRef.current = true;
    let active = true;

    const init = async () => {
      setDebugMessage('Iniciando getSession...');
      try {
        const { supabase } = await getSupabaseModule();
        const { data, error } = await supabase.auth.getSession();
        setDebugMessage(`getSession retornou. Error: ${error?.message || 'none'}`);
        if (!active) return;
        await applySessionUser(data.session?.user ?? null);
      } catch (error) {
        setDebugMessage(`Erro init: ${getErrorMessage(error, 'erro desconhecido')}`);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void init();

    let unsubscribe = () => {};

    void getSupabaseModule().then(({ supabase }) => {
      if (!active) return;

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setDebugMessage(`Evento auth: ${_event}`);
        if (!active) return;
        try {
          await applySessionUser(session?.user ?? null);
        } catch (error) {
          setDebugMessage(`Erro auth change: ${getErrorMessage(error, 'erro desconhecido')}`);
          if (active) {
            setUser(null);
          }
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      });

      unsubscribe = () => {
        authListener.subscription.unsubscribe();
      };
    });

    return () => {
      active = false;
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { supabase, isSupabaseConfigured } = await getSupabaseModule();

    if (!isSupabaseConfigured) {
      throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Email nao confirmado. Verifique sua caixa de entrada.');
      }
      throw new Error(error.message || 'Falha ao autenticar');
    }

    const currentUser = data.user;
    if (!currentUser) {
      throw new Error('Sessao nao inicializada');
    }

    try {
      await applySessionUser(currentUser);
    } catch (profileError) {
      await supabase.auth.signOut();
      throw profileError;
    }
  };

  const logout = async () => {
    const { supabase } = await getSupabaseModule();

    try {
      await supabase.auth.signOut();
    } finally {
      if (isMountedRef.current) {
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        refreshUser,
        debugMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
