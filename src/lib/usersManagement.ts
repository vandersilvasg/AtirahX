export type UserRole = 'owner' | 'doctor' | 'secretary';

export type CalendarData = Record<string, string>;

export type WebhookCalendarsResponse =
  | {
      count?: number;
      calendars?: Array<CalendarData | string>;
    }
  | CalendarData
  | string;

export type CreateUserFormData = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  role: 'doctor' | 'secretary';
  password: string;
};

export type EditUserFormData = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  role: UserRole;
  avatar_url: string;
};

export const DEFAULT_CREATE_FORM: CreateUserFormData = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  role: 'doctor',
  password: '',
};

export const DEFAULT_EDIT_FORM: EditUserFormData = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  role: 'doctor',
  avatar_url: '',
};

export function getUsersErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function parseCalendarData(data: unknown): CalendarData {
  if (typeof data === 'string') {
    const lines = data.split('\n').filter((line) => line.trim());
    const calendar: CalendarData = {};
    lines.forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        calendar[key] = value;
      }
    });
    return calendar;
  }

  return (data as CalendarData) ?? {};
}
