import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileManagement } from './useProfileManagement';

const mockState = vi.hoisted(() => ({
  user: {
    id: 'profile-1',
    auth_id: 'auth-1',
    email: 'ana@example.com',
    name: 'Ana',
    role: 'doctor' as const,
  },
  refreshUser: vi.fn(),
  profileRow: {
    id: 'profile-1',
    name: 'Dra. Ana',
    email: 'ana@example.com',
    phone: '11999999999',
    specialization: 'Cardio',
    role: 'doctor',
    avatar_url: 'https://avatar',
    consultation_price: 250,
  },
  updateCalls: [] as Array<{ id: string; payload: Record<string, unknown> }>,
  loadError: null as { message?: string } | null,
  updateError: null as { message?: string } | null,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockState.user,
    refreshUser: mockState.refreshUser,
  }),
}));

vi.mock('@/lib/supabaseClientLoader', () => ({
  getSupabaseClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table !== 'profiles') {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: mockState.profileRow,
              error: mockState.loadError,
            }),
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: async (_column: string, value: string) => {
            mockState.updateCalls.push({ id: value, payload });
            return { error: mockState.updateError };
          },
        }),
      };
    },
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockState.toastSuccess,
    error: mockState.toastError,
  },
}));

describe('useProfileManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.updateCalls = [];
    mockState.loadError = null;
    mockState.updateError = null;
  });

  it('loads profile data and exposes role badge helpers', async () => {
    const { result } = renderHook(() => useProfileManagement());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profileData.name).toBe('Dra. Ana');
    expect(result.current.getRoleBadgeLabel('doctor')).toBe('Medico');
    expect(result.current.getRoleBadgeClassName('doctor')).toBe('bg-blue-500');
  });

  it('saves profile changes and persists avatar updates', async () => {
    const { result } = renderHook(() => useProfileManagement());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setProfileData((prev) => ({
        ...prev,
        name: 'Dra. Ana Atualizada',
        consultation_price: 300,
      }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockState.updateCalls).toContainEqual({
      id: 'profile-1',
      payload: expect.objectContaining({
        name: 'Dra. Ana Atualizada',
        consultation_price: 300,
      }),
    });
    expect(mockState.toastSuccess).toHaveBeenCalledWith('Perfil atualizado com sucesso!');

    await act(async () => {
      await result.current.persistAvatarUrl('https://novo-avatar');
    });

    expect(mockState.updateCalls).toContainEqual({
      id: 'profile-1',
      payload: { avatar_url: 'https://novo-avatar' },
    });
    expect(mockState.refreshUser).toHaveBeenCalled();
  });

  it('surfaces save errors with the backend message', async () => {
    mockState.updateError = { message: 'save failed' };

    const { result } = renderHook(() => useProfileManagement());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockState.toastError).toHaveBeenCalledWith('save failed');
  });
});
