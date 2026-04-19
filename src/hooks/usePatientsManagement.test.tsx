import { act, renderHook, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateAge,
  formatWhatsappToDDDNumber,
  getPatientInsights,
  getInitials,
  isValidDate,
  usePatientsManagement,
} from './usePatientsManagement';

type Patient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  created_at: string;
};

const mockState = vi.hoisted(() => ({
  patients: [] as Patient[],
  realtimeError: null as string | null,
  insertCalls: [] as Array<Record<string, unknown>>,
  insertError: null as { message?: string } | null,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/hooks/useRealtimeList', () => ({
  useRealtimeList: vi.fn(() => ({
    data: mockState.patients,
    loading: false,
    error: mockState.realtimeError,
  })),
}));

vi.mock('@/lib/supabaseClientLoader', () => ({
  getSupabaseClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table !== 'patients') {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        insert: async (payload: Record<string, unknown>) => {
          mockState.insertCalls.push(payload);
          return { error: mockState.insertError };
        },
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

describe('usePatientsManagement helpers', () => {
  it('formats initials, age and whatsapp number safely', () => {
    expect(getInitials('Ana Maria')).toBe('AM');
    expect(formatWhatsappToDDDNumber('5511999999999@s.whatsapp.net')).toBe('(11) 999999999');
    expect(isValidDate('2026-04-18')).toBe(true);
    expect(isValidDate('invalid-date')).toBe(false);
    expect(calculateAge('2000-01-01')).not.toBeNull();
  });
});

describe('usePatientsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.realtimeError = null;
    mockState.insertCalls = [];
    mockState.insertError = null;
    mockState.patients = [
      {
        id: 'patient-1',
        name: 'Ana Silva',
        email: 'ana@example.com',
        phone: '5511999999999',
        cpf: '12345678900',
        created_at: '2026-04-18T10:00:00.000Z',
      },
      {
        id: 'patient-2',
        name: 'Bruno Costa',
        email: 'bruno@example.com',
        phone: '5511888888888',
        cpf: '99999999999',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'patient-3',
        name: 'Clara Sem Contato',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        next_appointment_date: '2026-05-01T14:30:00.000Z',
      },
    ];
  });

  it('filters patients by search term across main fields', () => {
    const { result } = renderHook(() => usePatientsManagement());

    act(() => {
      result.current.setSearchTerm('ana');
    });

    expect(result.current.filteredPatients).toHaveLength(1);
    expect(result.current.filteredPatients[0]?.id).toBe('patient-1');
  });

  it('builds executive patient insights from the loaded base', () => {
    const { result } = renderHook(() => usePatientsManagement());

    expect(result.current.patientInsights).toMatchObject({
      totalPatients: 3,
      filteredPatients: 3,
      reachablePatients: 2,
      upcomingAppointments: 1,
      recentPatients: 2,
    });
  });

  it('creates a patient and resets dialog/form state on success', async () => {
    const { result } = renderHook(() => usePatientsManagement());

    act(() => {
      result.current.setIsCreateDialogOpen(true);
      result.current.setFormData({
        name: 'Carla Souza',
        email: 'carla@example.com',
        phone: '5511777777777',
        cpf: '00011122233',
        birth_date: '1990-05-10',
        gender: 'female',
        address: 'Rua B',
        city: 'Campinas',
        state: 'SP',
        zip_code: '13000-000',
      });
    });

    await act(async () => {
      await result.current.handleCreatePatient(createSubmitEvent());
    });

    expect(mockState.insertCalls).toContainEqual({
      name: 'Carla Souza',
      email: 'carla@example.com',
      phone: '5511777777777',
      cpf: '00011122233',
      birth_date: '1990-05-10',
      gender: 'female',
      address: 'Rua B',
      city: 'Campinas',
      state: 'SP',
      zip_code: '13000-000',
    });
    expect(mockState.toastSuccess).toHaveBeenCalledWith('Paciente cadastrado com sucesso!');
    expect(result.current.isCreateDialogOpen).toBe(false);
    expect(result.current.formData.name).toBe('');
  });

  it('surfaces insert errors and keeps the dialog open', async () => {
    mockState.insertError = { message: 'insert failed' };

    const { result } = renderHook(() => usePatientsManagement());

    act(() => {
      result.current.setIsCreateDialogOpen(true);
      result.current.setFormData({
        name: 'Paciente com erro',
        email: '',
        phone: '',
        cpf: '',
        birth_date: '',
        gender: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
      });
    });

    await act(async () => {
      await result.current.handleCreatePatient(createSubmitEvent());
    });

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });

    expect(mockState.toastError).toHaveBeenCalledWith('insert failed');
    expect(result.current.isCreateDialogOpen).toBe(true);
  });
});

describe('getPatientInsights', () => {
  it('counts reachability, upcoming appointments and recent patients safely', () => {
    const patients = [
      {
        id: '1',
        name: 'Ana',
        email: 'ana@example.com',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Bruno',
        phone: '5511999999999',
        next_appointment_date: '2026-05-01T10:00:00.000Z',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Clara',
        created_at: '2025-01-01T10:00:00.000Z',
      },
    ];

    expect(getPatientInsights(patients, patients.slice(0, 2))).toEqual({
      totalPatients: 3,
      filteredPatients: 2,
      reachablePatients: 2,
      upcomingAppointments: 1,
      recentPatients: 2,
    });
  });
});
