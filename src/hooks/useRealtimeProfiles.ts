import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseModule } from '@/lib/supabaseClientLoader';

interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  role: string;
  [key: string]: unknown;
}

interface UseRealtimeProfilesOptions {
  filter?: string;
  channelName: string;
  onlyUpdates?: boolean;
}

type FilterOperator = 'eq' | 'neq' | 'in';

type ProfileFilter = {
  column: string;
  operator: FilterOperator;
  value: string;
};

function parseFilter(filter?: string): ProfileFilter | null {
  if (!filter) return null;

  const [column, operator, value] = filter.split('.');
  if (!column || value === undefined) return null;
  if (operator !== 'eq' && operator !== 'neq' && operator !== 'in') return null;

  return { column, operator, value };
}

function applyProfileFilter<T>(query: T, filter: ProfileFilter | null): T {
  if (!filter) {
    return query;
  }

  switch (filter.operator) {
    case 'eq':
      return query.eq(filter.column, filter.value);
    case 'neq':
      return query.neq(filter.column, filter.value);
    case 'in':
      return query.in(filter.column, filter.value.split(','));
    default:
      return query;
  }
}

function payloadPassesFilter(
  payload: RealtimePostgresChangesPayload<Profile>,
  filter: ProfileFilter | null
): boolean {
  if (!filter) return true;

  const record =
    (payload.new as Record<string, unknown> | null | undefined) ||
    (payload.old as Record<string, unknown> | null | undefined);

  if (!record) return true;

  const value = record[filter.column];
  switch (filter.operator) {
    case 'eq':
      return value === filter.value;
    case 'neq':
      return value !== filter.value;
    case 'in':
      return filter.value.split(',').includes(String(value));
    default:
      return true;
  }
}

/**
 * Hook personalizado para escutar mudancas na tabela profiles com canal isolado.
 * Cada componente que usar este hook tera seu proprio canal realtime separado.
 */
export function useRealtimeProfiles(
  initialData: Profile[] = [],
  options: UseRealtimeProfilesOptions
) {
  const [profiles, setProfiles] = useState<Profile[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    const parsedFilter = parseFilter(options.filter);

    console.log(`[${options.channelName}] Iniciando hook`);

    const loadProfiles = async () => {
      setIsLoading(true);
      try {
        console.log(`[${options.channelName}] Carregando profiles...`);

        const supabase = await getSupabaseClient();
        let query = supabase.from('profiles').select('*');
        if (parsedFilter) {
          console.log(`[${options.channelName}] Aplicando filtro: ${options.filter}`);
          query = applyProfileFilter(query, parsedFilter);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error(`[${options.channelName}] Erro ao carregar profiles:`, error);
          return;
        }

        if (isMountedRef.current) {
          console.log(`[${options.channelName}] ${data?.length || 0} profiles carregados`);
          setProfiles((data || []) as Profile[]);
        }
      } catch (error) {
        console.error(`[${options.channelName}] Erro inesperado:`, error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    void loadProfiles();

    console.log(`[${options.channelName}] Criando canal realtime`);
    void (async () => {
      const supabaseModule = await getSupabaseModule();
      if (!isMountedRef.current) {
        return;
      }

      const channel = supabaseModule.supabase
        .channel(options.channelName)
        .on(
          'postgres_changes',
          {
            event: options.onlyUpdates ? 'UPDATE' : '*',
            schema: 'public',
            table: 'profiles',
          },
          (payload) => {
            if (!isMountedRef.current) {
              console.log(`[${options.channelName}] Evento ignorado - componente desmontado`);
              return;
            }

            const typedPayload = payload as RealtimePostgresChangesPayload<Profile>;
            console.log(`[${options.channelName}] Evento realtime:`, typedPayload.eventType);

            if (!payloadPassesFilter(typedPayload, parsedFilter)) {
              console.log(`[${options.channelName}] Evento ignorado - nao passa pelo filtro`);
              return;
            }

            setProfiles((current) => {
              const next = [...current];

              switch (typedPayload.eventType) {
                case 'INSERT':
                  if (!options.onlyUpdates) {
                    console.log(`[${options.channelName}] Adicionando novo profile`);
                    next.unshift(typedPayload.new as Profile);
                  }
                  break;

                case 'UPDATE': {
                  const updatedProfile = typedPayload.new as Profile;
                  const index = next.findIndex((profile) => profile.id === updatedProfile.id);
                  if (index !== -1) {
                    console.log(`[${options.channelName}] Atualizando profile na posicao ${index}`);
                    next[index] = updatedProfile;
                  } else {
                    console.log(`[${options.channelName}] Profile nao encontrado para atualizar`);
                  }
                  break;
                }

                case 'DELETE':
                  if (!options.onlyUpdates) {
                    const deletedProfile = typedPayload.old as Partial<Profile>;
                    const deleteIndex = next.findIndex((profile) => profile.id === deletedProfile.id);
                    if (deleteIndex !== -1) {
                      console.log(`[${options.channelName}] Removendo profile da posicao ${deleteIndex}`);
                      next.splice(deleteIndex, 1);
                    }
                  }
                  break;
              }

              return next;
            });
          }
        )
        .subscribe((status) => {
          console.log(`[${options.channelName}] Status do canal:`, status);

          if (status === 'SUBSCRIBED') {
            console.log(`[${options.channelName}] Canal ativo e escutando mudancas`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[${options.channelName}] Erro no canal`);
          } else if (status === 'TIMED_OUT') {
            console.error(`[${options.channelName}] Timeout na conexao`);
          }
        });

      channelRef.current = channel;
    })();

    return () => {
      console.log(`[${options.channelName}] Limpando hook`);
      isMountedRef.current = false;

      if (channelRef.current) {
        console.log(`[${options.channelName}] Removendo canal`);
        const channel = channelRef.current;
        channelRef.current = null;
        void getSupabaseModule().then((supabaseModule) => {
          supabaseModule.supabase.removeChannel(channel);
        });
      }
    };
  }, [options.channelName, options.filter, options.onlyUpdates]);

  const refetch = async () => {
    console.log(`[${options.channelName}] Refetch manual iniciado`);
    setIsLoading(true);

    try {
      const supabase = await getSupabaseClient();
      let query = supabase.from('profiles').select('*');
      query = applyProfileFilter(query, parseFilter(options.filter));

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error(`[${options.channelName}] Erro no refetch:`, error);
        return;
      }

      if (isMountedRef.current) {
        console.log(`[${options.channelName}] Refetch concluido: ${data?.length || 0} profiles`);
        setProfiles((data || []) as Profile[]);
      }
    } catch (error) {
      console.error(`[${options.channelName}] Erro inesperado no refetch:`, error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return {
    profiles,
    isLoading,
    refetch,
    count: profiles.length,
  } as const;
}
