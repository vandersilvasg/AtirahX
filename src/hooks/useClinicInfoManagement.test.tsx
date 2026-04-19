import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClinicInfoManagement } from './useClinicInfoManagement';

type QueryResult = {
  data: unknown;
  error: { message?: string } | null;
};

const mockState = vi.hoisted(() => ({
  clinicRows: [] as Array<Record<string, unknown>>,
  doctorRows: [] as Array<Record<string, unknown>>,
  existingSchedules: [] as Array<{ doctor_id: string }>,
  clinicUpdateCalls: [] as Array<Record<string, unknown>>,
  clinicInsertCalls: [] as Array<Record<string, unknown>>,
  profileUpdateCalls: [] as Array<{ payload: Record<string, unknown>; value: string }>,
  scheduleUpdateCalls: [] as Array<{ payload: Record<string, unknown>; ids: string[] }>,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  clinicUpdateError: null as { message?: string } | null,
  clinicInsertError: null as { message?: string } | null,
  profileUpdateError: null as { message?: string } | null,
  scheduleFetchError: null as { message?: string } | null,
  scheduleUpdateError: null as { message?: string } | null,
}));

vi.mock('@/lib/supabaseClientLoader', () => ({
  getSupabaseClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'clinic_info') {
        return {
          select: () => ({
            limit: () => ({
              maybeSingle: async (): Promise<QueryResult> => ({
                data: mockState.clinicRows[0] ?? null,
                error: null,
              }),
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: async (_column: string, value: string) => {
              mockState.clinicUpdateCalls.push({ ...payload, id: value });
              return { error: mockState.clinicUpdateError };
            },
          }),
          insert: (payload: Record<string, unknown>) => ({
            select: () => ({
              single: async (): Promise<QueryResult> => {
                mockState.clinicInsertCalls.push(payload);
                return {
                  data: {
                    id: 'clinic-new',
                    ...payload,
                  },
                  error: mockState.clinicInsertError,
                };
              },
            }),
          }),
        };
      }

      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              order: async (): Promise<QueryResult> => ({
                data: mockState.doctorRows,
                error: null,
              }),
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: async (_column: string, value: string) => {
              mockState.profileUpdateCalls.push({ payload, value });
              return { error: mockState.profileUpdateError };
            },
          }),
        };
      }

      if (table === 'doctor_schedules') {
        return {
          select: () => ({
            in: async (): Promise<QueryResult> => ({
              data: mockState.existingSchedules,
              error: mockState.scheduleFetchError,
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            in: async (_column: string, ids: string[]) => {
              mockState.scheduleUpdateCalls.push({ payload, ids });
              return { error: mockState.scheduleUpdateError };
            },
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockState.toastSuccess,
    error: mockState.toastError,
    warning: mockState.toastWarning,
  },
}));

describe('useClinicInfoManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.clinicRows = [
      {
        id: 'clinic-1',
        address_line: 'Rua A',
        address_number: '100',
        neighborhood: 'Centro',
        city: 'Sao Paulo',
        state: 'SP',
        zip_code: '01000-000',
        opening_hours: '08-18',
        policy_scheduling: '24h',
        policy_rescheduling: '12h',
        policy_cancellation: '6h',
        doctor_ids: ['doctor-1'],
        doctor_team: [
          { name: 'Dr. Ana', specialization: 'Cardio', consultation_price: 250 },
        ],
      },
    ];
    mockState.doctorRows = [
      {
        id: 'doctor-1',
        name: 'Dr. Ana',
        email: 'ana@example.com',
        specialization: 'Cardio',
        role: 'doctor',
        consultation_price: 200,
      },
      {
        id: 'doctor-2',
        name: 'Dr. Beto',
        email: 'beto@example.com',
        specialization: 'Clinico',
        role: 'doctor',
        consultation_price: 180,
      },
    ];
    mockState.existingSchedules = [{ doctor_id: 'doctor-2' }];
    mockState.clinicUpdateCalls = [];
    mockState.clinicInsertCalls = [];
    mockState.profileUpdateCalls = [];
    mockState.scheduleUpdateCalls = [];
    mockState.clinicUpdateError = null;
    mockState.clinicInsertError = null;
    mockState.profileUpdateError = null;
    mockState.scheduleFetchError = null;
    mockState.scheduleUpdateError = null;
  });

  it('loads clinic info, doctors and derived price state', async () => {
    const { result } = renderHook(() => useClinicInfoManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.loadingDoctors).toBe(false);
    });

    expect(result.current.clinicInfo?.id).toBe('clinic-1');
    expect(result.current.selectedDoctorIds).toEqual(['doctor-1']);
    expect(result.current.selectedDoctors).toHaveLength(1);
    expect(result.current.doctorPrices['doctor-1']).toBe(250);
    expect(result.current.formatPrice(123.4)).toBe('123,40');
  });

  it('updates clinic fields and saves the clinic info payload', async () => {
    const { result } = renderHook(() => useClinicInfoManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleChange('city', 'Campinas');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockState.clinicUpdateCalls).toContainEqual(
      expect.objectContaining({
        id: 'clinic-1',
        city: 'Campinas',
      })
    );
    expect(mockState.toastSuccess).toHaveBeenCalledWith('Informacoes salvas com sucesso');
  });

  it('saves team and prices, enabling schedules for newly added doctors', async () => {
    const { result } = renderHook(() => useClinicInfoManagement());

    await waitFor(() => {
      expect(result.current.loadingDoctors).toBe(false);
    });

    act(() => {
      result.current.toggleDoctor('doctor-2', true);
      result.current.handlePriceChange('doctor-2', '320,50');
    });

    await act(async () => {
      await result.current.handleSavePrices();
    });

    expect(mockState.profileUpdateCalls).toContainEqual({
      payload: { consultation_price: 320.5 },
      value: 'doctor-2',
    });

    await act(async () => {
      await result.current.handleSaveTeam();
    });

    expect(mockState.clinicUpdateCalls).toContainEqual(
      expect.objectContaining({
        id: 'clinic-1',
        doctor_ids: ['doctor-1', 'doctor-2'],
      })
    );
    expect(mockState.scheduleUpdateCalls).toContainEqual({
      payload: {
        seg_ativo: true,
        ter_ativo: true,
        qua_ativo: true,
        qui_ativo: true,
        sex_ativo: true,
        sab_ativo: false,
        dom_ativo: false,
      },
      ids: ['doctor-2'],
    });
    expect(mockState.toastSuccess).toHaveBeenCalledWith('Equipe medica atualizada');
  });
});
