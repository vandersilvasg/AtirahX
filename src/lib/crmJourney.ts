import type { PrePatientRow, StageConfig, StageKey } from '@/hooks/useCrmJourney';

export const CRM_STAGES: StageConfig[] = [
  {
    key: 'lead_novo',
    label: 'Lead novo',
    badgeClass: 'border-slate-200 bg-slate-500/10 text-slate-700',
  },
  {
    key: 'contato_iniciado',
    label: 'Contato iniciado',
    badgeClass: 'border-blue-200 bg-blue-500/10 text-blue-700',
  },
  {
    key: 'qualificado',
    label: 'Qualificado',
    badgeClass: 'border-violet-200 bg-violet-500/10 text-violet-700',
  },
  {
    key: 'agendado',
    label: 'Agendado',
    badgeClass: 'border-cyan-200 bg-cyan-500/10 text-cyan-700',
  },
  {
    key: 'compareceu',
    label: 'Compareceu',
    badgeClass: 'border-emerald-200 bg-emerald-500/10 text-emerald-700',
  },
  {
    key: 'fechou',
    label: 'Fechou',
    badgeClass: 'border-green-200 bg-green-500/10 text-green-700',
  },
  {
    key: 'perdido',
    label: 'Perdido',
    badgeClass: 'border-rose-200 bg-rose-500/10 text-rose-700',
  },
];

const STAGE_KEYS = new Set<StageKey>(CRM_STAGES.map((stage) => stage.key));

const STAGE_ALIASES: Record<string, StageKey> = {
  lead_novo: 'lead_novo',
  novo: 'lead_novo',
  new: 'lead_novo',
  pre: 'lead_novo',
  contato_iniciado: 'contato_iniciado',
  contato: 'contato_iniciado',
  responded: 'contato_iniciado',
  qualificado: 'qualificado',
  qualified: 'qualificado',
  agendado: 'agendado',
  scheduled: 'agendado',
  compareceu: 'compareceu',
  attended: 'compareceu',
  fechou: 'fechou',
  won: 'fechou',
  perdido: 'perdido',
  lost: 'perdido',
};

export function normalizeStage(stage: string | null | undefined): StageKey {
  if (!stage) return 'lead_novo';

  const normalized = stage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');

  if (STAGE_KEYS.has(normalized as StageKey)) {
    return normalized as StageKey;
  }

  return STAGE_ALIASES[normalized] || 'lead_novo';
}

export function formatDateLabel(rawDate: string | null): string {
  if (!rawDate) return 'Sem data';

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return 'Sem data';

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

function getSortTimestamp(prePatient: PrePatientRow): number {
  const rawDate = prePatient.last_contact_at ?? prePatient.created_at ?? null;
  if (!rawDate) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(rawDate).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

export function groupPrePatientsByStage(prePatients: PrePatientRow[]) {
  const grouped: Record<StageKey, PrePatientRow[]> = {
    lead_novo: [],
    contato_iniciado: [],
    qualificado: [],
    agendado: [],
    compareceu: [],
    fechou: [],
    perdido: [],
  };

  prePatients.forEach((prePatient) => {
    grouped[normalizeStage(prePatient.stage)].push(prePatient);
  });

  CRM_STAGES.forEach((stage) => {
    grouped[stage.key].sort((a, b) => getSortTimestamp(a) - getSortTimestamp(b));
  });

  return grouped;
}

export function getStageLabel(targetStage: StageKey) {
  return CRM_STAGES.find((stage) => stage.key === targetStage)?.label ?? targetStage;
}
