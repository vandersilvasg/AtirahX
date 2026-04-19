import { act, renderHook, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatWhatsappToDDDNumber,
  getPrePatientInsights,
  getQuickStageAction,
  matchesPrePatientSegment,
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
  stage?: string | null;
  source_channel?: string | null;
  estimated_value?: number | null;
  temperature?: 'frio' | 'morno' | 'quente' | null;
  compareceu?: boolean | null;
  fechou?: boolean | null;
  no_show?: boolean | null;
  next_action?: string | null;
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
    setData: (updater: ((previous: PrePatient[]) => PrePatient[]) | PrePatient[]) => {
      mockState.rows =
        typeof updater === 'function'
          ? updater(mockState.rows as PrePatient[])
          : (updater as PrePatient[]);
    },
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
        stage: 'lead_novo',
        source_channel: 'instagram',
        estimated_value: 1200,
        temperature: 'quente',
        compareceu: false,
        fechou: false,
        no_show: false,
        next_action: 'Ligar hoje',
        created_at: '2026-04-18T10:00:00.000Z',
      },
      {
        id: 'pre-2',
        name: 'Bruno',
        email: 'bruno@example.com',
        phone: '5511888888888',
        health_insurance: 'Bradesco',
        status: 'contato',
        area_interest: 'Orto',
        stage: 'fechou',
        source_channel: 'google',
        estimated_value: 2400,
        temperature: 'morno',
        compareceu: true,
        fechou: true,
        no_show: false,
        next_action: null,
        created_at: '2026-04-10T10:00:00.000Z',
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

  it('builds commercial insights and filters by segment', () => {
    const { result } = renderHook(() => usePrePatientsManagement());

    expect(result.current.prePatientInsights).toMatchObject({
      totalLeads: 2,
      filteredLeads: 2,
      hotLeads: 1,
      followUpLeads: 1,
      convertedLeads: 1,
      pipelineValue: 3600,
    });

    act(() => {
      result.current.setActiveSegment('hot');
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]?.id).toBe('pre-1');

    act(() => {
      result.current.setActiveSegment('converted');
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]?.id).toBe('pre-2');
  });

  it('combines segment and search filters for commercial triage', () => {
    const { result } = renderHook(() => usePrePatientsManagement());

    act(() => {
      result.current.setActiveSegment('follow_up');
      result.current.setSearchTerm('ana');
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]?.id).toBe('pre-1');
    expect(result.current.prePatientInsights.filteredLeads).toBe(1);
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

    expect(mockState.insertCalls).toContainEqual(
      expect.objectContaining({
        name: 'Novo Lead',
        email: 'lead@example.com',
        phone: '5511888888888',
        health_insurance: 'Bradesco',
        status: 'contato',
        area_interest: 'Orto',
      })
    );

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
      payload: expect.objectContaining({
        name: 'Ana Atualizada',
        email: 'ana@example.com',
        phone: '5511999999999',
        health_insurance: 'Unimed',
        status: 'qualificado',
        area_interest: 'Cardio',
      }),
    });

    await act(async () => {
      await result.current.handleDelete('pre-1');
    });

    expect(mockState.deleteCalls).toContain('pre-1');
    expect(mockState.toastSuccess).toHaveBeenCalledWith('Pre paciente removido.');
  });

  it('advances lead stage quickly with optimistic feedback', async () => {
    const { result } = renderHook(() => usePrePatientsManagement());

    await act(async () => {
      await result.current.handleQuickStageAdvance(mockState.rows[0] as never);
    });

    expect(mockState.updateCalls).toContainEqual({
      id: 'pre-1',
      payload: expect.objectContaining({
        stage: 'contato_iniciado',
        last_contact_at: expect.any(String),
      }),
    });
    expect(mockState.rows[0]?.stage).toBe('contato_iniciado');
    expect(mockState.toastSuccess).toHaveBeenCalledWith('Lead movido para Contato iniciado.');
  });
});

describe('pre patient helpers', () => {
  it('matches commercial segments consistently', () => {
    const hotLead = {
      id: '1',
      name: 'Ana',
      email: 'ana@example.com',
      phone: null,
      health_insurance: null,
      status: null,
      area_interest: null,
      stage: 'lead_novo',
      source_channel: 'instagram',
      estimated_value: 1500,
      temperature: 'quente' as const,
      compareceu: false,
      fechou: false,
      no_show: false,
      next_action: 'Ligar',
      created_at: new Date().toISOString(),
    };
    const convertedLead = {
      ...hotLead,
      id: '2',
      stage: 'fechou',
      fechou: true,
      next_action: null,
    };

    expect(matchesPrePatientSegment(hotLead, 'all')).toBe(true);
    expect(matchesPrePatientSegment(hotLead, 'hot')).toBe(true);
    expect(matchesPrePatientSegment(hotLead, 'follow_up')).toBe(true);
    expect(matchesPrePatientSegment(convertedLead, 'converted')).toBe(true);
  });

  it('aggregates pre-patient insights safely', () => {
    const leads = [
      {
        id: '1',
        name: 'Ana',
        email: 'ana@example.com',
        phone: null,
        health_insurance: null,
        status: null,
        area_interest: null,
        stage: 'lead_novo',
        source_channel: 'instagram',
        estimated_value: 1000,
        temperature: 'quente' as const,
        compareceu: false,
        fechou: false,
        no_show: false,
        next_action: 'Chamar',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Bruno',
        email: null,
        phone: '5511888888888',
        health_insurance: null,
        status: null,
        area_interest: null,
        stage: 'fechou',
        source_channel: 'google',
        estimated_value: 2000,
        temperature: 'morno' as const,
        compareceu: true,
        fechou: true,
        no_show: false,
        next_action: null,
        created_at: new Date().toISOString(),
      },
    ];

    expect(getPrePatientInsights(leads, leads.slice(0, 1))).toEqual({
      totalLeads: 2,
      filteredLeads: 1,
      hotLeads: 1,
      followUpLeads: 1,
      convertedLeads: 1,
      pipelineValue: 3000,
    });
  });

  it('suggests the next quick commercial action from the current stage', () => {
    expect(
      getQuickStageAction({
        id: '1',
        name: 'Ana',
        email: 'ana@example.com',
        phone: null,
        health_insurance: null,
        status: null,
        area_interest: null,
        stage: 'lead_novo',
        source_channel: 'instagram',
        estimated_value: 1000,
        temperature: 'quente',
        compareceu: false,
        fechou: false,
        no_show: false,
        next_action: 'Chamar',
        response_time_seconds: null,
        last_contact_at: null,
        procedure_interest: null,
        lost_reason: null,
        created_at: new Date().toISOString(),
      })
    ).toEqual({
      label: 'Iniciar contato',
      targetStage: 'contato_iniciado',
    });
  });
});
