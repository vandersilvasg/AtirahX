import { act, renderHook, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatWhatsappToDDDNumber,
  usePrePatientsManagement,
} from './usePrePatientsManagement';

type PrePatient = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  health_insurance: string | null;
  status: string | null;
  area_interest: string | null;
  created_at: string;
};

const mockState = vi.hoisted(() => ({
  rows: [] as PrePatient[],
  error: null as string | null,
  insertCalls: [] as Array<Record<string, unknown>>,
  updateCalls: [] as Array<{ id: string; payload: Record<string, unknown> }>,
  deleteCalls: [] as string[],
  insertError: null as { message?: string } | null,
  updateError: null as { message?: string } | null,
  deleteError: null as { message?: string } | null,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/hooks/useRealtimeList', () => ({
  useRealtimeList: vi.fn(() => ({
    data: mockState.rows,
    loading: false,
    error: mockState.error,
  })),
}));

vi.mock('@/lib/supabaseClientLoader', () => ({
  getSupabaseClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table !== 'pre_patients') {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        insert: async (payload: Record<string, unknown>) => {
          mockState.insertCalls.push(payload);
          return { error: mockState.insertError };
        },
        update: (payload: Record<string, unknown>) => ({
          eq: async (_column: string, value: string) => {
            mockState.updateCalls.push({ id: value, payload });
            return { error: mockState.updateError };
          },
        }),
        delete: () => ({
          eq: async (_column: string, value: string) => {
            mockState.deleteCalls.push(value);
            return { error: mockState.deleteError };
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

function createSubmitEvent() {
  return {
    preventDefault: vi.fn(),
  } as unknown as FormEvent<HTMLFormElement>;
}

describe('usePrePatientsManagement helpers', () => {
  it('formats whatsapp numbers safely', () => {
    expect(formatWhatsappToDDDNumber('5511999999999@s.whatsapp.net')).toBe('(11) 999999999');
    expect(formatWhatsappToDDDNumber(null)).toBe('-');
  });
});

describe('usePrePatientsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.error = null;
    mockState.insertCalls = [];
    mockState.updateCalls = [];
    mockState.deleteCalls = [];
    mockState.insertError = null;
    mockState.updateError = null;
    mockState.deleteError = null;
    mockState.rows = [
      {
        id: 'pre-1',
        name: 'Ana',
        email: 'ana@example.com',
        phone: '5511999999999',
        health_insurance: 'Unimed',
        status: 'novo',
        area_interest: 'Cardio',
        created_at: '2026-04-18T10:00:00.000Z',
      },
    ];
  });

  it('filters rows and opens create/edit flows', () => {
    const { result } = renderHook(() => usePrePatientsManagement());

    act(() => {
      result.current.setSearchTerm('uni');
      result.current.openCreate();
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.isCreateDialogOpen).toBe(true);

    act(() => {
      result.current.openEdit(mockState.rows[0]!);
    });

    expect(result.current.isEditDialogOpen).toBe(true);
    expect(result.current.formData.name).toBe('Ana');
  });

  it('creates, updates and deletes pre-patients successfully', async () => {
    const { result } = renderHook(() => usePrePatientsManagement());

    act(() => {
      result.current.setFormData({
        name: 'Novo Lead',
        email: 'lead@example.com',
        phone: '5511888888888',
        health_insurance: 'Bradesco',
        status: 'contato',
        area_interest: 'Orto',
      });
      result.current.setIsCreateDialogOpen(true);
    });

    await act(async () => {
      await result.current.handleCreate(createSubmitEvent());
    });

    expect(mockState.insertCalls).toContainEqual({
      name: 'Novo Lead',
      email: 'lead@example.com',
      phone: '5511888888888',
      health_insurance: 'Bradesco',
      status: 'contato',
      area_interest: 'Orto',
    });

    act(() => {
      result.current.openEdit(mockState.rows[0]!);
      result.current.setFormData({
        name: 'Ana Atualizada',
        email: 'ana@example.com',
        phone: '5511999999999',
        health_insurance: 'Unimed',
        status: 'qualificado',
        area_interest: 'Cardio',
      });
    });

    await act(async () => {
      await result.current.handleUpdate(createSubmitEvent());
    });

    expect(mockState.updateCalls).toContainEqual({
      id: 'pre-1',
      payload: {
        name: 'Ana Atualizada',
        email: 'ana@example.com',
        phone: '5511999999999',
        health_insurance: 'Unimed',
        status: 'qualificado',
        area_interest: 'Cardio',
      },
    });

    await act(async () => {
      await result.current.handleDelete('pre-1');
    });

    expect(mockState.deleteCalls).toContain('pre-1');
    expect(mockState.toastSuccess).toHaveBeenCalledWith('Pre paciente removido.');
  });
});
