import type { Appointment } from './types';

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export function getAgendaStatusBadgeVariant(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    scheduled: 'default',
    confirmed: 'default',
    cancelled: 'destructive',
    completed: 'secondary',
    pending: 'outline',
    holiday: 'secondary',
  };

  return variants[status] || 'default';
}

export function getAgendaStatusLabel(status: string) {
  const labels: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
    pending: 'Pendente',
    holiday: 'Feriado',
  };

  return labels[status] || status;
}

export function formatAgendaDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatAgendaTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatAgendaDateTime(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isHolidayAppointment(appointment: Appointment | null | undefined) {
  return appointment?.status === 'holiday';
}
