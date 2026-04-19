import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useWhatsAppConversationData } from './useWhatsAppConversationData';

const medxMocks = vi.hoisted(() => ({
  listMedxSessions: vi.fn(),
  listMessagesBySession: vi.fn(),
  extractMessageText: vi.fn((value: string) => value),
}));

const supabaseMocks = vi.hoisted(() => {
  const patientsSelect = vi.fn();
  const prePatientsSelect = vi.fn();
  const patientDoctorsSelect = vi.fn();
  const channelOn = vi.fn();
  const channelSubscribe = vi.fn();
  const removeChannel = vi.fn();
  const realtimeHandlers = new Map<string, (payload?: Record<string, unknown>) => void>();

  return {
    patientsSelect,
    prePatientsSelect,
    patientDoctorsSelect,
    channelOn,
    channelSubscribe,
    removeChannel,
    realtimeHandlers,
  };
});

vi.mock('@/lib/medxHistory', () => ({
  listMedxSessions: medxMocks.listMedxSessions,
  listMessagesBySession: medxMocks.listMessagesBySession,
  extractMessageText: medxMocks.extractMessageText,
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'patients') {
        return { select: supabaseMocks.patientsSelect };
      }
      if (table === 'pre_patients') {
        return { select: supabaseMocks.prePatientsSelect };
      }
      if (table === 'patient_doctors') {
        return { select: supabaseMocks.patientDoctorsSelect };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    channel: () => ({
      on: supabaseMocks.channelOn,
    }),
    removeChannel: supabaseMocks.removeChannel,
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

function createDoctorQuery(profile: { id: string; name: string; specialization?: string | null } | null) {
  const maybeSingle = vi.fn();
  const limit = vi.fn();
  const order = vi.fn();
  const eq = vi.fn();

  maybeSingle
    .mockResolvedValueOnce({
      data: profile
        ? {
            doctor_id: profile.id,
            is_primary: true,
            profiles: profile,
          }
        : null,
      error: profile ? null : { message: 'not found' },
    })
    .mockResolvedValue({
      data: profile
        ? {
            doctor_id: profile.id,
            is_primary: false,
            profiles: profile,
          }
        : null,
      error: profile ? null : { message: 'not found' },
    });

  limit.mockReturnValue({ maybeSingle });
  order.mockReturnValue({ limit, maybeSingle });
  eq
    .mockReturnValueOnce({ eq, maybeSingle })
    .mockReturnValue({ order, limit, maybeSingle });

  return { eq };
}

describe('useWhatsAppConversationData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.realtimeHandlers.clear();

    medxMocks.listMedxSessions.mockResolvedValue([
      {
        sessionId: 'patient-1',
        lastMessagePreview: 'Consulta confirmada',
      },
      {
        sessionId: 'pre-1',
        lastMessagePreview: 'Novo lead interessado',
      },
    ]);

    medxMocks.listMessagesBySession.mockResolvedValue([
      { id: 'm-1', message: 'Mensagem 1' },
    ]);

    supabaseMocks.patientsSelect.mockResolvedValue({
      data: [{ id: 'patient-1', name: 'Ana Souza', phone: '5511999999999@s.whatsapp.net' }],
    });

    supabaseMocks.prePatientsSelect.mockResolvedValue({
      data: [{ id: 'pre-1', name: 'Bruno Lead', phone: '5511888888888' }],
    });

    supabaseMocks.patientDoctorsSelect.mockImplementation(() =>
      createDoctorQuery({ id: 'doc-1', name: 'Dr. Silva', specialization: 'Cardio' })
    );

    supabaseMocks.channelOn.mockImplementation((_type, config, callback) => {
      const key = `${config.table}:${config.event}`;
      supabaseMocks.realtimeHandlers.set(key, callback);
      return {
        on: supabaseMocks.channelOn,
        subscribe: supabaseMocks.channelSubscribe,
      };
    });

    supabaseMocks.channelSubscribe.mockReturnValue({ id: 'channel-1' });
  });

  it('classifies sessions, filters by tab/search and resolves selected data', async () => {
    const setSelectedSessionId = vi.fn();

    const { result } = renderHook(
      () =>
        useWhatsAppConversationData({
          search: 'ana',
          selectedSessionId: 'patient-1',
          setSelectedSessionId,
          tab: 'crm',
        }),
      { wrapper: createWrapper().Wrapper }
    );

    await waitFor(() => {
      expect(result.current.loadingSessions).toBe(false);
      expect(result.current.loadingMessages).toBe(false);
    });

    expect(result.current.filteredSessions).toHaveLength(1);
    expect(result.current.filteredSessions[0]).toMatchObject({
      sessionId: 'patient-1',
      kind: 'patient',
      displayName: 'Ana Souza',
    });
    expect(result.current.selectedSession?.sessionId).toBe('patient-1');
    expect(result.current.patientPhone).toBe('5511999999999');
    expect(result.current.assignedDoctor).toMatchObject({
      id: 'doc-1',
      name: 'Dr. Silva',
      specialization: 'Cardio',
    });
    expect(result.current.messages).toHaveLength(1);
    expect(setSelectedSessionId).not.toHaveBeenCalled();
  });

  it('auto-selects the first session when none is selected', async () => {
    const setSelectedSessionId = vi.fn();

    renderHook(
      () =>
        useWhatsAppConversationData({
          search: '',
          selectedSessionId: null,
          setSelectedSessionId,
          tab: 'all',
        }),
      { wrapper: createWrapper().Wrapper }
    );

    await waitFor(() => {
      expect(setSelectedSessionId).toHaveBeenCalledWith('patient-1');
    });
  });

  it('invalidates conversation queries when realtime events arrive for medx_history and contacts', async () => {
    const setSelectedSessionId = vi.fn();
    const { Wrapper, queryClient } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(
      () =>
        useWhatsAppConversationData({
          search: '',
          selectedSessionId: 'patient-1',
          setSelectedSessionId,
          tab: 'all',
        }),
      { wrapper: Wrapper }
    );

    await waitFor(() => {
      expect(supabaseMocks.realtimeHandlers.size).toBeGreaterThanOrEqual(4);
    });

    supabaseMocks.realtimeHandlers.get('medx_history:INSERT')?.({
      new: { session_id: 'patient-1' },
    });
    supabaseMocks.realtimeHandlers.get('patients:*')?.({});
    supabaseMocks.realtimeHandlers.get('pre_patients:*')?.({});

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['medx_sessions'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['medx_messages', 'patient-1'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['patients_min'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['pre_patients_min'] });
    });
  });
});
