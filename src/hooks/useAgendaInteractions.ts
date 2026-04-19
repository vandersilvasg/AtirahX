import { useEffect, useState } from 'react';
import type { AgendaItem, Appointment } from '@/components/agenda/types';
import {
  buildLocalSchedules,
  buildMovedEventDateRange,
  buildMovedEventPayload,
  getAgendaInteractionErrorMessage,
  getCreateEventStartTime,
  resolveAgendaDoctorName,
} from '@/lib/agendaInteractions';
import {
  useDoctorSchedule,
  type DoctorSchedule,
} from '@/hooks/useDoctorSchedule';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { webhookRequest } from '@/lib/webhookClient';
import { toast } from 'sonner';

type DayOfWeek = {
  label: string;
  value: number;
};

type UseAgendaInteractionsParams = {
  agendas: AgendaItem[];
  daysOfWeek: DayOfWeek[];
  externalAppointments: Appointment[];
  refreshCurrentAgenda: () => void;
  selectedAgenda: string;
  userId?: string;
  userRole?: string;
};

export function useAgendaInteractions({
  agendas,
  daysOfWeek,
  externalAppointments,
  refreshCurrentAgenda,
  selectedAgenda,
  userId,
  userRole,
}: UseAgendaInteractionsParams) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [createEventDate, setCreateEventDate] = useState<Date | undefined>();
  const [createEventStartTime, setCreateEventStartTime] = useState<string | undefined>();
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Appointment | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localSchedules, setLocalSchedules] = useState<Record<number, DoctorSchedule>>({});

  const {
    schedules,
    loading: schedulesLoading,
    saveAllSchedules,
  } = useDoctorSchedule(userRole === 'doctor' ? userId ?? '' : '');

  useEffect(() => {
    if (userRole !== 'doctor' || !userId) return;

    const scheduleMap = buildLocalSchedules(daysOfWeek, schedules, userId, schedulesLoading);

    if (Object.keys(scheduleMap).length > 0) {
      setLocalSchedules(scheduleMap);
    }
  }, [daysOfWeek, schedules, schedulesLoading, userId, userRole]);

  const refreshOwnerAgenda = () => {
    if (userRole === 'owner' && selectedAgenda) {
      refreshCurrentAgenda();
    }
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    const appointmentCopy = { ...appointment };

    if (appointmentCopy.doctor_id && appointmentCopy.doctor_id !== 'todos') {
      try {
        const supabase = await getSupabaseClient();
        const { data: calendarData } = await supabase
          .from('profile_calendars')
          .select('profile_id, calendar_name')
          .eq('calendar_id', appointmentCopy.doctor_id)
          .single();

        if (calendarData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', calendarData.profile_id)
            .single();

          appointmentCopy.doctor_id = resolveAgendaDoctorName(
            appointmentCopy.doctor_id,
            agendas,
            profileData?.name,
            calendarData.calendar_name
          );
        } else {
          appointmentCopy.doctor_id = resolveAgendaDoctorName(appointmentCopy.doctor_id, agendas);
        }
      } catch (error) {
        console.error('[Agenda] Erro ao buscar nome do medico:', error);
      }
    }

    setSelectedAppointment(appointmentCopy);
    setIsDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCreateEventDate(date);
    setCreateEventStartTime(getCreateEventStartTime(date));
    setIsCreateEventModalOpen(true);
  };

  const handleEventCreated = () => {
    refreshOwnerAgenda();
  };

  const handleEventUpdated = () => {
    setIsDialogOpen(false);
    refreshOwnerAgenda();
  };

  const handleEventDeleted = () => {
    setIsDialogOpen(false);
    refreshOwnerAgenda();
  };

  const handleEditEvent = (appointment: Appointment) => {
    setEventToEdit(appointment);
    setIsEditEventModalOpen(true);
  };

  const handleDeleteEventClick = (appointment: Appointment) => {
    const originalEvent = externalAppointments.find((item) => item.id === appointment.id);
    setEventToDelete(originalEvent || appointment);
    setShowDeleteDialog(true);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    if (!eventToDelete.doctor_id || eventToDelete.doctor_id === 'todos') {
      toast.error('Agenda nao identificada para este evento');
      return;
    }

    setIsDeleting(true);
    try {
      await webhookRequest<unknown>('/apagar-evento', {
        method: 'POST',
        body: {
          event_id: eventToDelete.id,
          calendar_id: eventToDelete.doctor_id,
        },
      });

      toast.success('Evento deletado com sucesso!');
      setShowDeleteDialog(false);
      setIsDialogOpen(false);
      setEventToDelete(null);
      refreshOwnerAgenda();
    } catch (error: unknown) {
      toast.error(
        `Erro ao deletar evento: ${getAgendaInteractionErrorMessage(error, 'falha inesperada')}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEventMoved = async (eventId: string, newDate: Date) => {
    const event = externalAppointments.find((item) => item.id === eventId);
    if (!event) {
      toast.error('Evento nao encontrado');
      return;
    }

    if (event.status === 'holiday') {
      toast.error('Feriados nao podem ser movidos');
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { data: patientData } = await supabase
        .from('patients')
        .select('name, email, phone')
        .ilike('name', event.patient_id)
        .limit(1)
        .single();

      const { data: doctorData } = await supabase
        .from('profiles')
        .select('id, name, email, specialization')
        .eq('role', 'doctor')
        .limit(1);

      const { data: calendarData } = await supabase
        .from('profile_calendars')
        .select('profile_id, calendar_id')
        .eq('calendar_id', event.doctor_id)
        .limit(1)
        .single();

      const doctor =
        calendarData && doctorData
          ? doctorData.find((item) => item.id === calendarData.profile_id)
          : null;

      const { newDateTime, endDateTime } = buildMovedEventDateRange(event.scheduled_at, newDate);

      if (!event.doctor_id || event.doctor_id === 'todos') {
        toast.error('Agenda nao identificada para este evento');
        return;
      }

      await webhookRequest<unknown>('/editar-evento', {
        method: 'POST',
        body: buildMovedEventPayload(event, eventId, patientData, doctor, newDateTime, endDateTime),
      });

      toast.success('Evento movido com sucesso!');
      refreshOwnerAgenda();
    } catch (error: unknown) {
      toast.error(
        `Erro ao mover evento: ${getAgendaInteractionErrorMessage(error, 'falha inesperada')}`
      );
    }
  };

  const handleScheduleChange = <K extends keyof DoctorSchedule>(
    dayOfWeek: number,
    field: K,
    value: DoctorSchedule[K]
  ) => {
    setLocalSchedules((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedules = async () => {
    if (!userId || userRole !== 'doctor') return;

    setIsSaving(true);
    try {
      await saveAllSchedules(localSchedules);
      toast.success('Horarios salvos com sucesso!');
    } catch (error: unknown) {
      toast.error(
        `Erro ao salvar horarios: ${getAgendaInteractionErrorMessage(error, 'falha inesperada')}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    createEventDate,
    createEventStartTime,
    eventToDelete,
    eventToEdit,
    handleAppointmentClick,
    handleDayClick,
    handleDeleteEvent,
    handleDeleteEventClick,
    handleEditEvent,
    handleEventCreated,
    handleEventDeleted,
    handleEventMoved,
    handleEventUpdated,
    handleSaveSchedules,
    handleScheduleChange,
    isCreateEventModalOpen,
    isDeleting,
    isDialogOpen,
    isEditEventModalOpen,
    isSaving,
    localSchedules,
    selectedAppointment,
    setIsCreateEventModalOpen,
    setIsDialogOpen,
    setIsEditEventModalOpen,
    setShowDeleteDialog,
    showDeleteDialog,
  };
}
