import { act, renderHook, waitFor } from '@testing-library/react';
import type { DragEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCrmJourney } from './useCrmJourney';

type RealtimeTable = 'appointments' | 'patients' | 'profiles';

type Appointment = {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  status: string | null;
  journey_stage: string | null;
  scheduled_at: string | null;
  appointment_date: string | null;
  reason: string | null;
  notes: string | null;
};

type Patient = {
  id: string;
  name: string;
  phone: string | null;
};

type Doctor = {
  id: string;
  name: string | null;
  role: string | null;
};

const mockState = vi.hoisted(() => ({
  initialData: {
    appointments: [] as Appointment[],
    patients: [] as Patient[],
    profiles: [] as Doctor[],
  },
  updatePayloads: [] as Array<Record<string, unknown>>,
  eqValues: [] as Array<{ column: string; value: string }>,
  updateError: null as { message: string } | null,
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/hooks/useRealtimeList', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    useRealtimeList: vi.fn(({ table }: { table: RealtimeTable }) => {
      const [data, setData] = React.useState(mockState.initialData[table]);
      return {
        data,
        setData,
        loading: false,
        error: null,
      };
    }),
  };
});

vi.mock('@/lib/supabaseClientLoader', () => ({
  getSupabaseClient: vi.fn(async () => ({
    from: () => ({
      update: (payload: Record<string, unknown>) => {
        mockState.updatePayloads.push(payload);
        return {
          eq: async (column: string, value: string) => {
            mockState.eqValues.push({ column, value });
            return { error: mockState.updateError };
          },
        };
      },
    }),
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockState.success,
    error: mockState.error,
  },
}));

function createDragEvent(appointmentId: string): DragEvent<HTMLDivElement> {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      getData: vi.fn(() => appointmentId),
      setData: vi.fn(),
      effectAllowed: 'move',
      dropEffect: 'move',
    },
  } as unknown as DragEvent<HTMLDivElement>;
}

describe('useCrmJourney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.updatePayloads = [];
    mockState.eqValues = [];
    mockState.updateError = null;
    mockState.initialData = {
      appointments: [
        {
          id: 'appt-1',
          patient_id: 'patient-1',
          doctor_id: 'doctor-1',
          status: 'scheduled',
          journey_stage: 'agendado',
          scheduled_at: '2026-04-18T10:00:00.000Z',
          appointment_date: null,
          reason: 'Consulta',
          notes: null,
        },
      ],
      patients: [{ id: 'patient-1', name: 'Ana', phone: '5511999999999' }],
      profiles: [{ id: 'doctor-1', name: 'Dr. Bruno', role: 'doctor' }],
    };
  });

  it('maps entities and groups appointments by normalized stage', () => {
    const { result } = renderHook(() => useCrmJourney());

    expect(result.current.loading).toBe(false);
    expect(result.current.appointmentsByStage.agendado).toHaveLength(1);
    expect(result.current.patientById.get('patient-1')?.name).toBe('Ana');
    expect(result.current.doctorById.get('doctor-1')?.name).toBe('Dr. Bruno');
  });

  it('moves an appointment optimistically and persists the new stage on success', async () => {
    const { result } = renderHook(() => useCrmJourney());

    await act(async () => {
      await result.current.handleDropOnStage(createDragEvent('appt-1'), 'finalizado');
    });

    await waitFor(() => {
      expect(result.current.appointmentsByStage.finalizado).toHaveLength(1);
    });

    expect(mockState.updatePayloads).toEqual([
      { journey_stage: 'finalizado', status: 'completed' },
    ]);
    expect(mockState.eqValues).toEqual([{ column: 'id', value: 'appt-1' }]);
    expect(mockState.success).toHaveBeenCalledWith('Paciente movido para Finalizado.');
    expect(result.current.updatingAppointmentId).toBeNull();
  });

  it('rolls back the optimistic move when the database update fails', async () => {
    mockState.updateError = { message: 'update failed' };

    const { result } = renderHook(() => useCrmJourney());

    await act(async () => {
      await result.current.handleDropOnStage(createDragEvent('appt-1'), 'cancelado');
    });

    await waitFor(() => {
      expect(result.current.appointmentsByStage.agendado).toHaveLength(1);
    });

    expect(result.current.appointmentsByStage.cancelado).toHaveLength(0);
    expect(mockState.error).toHaveBeenCalledWith('update failed');
    expect(result.current.updatingAppointmentId).toBeNull();
  });
});
