import type { AgendaItem, Appointment } from '@/components/agenda/types';
import type { DoctorSchedule } from '@/hooks/useDoctorSchedule';

type ErrorWithMessage = {
  message?: string;
};

type DayOfWeek = {
  label: string;
  value: number;
};

type DoctorData = {
  email?: string | null;
  name?: string | null;
  specialization?: string | null;
};

type PatientData = {
  email?: string | null;
  name?: string | null;
};

export function isAgendaObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getAgendaInteractionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (isAgendaObject(error) && typeof (error as ErrorWithMessage).message === 'string') {
    return (error as ErrorWithMessage).message as string;
  }

  return fallback;
}

export function createDefaultSchedule(
  dayOfWeek: number,
  doctorId: string,
  isActive: boolean
): DoctorSchedule {
  return {
    doctor_id: doctorId,
    day_of_week: dayOfWeek,
    start_time: '08:00',
    end_time: '18:00',
    appointment_duration: 30,
    break_start_time: '12:00',
    break_end_time: '13:00',
    is_active: isActive,
  };
}

export function buildLocalSchedules(
  daysOfWeek: DayOfWeek[],
  schedules: DoctorSchedule[],
  doctorId: string,
  schedulesLoading: boolean
) {
  const scheduleMap: Record<number, DoctorSchedule> = {};

  if (schedules.length > 0) {
    schedules.forEach((schedule) => {
      scheduleMap[schedule.day_of_week] = schedule;
    });

    daysOfWeek.forEach((day) => {
      if (!scheduleMap[day.value]) {
        scheduleMap[day.value] = createDefaultSchedule(day.value, doctorId, false);
      }
    });
  } else if (!schedulesLoading) {
    daysOfWeek.forEach((day) => {
      scheduleMap[day.value] = createDefaultSchedule(
        day.value,
        doctorId,
        day.value >= 1 && day.value <= 5
      );
    });
  }

  return scheduleMap;
}

export function getCreateEventStartTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (hours === 0 && minutes === 0) {
    return '09:00';
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function resolveAgendaDoctorName(
  doctorId: string,
  agendas: AgendaItem[],
  calendarProfileName?: string | null,
  calendarName?: string | null
) {
  if (calendarProfileName) return calendarProfileName;
  if (calendarName) return calendarName;

  const agenda = agendas.find((item) => item.id === doctorId);
  return agenda?.nome || doctorId;
}

export function buildMovedEventDateRange(scheduledAt: string, newDate: Date) {
  const originalDate = new Date(scheduledAt);
  const newDateTime = new Date(newDate);
  newDateTime.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);

  const endDateTime = new Date(newDateTime);
  endDateTime.setHours(endDateTime.getHours() + 1);

  return { newDateTime, endDateTime };
}

export function formatWebhookDateTime(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hourValue = String(date.getHours()).padStart(2, '0');
  const minuteValue = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hourValue}:${minuteValue}:00`;
}

export function buildMovedEventPayload(
  event: Appointment,
  eventId: string,
  patientData: PatientData | null,
  doctor: DoctorData | null,
  newDateTime: Date,
  endDateTime: Date
) {
  return {
    event_id: eventId,
    calendar_id: event.doctor_id,
    nome_paciente: patientData?.name || event.patient_id,
    email_paciente: patientData?.email || '',
    nome_medico: doctor?.name || '',
    email_medico: doctor?.email || '',
    especialidade_medico: doctor?.specialization || '',
    tipo_consulta: 'retorno',
    data_inicio: formatWebhookDateTime(newDateTime),
    data_final: formatWebhookDateTime(endDateTime),
    notas: event.notes || '',
  };
}
