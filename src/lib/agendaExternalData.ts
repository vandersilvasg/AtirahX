import type { AgendaItem, Appointment } from '@/components/agenda/types';

type ErrorWithMessage = {
  message?: string;
};

export type AgendaData = unknown;

export type AgendaViewMode = 'month' | 'week' | 'day';

export type AgendaCalendarRow = {
  'Calendar ID'?: string;
  'Calendar Name'?: string;
  'Time Zone'?: string;
  'Access Role'?: string;
  Color?: string;
  'Primary Calendar'?: string;
  Selected?: string;
  events?: ExternalEvent[];
};

export type AgendaListResponse = {
  count?: number;
  calendars?: AgendaCalendarRow[];
};

export type ExternalEvent = {
  id?: string;
  eventId?: string;
  summary?: string;
  title?: string;
  nome?: string;
  name?: string;
  subject?: string;
  description?: string;
  notes?: string;
  descricao?: string;
  status?: string;
  data_inicio?: string;
  scheduled_at?: string;
  start_date?: string;
  date?: string;
  begin?: string;
  calendarId?: string;
  calendar_id?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  creator?: {
    email?: string;
    displayName?: string;
  };
  organizer?: {
    email?: string;
    displayName?: string;
  };
  events?: ExternalEvent[];
};

export type AgendaDetailsResponse = {
  events?: ExternalEvent[];
  items?: ExternalEvent[];
  data?: ExternalEvent[];
  calendars?: Array<{
    events?: ExternalEvent[];
  }>;
  body?:
    | {
        events?: ExternalEvent[];
      }
    | ExternalEvent[];
};

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (isObject(error) && typeof (error as ErrorWithMessage).message === 'string') {
    return (error as ErrorWithMessage).message as string;
  }
  return fallback;
}

export function mapAgendaList(data?: AgendaListResponse | null): AgendaItem[] {
  if (!data?.calendars || !Array.isArray(data.calendars)) {
    return [];
  }

  return data.calendars
    .filter((calendar) => calendar['Primary Calendar'] !== 'Yes')
    .map((calendar) => ({
      id: calendar['Calendar ID'],
      nome: calendar['Calendar Name'],
      timeZone: calendar['Time Zone'],
      accessRole: calendar['Access Role'],
      color: calendar['Color'],
      isPrimary: calendar['Primary Calendar'] === 'Yes',
      isSelected: calendar['Selected'] === 'Yes',
    }));
}

export function translateHolidayName(name: string): string {
  const translations: Record<string, string> = {
    "Our Lady of Aparecida / Children's Day": 'Nossa Senhora Aparecida / Dia das Criancas',
    "Teacher's Day": 'Dia do Professor',
    'Public Service Holiday': 'Dia do Servidor Publico',
    "New Year's Day": 'Ano Novo',
    Carnival: 'Carnaval',
    'Good Friday': 'Sexta-feira Santa',
    "Tiradentes' Day": 'Tiradentes',
    'Labour Day': 'Dia do Trabalhador',
    'Corpus Christi': 'Corpus Christi',
    'Independence Day': 'Independencia do Brasil',
    "All Souls' Day": 'Finados',
    'Republic Day': 'Proclamacao da Republica',
    'Black Consciousness Day': 'Dia da Consciencia Negra',
    'Christmas Day': 'Natal',
    'Christmas Eve': 'Vespera de Natal',
  };

  return translations[name] || name;
}

export function normalizeEventDate(value: string): string {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T12:00:00`;
  }

  const midnightUtcMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(\.\d+)?Z$/i);
  if (midnightUtcMatch) {
    return `${midnightUtcMatch[1]}T12:00:00`;
  }

  return trimmed;
}

function extractEvents(data: unknown): ExternalEvent[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as ExternalEvent[];
  if (isObject(data) && Array.isArray((data as AgendaDetailsResponse).events)) {
    return (data as AgendaDetailsResponse).events as ExternalEvent[];
  }
  if (isObject(data) && Array.isArray((data as AgendaDetailsResponse).items)) {
    return (data as AgendaDetailsResponse).items as ExternalEvent[];
  }
  if (isObject(data) && Array.isArray((data as AgendaDetailsResponse).data)) {
    return (data as AgendaDetailsResponse).data as ExternalEvent[];
  }
  if (isObject(data) && Array.isArray((data as AgendaDetailsResponse).calendars)) {
    return ((data as AgendaDetailsResponse).calendars ?? []).flatMap((calendar) =>
      Array.isArray(calendar?.events) ? calendar.events : []
    );
  }
  if (
    isObject(data) &&
    isObject((data as AgendaDetailsResponse).body) &&
    Array.isArray(((data as AgendaDetailsResponse).body as { events?: ExternalEvent[] }).events)
  ) {
    return ((data as AgendaDetailsResponse).body as { events?: ExternalEvent[] }).events ?? [];
  }
  if (isObject(data) && Array.isArray((data as AgendaDetailsResponse).body)) {
    return (data as AgendaDetailsResponse).body as ExternalEvent[];
  }

  return [];
}

function mapExternalEvent(event: ExternalEvent, index: number): Appointment | null {
  let scheduledAt: string;

  if (event.start?.dateTime) {
    scheduledAt = normalizeEventDate(event.start.dateTime);
  } else if (event.start?.date) {
    scheduledAt = normalizeEventDate(event.start.date);
  } else if (event.data_inicio) {
    scheduledAt = normalizeEventDate(event.data_inicio);
  } else if (event.scheduled_at) {
    scheduledAt = normalizeEventDate(event.scheduled_at);
  } else if (event.start_date) {
    scheduledAt = normalizeEventDate(String(event.start_date));
  } else if (event.date) {
    scheduledAt = normalizeEventDate(String(event.date));
  } else if (event.begin) {
    scheduledAt = normalizeEventDate(String(event.begin));
  } else {
    return null;
  }

  const isHoliday =
    event.creator?.email?.includes('holiday@group.v.calendar.google.com') ||
    event.organizer?.email?.includes('holiday@group.v.calendar.google.com') ||
    event.creator?.displayName?.toLowerCase().includes('holiday') ||
    event.organizer?.displayName?.toLowerCase().includes('holiday');

  const rawTitle = event.summary || event.title || event.nome || event.name || event.subject || '';
  const eventName = isHoliday ? translateHolidayName(rawTitle || 'Sem titulo') : rawTitle || 'Sem titulo';
  const calendarId = event.calendarId || event.calendar_id || event.organizer?.email || null;

  if (!calendarId || calendarId === 'todos') {
    return null;
  }

  let eventStatus: string;
  if (isHoliday) {
    eventStatus = 'holiday';
  } else if (event.status === 'cancelled') {
    eventStatus = 'cancelled';
  } else {
    const eventDate = new Date(scheduledAt);
    const now = new Date();
    if (eventDate < now) {
      eventStatus = 'completed';
    } else if (event.status === 'confirmed') {
      eventStatus = 'confirmed';
    } else {
      eventStatus = 'scheduled';
    }
  }

  return {
    id: event.id || event.eventId || `external-${index}`,
    patient_id: eventName,
    doctor_id: calendarId,
    scheduled_at: scheduledAt,
    status: eventStatus,
    notes: event.description || event.notes || event.descricao || '',
  };
}

export function processExternalEvents(data: unknown): Appointment[] {
  try {
    return extractEvents(data)
      .filter((event) => {
        const hasId = event && (event.id || event.eventId);
        const hasDate =
          event?.start?.dateTime ||
          event?.start?.date ||
          event?.data_inicio ||
          event?.scheduled_at ||
          event?.start_date ||
          event?.date ||
          event?.begin;

        return Boolean(hasId && hasDate);
      })
      .map((event, index) => mapExternalEvent(event, index))
      .filter((event): event is Appointment => event !== null);
  } catch {
    return [];
  }
}

export function formatDateWithoutTimezone(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function getMonthDateRange(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 0, 0, 0, 0);
  const lastDay = new Date(year, month + 1, 1, 23, 59, 59);

  return {
    data_inicio: formatDateWithoutTimezone(firstDay),
    data_final: formatDateWithoutTimezone(lastDay),
  };
}

export function getWeekDateRange(date: Date) {
  const currentDate = new Date(date);
  const day = currentDate.getDay();
  const firstDay = new Date(currentDate);
  firstDay.setDate(currentDate.getDate() - day);
  firstDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 6);
  lastDay.setHours(23, 59, 59, 999);

  return {
    data_inicio: formatDateWithoutTimezone(firstDay),
    data_final: formatDateWithoutTimezone(lastDay),
  };
}

export function getDayDateRange(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    data_inicio: formatDateWithoutTimezone(startOfDay),
    data_final: formatDateWithoutTimezone(endOfDay),
  };
}

export function getDateRangeByViewMode(
  viewMode: AgendaViewMode,
  dates: {
    currentMonth: Date;
    currentWeekDate: Date;
    currentDayDate: Date;
  }
) {
  if (viewMode === 'month') {
    return getMonthDateRange(dates.currentMonth);
  }

  if (viewMode === 'week') {
    return getWeekDateRange(dates.currentWeekDate);
  }

  return getDayDateRange(dates.currentDayDate);
}
