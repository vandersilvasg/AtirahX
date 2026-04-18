import type { AppointmentRow, DoctorRow, PatientRow, StageConfig, StageKey } from '@/hooks/useCrmJourney';

export const CRM_STAGES: StageConfig[] = [
  {
    key: 'agendado',
    label: 'Agendado',
    badgeClass: 'border-blue-200 bg-blue-500/10 text-blue-700',
  },
  {
    key: 'aguardando',
    label: 'Aguardando',
    badgeClass: 'border-amber-200 bg-amber-500/10 text-amber-700',
  },
  {
    key: 'em_atendimento',
    label: 'Em atendimento',
    badgeClass: 'border-indigo-200 bg-indigo-500/10 text-indigo-700',
  },
  {
    key: 'finalizado',
    label: 'Finalizado',
    badgeClass: 'border-emerald-200 bg-emerald-500/10 text-emerald-700',
  },
  {
    key: 'cancelado',
    label: 'Cancelado',
    badgeClass: 'border-rose-200 bg-rose-500/10 text-rose-700',
  },
];

const STAGE_KEYS = new Set<StageKey>(CRM_STAGES.map((stage) => stage.key));

const STAGE_ALIASES: Record<string, StageKey> = {
  agendado: 'agendado',
  scheduled: 'agendado',
  novo: 'agendado',
  new: 'agendado',
  aguardando: 'aguardando',
  waiting: 'aguardando',
  em_atendimento: 'em_atendimento',
  ematendimento: 'em_atendimento',
  in_progress: 'em_atendimento',
  inprogress: 'em_atendimento',
  atendimento: 'em_atendimento',
  finalizado: 'finalizado',
  concluido: 'finalizado',
  concluded: 'finalizado',
  completed: 'finalizado',
  done: 'finalizado',
  cancelado: 'cancelado',
  canceled: 'cancelado',
  cancelled: 'cancelado',
};

export function normalizeStage(stage: string | null | undefined): StageKey {
  if (!stage) return 'agendado';

  const normalized = stage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');

  if (STAGE_KEYS.has(normalized as StageKey)) {
    return normalized as StageKey;
  }

  return STAGE_ALIASES[normalized] || 'agendado';
}

export function getAppointmentDateRaw(appointment: AppointmentRow): string | null {
  return appointment.scheduled_at ?? appointment.appointment_date ?? null;
}

function getSortTimestamp(appointment: AppointmentRow): number {
  const rawDate = getAppointmentDateRaw(appointment);
  if (!rawDate) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(rawDate).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

export function formatDateLabel(rawDate: string | null): string {
  if (!rawDate) return 'Sem data definida';

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return 'Sem data valida';

  const hasTime = rawDate.includes('T');
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(hasTime ? { timeStyle: 'short' } : {}),
  }).format(parsed);
}

export function formatPhone(rawPhone?: string | null): string {
  if (!rawPhone) return 'Sem telefone';

  const atIndex = rawPhone.indexOf('@');
  const withoutDomain = atIndex >= 0 ? rawPhone.slice(0, atIndex) : rawPhone;
  const digits = withoutDomain.replace(/\D/g, '');

  if (!digits) return 'Sem telefone';

  const local = digits.length > 11 ? digits.slice(-11) : digits;
  if (local.length < 10) return local;

  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  return `(${ddd}) ${number}`;
}

export function createEntityMap<T extends PatientRow | DoctorRow>(items: T[]) {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(item.id, item));
  return map;
}

export function groupAppointmentsByStage(appointments: AppointmentRow[]) {
  const grouped: Record<StageKey, AppointmentRow[]> = {
    agendado: [],
    aguardando: [],
    em_atendimento: [],
    finalizado: [],
    cancelado: [],
  };

  appointments.forEach((appointment) => {
    grouped[normalizeStage(appointment.journey_stage)].push(appointment);
  });

  CRM_STAGES.forEach((stage) => {
    grouped[stage.key].sort((a, b) => getSortTimestamp(a) - getSortTimestamp(b));
  });

  return grouped;
}

export function getNextAppointmentStatus(targetStage: StageKey, previousStatus: string | null) {
  if (targetStage === 'finalizado') return 'completed';
  if (targetStage === 'cancelado') return 'cancelled';
  return previousStatus;
}

export function getStageLabel(targetStage: StageKey) {
  return CRM_STAGES.find((stage) => stage.key === targetStage)?.label ?? targetStage;
}
