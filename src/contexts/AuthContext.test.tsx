import { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

type MockProfileRow = {
  id: string;
  name: string | null;
  role: string | null;
  avatar_url: string | null;
};

const mockState = vi.hoisted(() => {
  const auth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  };

  const profiles = {
    maybeSingle: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
  };

  const from = vi.fn();

  return {
    auth,
    profiles,
    from,
  };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: mockState.auth,
    from: mockState.from,
  },
  isSupabaseConfigured: true,
}));

function buildProfileQuery(result: { data: MockProfileRow | null; error: { message?: string } | null }) {
  mockState.profiles.maybeSingle.mockResolvedValue(result);
  mockState.profiles.eq.mockReturnValue({
    maybeSingle: mockState.profiles.maybeSingle,
  });
  mockState.profiles.select.mockReturnValue({
    eq: mockState.profiles.eq,
  });
  mockState.from.mockImplementation((table: string) => {
    if (table !== 'profiles') {
      throw new Error(`Unexpected table ${table}`);
    }

    return {
      select: mockState.profiles.select,
    };
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
    mockState.auth.signOut.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the authenticated user from the current session', async () => {
    buildProfileQuery({
      data: {
        id: 'profile-1',
        name: 'Dra. Ana',
        role: 'doctor',
        avatar_url: null,
      },
      error: null,
    });

    mockState.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'auth-1',
            email: 'ana@example.com',
          },
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: 'profile-1',
      auth_id: 'auth-1',
      email: 'ana@example.com',
      name: 'Dra. Ana',
      role: 'doctor',
      avatar_url: undefined,
    });
  });

  it('translates invalid credentials on login', async () => {
    buildProfileQuery({ data: null, error: null });
    mockState.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockState.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.login('ana@example.com', 'bad-pass')).rejects.toThrow(
      'Email ou senha incorretos'
    );
  });

  it('logs out the session when profile mapping fails after login', async () => {
    buildProfileQuery({
      data: null,
      error: null,
    });
    mockState.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockState.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'auth-2',
          email: 'owner@example.com',
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.login('owner@example.com', '123456')).rejects.toThrow(
      'Perfil de usuario nao encontrado para esta conta.'
    );

    expect(mockState.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
