import { act, renderHook, waitFor } from '@testing-library/react';
import type { DragEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCrmJourney } from './useCrmJourney';

type RealtimeTable = 'pre_patients';

type PrePatient = {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null;
  stage: string | null;
  source_channel: string | null;
  estimated_value: number | null;
  temperature: 'frio' | 'morno' | 'quente' | null;
  next_action: string | null;
  procedure_interest: string | null;
  last_contact_at: string | null;
  lost_reason: string | null;
  created_at: string | null;
};

const mockState = vi.hoisted(() => ({
  initialData: {
    pre_patients: [] as PrePatient[],
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

function createDragEvent(prePatientId: string): DragEvent<HTMLDivElement> {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      getData: vi.fn(() => prePatientId),
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
      pre_patients: [
        {
          id: 'lead-1',
          name: 'Ana',
          phone: '5511999999999',
          status: null,
          stage: 'lead_novo',
          source_channel: 'instagram',
          estimated_value: 1200,
          temperature: 'quente',
          next_action: 'Ligar hoje',
          procedure_interest: 'Consulta premium',
          last_contact_at: null,
          lost_reason: null,
          created_at: '2026-04-18T10:00:00.000Z',
        },
      ],
    };
  });

  it('groups pre patients by normalized stage', () => {
    const { result } = renderHook(() => useCrmJourney());

    expect(result.current.loading).toBe(false);
    expect(result.current.prePatientsByStage.lead_novo).toHaveLength(1);
    expect(result.current.prePatients[0]?.name).toBe('Ana');
  });

  it('moves a lead optimistically and persists the new stage on success', async () => {
    const { result } = renderHook(() => useCrmJourney());

    await act(async () => {
      await result.current.handleDropOnStage(createDragEvent('lead-1'), 'fechou');
    });

    await waitFor(() => {
      expect(result.current.prePatientsByStage.fechou).toHaveLength(1);
    });

    expect(mockState.updatePayloads).toHaveLength(1);
    expect(mockState.updatePayloads[0]).toMatchObject({
      stage: 'fechou',
      fechou: true,
      compareceu: true,
      no_show: false,
      temperature: 'quente',
    });
    expect(mockState.eqValues).toEqual([{ column: 'id', value: 'lead-1' }]);
    expect(mockState.success).toHaveBeenCalledWith('Lead movido para Fechou.');
    expect(result.current.updatingPrePatientId).toBeNull();
  });

  it('rolls back the optimistic move when the database update fails', async () => {
    mockState.updateError = { message: 'update failed' };

    const { result } = renderHook(() => useCrmJourney());

    await act(async () => {
      await result.current.handleDropOnStage(createDragEvent('lead-1'), 'perdido');
    });

    await waitFor(() => {
      expect(result.current.prePatientsByStage.lead_novo).toHaveLength(1);
    });

    expect(result.current.prePatientsByStage.perdido).toHaveLength(0);
    expect(mockState.error).toHaveBeenCalledWith('update failed');
    expect(result.current.updatingPrePatientId).toBeNull();
  });
});
