import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { webhookRequest } from '@/lib/webhookClient';
import { isUnauthorizedError } from '@/lib/dashboardMetrics';
import type { AgendaItem, Appointment } from '@/components/agenda/types';
import {
  type AgendaData,
  type AgendaDetailsResponse,
  type AgendaListResponse,
  type AgendaViewMode,
  getDateRangeByViewMode,
  getErrorMessage,
  mapAgendaList,
  processExternalEvents,
} from '@/lib/agendaExternalData';

interface UseAgendaExternalDataParams {
  currentDayDate: Date;
  currentMonth: Date;
  currentWeekDate: Date;
  doctorCalendarId: string | null;
  selectedAgenda: string;
  setAgendaData: (value: AgendaData | null) => void;
  setAgendas: (value: AgendaItem[]) => void;
  setDoctorCalendarId: (value: string | null) => void;
  setExternalAppointments: (value: Appointment[]) => void;
  setLoadingAgendaData: (value: boolean) => void;
  setLoadingAgendas: (value: boolean) => void;
  userId?: string;
  userRole?: string;
  viewMode: AgendaViewMode;
}

export function useAgendaExternalData({
  currentDayDate,
  currentMonth,
  currentWeekDate,
  doctorCalendarId,
  selectedAgenda,
  setAgendaData,
  setAgendas,
  setDoctorCalendarId,
  setExternalAppointments,
  setLoadingAgendaData,
  setLoadingAgendas,
  userId,
  userRole,
  viewMode,
}: UseAgendaExternalDataParams) {
  const fetchAgendas = useCallback(async () => {
    if (userRole !== 'owner') return;

    setLoadingAgendas(true);
    try {
      const data = await webhookRequest<AgendaListResponse>('/gestao-agendas', {
        method: 'POST',
        body: { funcao: 'leitura' },
      });
      const agendasList = mapAgendaList(data);

      setAgendas(agendasList);
    } catch (error: unknown) {
      if (isUnauthorizedError(error)) {
        toast.warning('A agenda externa precisa ser reconectada antes da sincronizacao.');
      } else {
        toast.error(`Erro ao buscar agendas: ${getErrorMessage(error, 'falha inesperada')}`);
      }
      setAgendas([]);
    } finally {
      setLoadingAgendas(false);
    }
  }, [setAgendas, setLoadingAgendas, userRole]);

  const fetchAgendaDetails = useCallback(
    async (tipoBusca: 'todos' | 'individual', agendaId?: string) => {
      if (userRole !== 'owner' && userRole !== 'doctor') return;

      setLoadingAgendaData(true);
      try {
        const dateRange = getDateRangeByViewMode(viewMode, {
          currentMonth,
          currentWeekDate,
          currentDayDate,
        });

        const body: {
          tipo_busca: string;
          id?: string;
          data_inicio: string;
          data_final: string;
        } = {
          tipo_busca: tipoBusca,
          data_inicio: dateRange.data_inicio,
          data_final: dateRange.data_final,
        };

        if (tipoBusca === 'individual' && agendaId) {
          body.id = agendaId;
        }

        const data = await webhookRequest<AgendaDetailsResponse | ExternalEvent[]>('/ver-agenda-medx', {
          method: 'POST',
          body,
        });

        setAgendaData(data);
        setExternalAppointments(processExternalEvents(data));
      } catch (error: unknown) {
        if (isUnauthorizedError(error)) {
          toast.warning('Agenda externa sem autorizacao. Exibindo a agenda sem sincronizacao.');
        } else {
          toast.error(`Erro ao buscar dados da agenda: ${getErrorMessage(error, 'falha inesperada')}`);
        }
        setAgendaData(null);
        setExternalAppointments([]);
      } finally {
        setLoadingAgendaData(false);
      }
    },
    [
      currentDayDate,
      currentMonth,
      currentWeekDate,
      setAgendaData,
      setExternalAppointments,
      setLoadingAgendaData,
      userRole,
      viewMode,
    ]
  );

  const fetchDoctorCalendarId = useCallback(async () => {
    if (!userId || userRole !== 'doctor') return;

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('profile_calendars')
        .select('calendar_id, calendar_name')
        .eq('profile_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.calendar_id) {
        setDoctorCalendarId(data.calendar_id);
      } else {
        setDoctorCalendarId(null);
        toast.error('Agenda nao vinculada para este medico');
      }
    } catch {
      toast.error('Erro ao buscar agenda do medico');
    }
  }, [setDoctorCalendarId, userId, userRole]);

  const refreshCurrentAgenda = useCallback(() => {
    if (userRole === 'owner' && selectedAgenda) {
      if (selectedAgenda === 'todos') {
        void fetchAgendaDetails('todos');
      } else {
        void fetchAgendaDetails('individual', selectedAgenda);
      }
      return;
    }

    if (userRole === 'doctor') {
      void fetchDoctorCalendarId();
    }
  }, [fetchAgendaDetails, fetchDoctorCalendarId, selectedAgenda, userRole]);

  useEffect(() => {
    if (userRole === 'owner') {
      void fetchAgendas();
    }
  }, [fetchAgendas, userRole]);

  useEffect(() => {
    if (userRole === 'owner' && selectedAgenda) {
      if (selectedAgenda === 'todos') {
        void fetchAgendaDetails('todos');
      } else {
        void fetchAgendaDetails('individual', selectedAgenda);
      }
    }
  }, [fetchAgendaDetails, selectedAgenda, userRole]);

  useEffect(() => {
    if (userRole === 'doctor') {
      void fetchDoctorCalendarId();
    }
  }, [fetchDoctorCalendarId, userRole]);

  useEffect(() => {
    if (userRole === 'doctor' && doctorCalendarId) {
      void fetchAgendaDetails('individual', doctorCalendarId);
    }
  }, [doctorCalendarId, fetchAgendaDetails, userRole]);

  return {
    fetchAgendas,
    fetchAgendaDetails,
    refreshCurrentAgenda,
  };
}
