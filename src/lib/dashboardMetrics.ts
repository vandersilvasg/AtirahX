export interface DashboardMetrics {
  consultasHoje: number;
  consultasMesAtual: number;
  consultasMesAnterior: number;
  pacientesCRM: number;
  pacientesCRMMesAtual: number;
  pacientesCRMMesAnterior: number;
  prePatientes: number;
  totalMedicos: number;
  totalSecretarias: number;
  mensagensHoje: number;
  mensagensMesAtual: number;
  followupsPendentes: number;
  prontuariosCriados: number;
  consultasIA: number;
  jornadaAgendado: number;
  jornadaAguardando: number;
  jornadaEmAtendimento: number;
  jornadaFinalizado: number;
  jornadaCancelado: number;
  automacaoPendentes: number;
  automacaoEnviadosHoje: number;
  automacaoFalhas: number;
  listaEsperaAtivos: number;
  listaEsperaOfertasPendentes: number;
  loading: boolean;
  error: string | null;
}

export type MetricCounts = Omit<DashboardMetrics, 'loading' | 'error'>;

export interface DashboardMetricsRpcRow {
  consultas_hoje?: number | null;
  consultas_mes_atual?: number | null;
  consultas_mes_anterior?: number | null;
  total_pacientes_crm?: number | null;
  pacientes_mes_atual?: number | null;
  pacientes_mes_anterior?: number | null;
  total_pre_pacientes?: number | null;
  total_medicos?: number | null;
  total_secretarias?: number | null;
  mensagens_hoje?: number | null;
  mensagens_mes_atual?: number | null;
  followups_pendentes?: number | null;
  prontuarios_criados?: number | null;
  consultas_ia?: number | null;
}

export const EMPTY_METRICS: MetricCounts = {
  consultasHoje: 0,
  consultasMesAtual: 0,
  consultasMesAnterior: 0,
  pacientesCRM: 0,
  pacientesCRMMesAtual: 0,
  pacientesCRMMesAnterior: 0,
  prePatientes: 0,
  totalMedicos: 0,
  totalSecretarias: 0,
  mensagensHoje: 0,
  mensagensMesAtual: 0,
  followupsPendentes: 0,
  prontuariosCriados: 0,
  consultasIA: 0,
  jornadaAgendado: 0,
  jornadaAguardando: 0,
  jornadaEmAtendimento: 0,
  jornadaFinalizado: 0,
  jornadaCancelado: 0,
  automacaoPendentes: 0,
  automacaoEnviadosHoje: 0,
  automacaoFalhas: 0,
  listaEsperaAtivos: 0,
  listaEsperaOfertasPendentes: 0,
};

type DashboardDateRanges = {
  startTodayIso: string;
  endTodayIso: string;
  startCurrentMonthIso: string;
  startNextMonthIso: string;
  startLastMonthIso: string;
};

export function getDashboardDateRanges(now = new Date()): DashboardDateRanges {
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const endToday = new Date(startToday);
  endToday.setDate(endToday.getDate() + 1);

  const startCurrentMonth = new Date(startToday.getFullYear(), startToday.getMonth(), 1);
  const startNextMonth = new Date(startToday.getFullYear(), startToday.getMonth() + 1, 1);
  const startLastMonth = new Date(startToday.getFullYear(), startToday.getMonth() - 1, 1);

  return {
    startTodayIso: startToday.toISOString(),
    endTodayIso: endToday.toISOString(),
    startCurrentMonthIso: startCurrentMonth.toISOString(),
    startNextMonthIso: startNextMonth.toISOString(),
    startLastMonthIso: startLastMonth.toISOString(),
  };
}

export function getSafeMetricCount(
  count: number | null,
  error: { message: string } | null,
  label = 'CRM'
) {
  if (error) {
    console.warn(`Erro ao buscar count de ${label}:`, error.message);
    return 0;
  }

  return count || 0;
}

export function buildMetricCountsFromRpcData(
  data: DashboardMetricsRpcRow,
  crmMetrics: Pick<
    MetricCounts,
    | 'jornadaAgendado'
    | 'jornadaAguardando'
    | 'jornadaEmAtendimento'
    | 'jornadaFinalizado'
    | 'jornadaCancelado'
    | 'automacaoPendentes'
    | 'automacaoEnviadosHoje'
    | 'automacaoFalhas'
    | 'listaEsperaAtivos'
    | 'listaEsperaOfertasPendentes'
  >
): MetricCounts {
  return {
    consultasHoje: data.consultas_hoje || 0,
    consultasMesAtual: data.consultas_mes_atual || 0,
    consultasMesAnterior: data.consultas_mes_anterior || 0,
    pacientesCRM: data.total_pacientes_crm || 0,
    pacientesCRMMesAtual: data.pacientes_mes_atual || 0,
    pacientesCRMMesAnterior: data.pacientes_mes_anterior || 0,
    prePatientes: data.total_pre_pacientes || 0,
    totalMedicos: data.total_medicos || 0,
    totalSecretarias: data.total_secretarias || 0,
    mensagensHoje: data.mensagens_hoje || 0,
    mensagensMesAtual: data.mensagens_mes_atual || 0,
    followupsPendentes: data.followups_pendentes || 0,
    prontuariosCriados: data.prontuarios_criados || 0,
    consultasIA: data.consultas_ia || 0,
    ...crmMetrics,
  };
}

export function getDashboardErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== 'object') return false;

  const code =
    'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
  const message = getDashboardErrorMessage(error, '').toLowerCase();

  return code === '42703' || message.includes(columnName.toLowerCase());
}

export function isUnauthorizedError(error: unknown) {
  const message = getDashboardErrorMessage(error, '').toLowerCase();
  return message.includes('401') || message.includes('unauthorized') || message.includes('sessao expirada');
}

export function calculateDashboardTrend(current: number, previous: number): string {
  if (previous === 0 && current === 0) return '0%';
  if (previous === 0) return '+100%';

  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${Math.round(diff)}%`;
}
