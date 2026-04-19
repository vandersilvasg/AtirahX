import { useEffect, useState } from 'react';
import {
  getDashboardDateRanges,
  getDashboardErrorMessage,
  isMissingColumnError,
} from '@/lib/dashboardMetrics';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';

type ChannelMetricsRow = {
  source_channel: string | null;
  total_leads: number | null;
  total_fechados: number | null;
  valor_pipeline: number | null;
  valor_fechado: number | null;
  valor_perdido: number | null;
};

type PrePatientGrowthRow = {
  id: string;
  stage: string | null;
  compareceu: boolean | null;
  fechou: boolean | null;
  no_show: boolean | null;
  estimated_value: number | null;
  response_time_seconds: number | null;
  source_channel: string | null;
  created_at: string | null;
  lost_reason: string | null;
  procedure_interest: string | null;
};

export type GrowthDashboardMetrics = {
  faturamentoEstimado: number;
  faturamentoRealizado: number;
  consultasAgendadas: number;
  taxaConversao: number;
  taxaNoShow: number;
  tempoMedioRespostaSegundos: number;
  pacientesPerdidos: number;
  perdaReceita: number;
  principalGargalo: string;
  funnel: {
    leadsNovos: number;
    respondidos: number;
    qualificados: number;
    agendados: number;
    compareceram: number;
    fechados: number;
  };
  lossReasons: Array<{
    label: string;
    total: number;
    valor: number;
  }>;
  canais: Array<{
    source_channel: string;
    total_leads: number;
    total_fechados: number;
    valor_pipeline: number;
    valor_fechado: number;
    valor_perdido: number;
  }>;
  insights: string[];
  loading: boolean;
  error: string | null;
};

const EMPTY_METRICS: Omit<GrowthDashboardMetrics, 'loading' | 'error'> = {
  faturamentoEstimado: 0,
  faturamentoRealizado: 0,
  consultasAgendadas: 0,
  taxaConversao: 0,
  taxaNoShow: 0,
  tempoMedioRespostaSegundos: 0,
  pacientesPerdidos: 0,
  perdaReceita: 0,
  principalGargalo: 'Sem dados suficientes',
  funnel: {
    leadsNovos: 0,
    respondidos: 0,
    qualificados: 0,
    agendados: 0,
    compareceram: 0,
    fechados: 0,
  },
  lossReasons: [],
  canais: [],
  insights: [],
};

const toNumber = (value: number | null | undefined) => Number(value ?? 0);

const calculatePercentage = (numerator: number, denominator: number) => {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
};

const getPrincipalGargalo = (funnel: GrowthDashboardMetrics['funnel']) => {
  const transitions = [
    { label: 'Leads novos -> Respondidos', from: funnel.leadsNovos, to: funnel.respondidos },
    { label: 'Respondidos -> Qualificados', from: funnel.respondidos, to: funnel.qualificados },
    { label: 'Qualificados -> Agendados', from: funnel.qualificados, to: funnel.agendados },
    { label: 'Agendados -> Compareceram', from: funnel.agendados, to: funnel.compareceram },
    { label: 'Compareceram -> Fecharam', from: funnel.compareceram, to: funnel.fechados },
  ].filter((transition) => transition.from > 0);

  if (transitions.length === 0) return 'Sem dados suficientes';

  const worst = transitions
    .map((transition) => ({
      ...transition,
      conversion: transition.from ? transition.to / transition.from : 0,
    }))
    .sort((a, b) => a.conversion - b.conversion)[0];

  return worst?.label ?? 'Sem dados suficientes';
};

const buildInsights = (metrics: Omit<GrowthDashboardMetrics, 'loading' | 'error'>) => {
  const insights: string[] = [];

  if (metrics.tempoMedioRespostaSegundos > 600) {
    insights.push('Voce perdeu oportunidades por demora de resposta acima de 10 minutos.');
  }
  if (metrics.canais.length > 0) {
    const bestChannel = [...metrics.canais].sort((a, b) => b.valor_fechado - a.valor_fechado)[0];
    if (bestChannel?.valor_fechado) {
      insights.push(`${bestChannel.source_channel} foi o canal com melhor conversao no periodo.`);
    }
  }
  if (metrics.principalGargalo !== 'Sem dados suficientes') {
    insights.push(`Maior gargalo atual do funil: ${metrics.principalGargalo}.`);
  }
  if (metrics.taxaNoShow >= 20) {
    insights.push('No-show elevado. Priorize confirmacao ativa e lembretes automaticos.');
  }
  if (metrics.lossReasons.length > 0) {
    const topReason = metrics.lossReasons[0];
    insights.push(
      `Principal motivo de perda: ${topReason.label} (${topReason.total} oportunidades).`
    );
  }
  if (insights.length === 0) {
    insights.push('Operacao estavel. Continue acompanhando conversao, resposta e no-show diariamente.');
  }

  return insights;
};

export const useGrowthDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<GrowthDashboardMetrics>({
    ...EMPTY_METRICS,
    loading: true,
    error: null,
  });

  const fetchMetrics = async () => {
    try {
      setMetrics((prev) => ({ ...prev, loading: true, error: null }));
      const supabase = await getSupabaseClient();
      const { startCurrentMonthIso, startNextMonthIso, now } = {
        ...getDashboardDateRanges(),
        now: new Date().toISOString(),
      };

      const [appointmentsResult, doctorsResult, prePatientsResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('doctor_id, status, journey_stage, scheduled_at, appointment_date')
          .gte('scheduled_at', startCurrentMonthIso)
          .lt('scheduled_at', startNextMonthIso),
        supabase.from('profiles').select('id, consultation_price').eq('role', 'doctor'),
        supabase
          .from('pre_patients')
          .select(
            'id, stage, compareceu, fechou, no_show, estimated_value, response_time_seconds, source_channel, created_at, lost_reason, procedure_interest'
          )
          .gte('created_at', startCurrentMonthIso)
          .lt('created_at', startNextMonthIso),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;

      const appointments = appointmentsResult.data ?? [];
      let doctors = doctorsResult.data ?? [];
      if (doctorsResult.error) {
        if (isMissingColumnError(doctorsResult.error, 'consultation_price')) {
          const fallbackDoctors = await supabase.from('profiles').select('id').eq('role', 'doctor');
          if (fallbackDoctors.error) throw fallbackDoctors.error;
          doctors = fallbackDoctors.data ?? [];
        } else {
          throw doctorsResult.error;
        }
      }

      const prePatients = ((prePatientsResult.data ?? []) as PrePatientGrowthRow[]) ?? [];

      const doctorPriceMap = new Map(
        doctors.map((doctor) => [
          doctor.id,
          Number((doctor as { consultation_price?: number }).consultation_price ?? 0),
        ])
      );

      let faturamentoEstimado = 0;
      let consultasAgendadas = 0;
      let noShowCountFromAppointments = 0;

      appointments.forEach((appointment) => {
        const row = appointment as {
          doctor_id?: string | null;
          status?: string | null;
          journey_stage?: string | null;
          scheduled_at?: string | null;
          appointment_date?: string | null;
        };
        const scheduleDate = row.scheduled_at ?? row.appointment_date;
        if (!scheduleDate) return;

        if (row.status === 'no_show') {
          noShowCountFromAppointments += 1;
        }

        if (
          scheduleDate >= now &&
          row.status !== 'cancelled' &&
          row.status !== 'completed' &&
          row.journey_stage !== 'cancelado' &&
          row.journey_stage !== 'finalizado'
        ) {
          consultasAgendadas += 1;
          const doctorPrice = row.doctor_id ? doctorPriceMap.get(row.doctor_id) ?? 0 : 0;
          faturamentoEstimado += doctorPrice;
        }
      });

      const funnel = prePatients.reduce(
        (acc, row) => {
          const stage = row.stage ?? '';
          if (stage === 'lead_novo') acc.leadsNovos += 1;
          if (stage === 'contato_iniciado') acc.respondidos += 1;
          if (stage === 'qualificado') acc.qualificados += 1;
          if (stage === 'agendado') acc.agendados += 1;
          if (row.compareceu || stage === 'compareceu') acc.compareceram += 1;
          if (row.fechou || stage === 'fechou') acc.fechados += 1;
          return acc;
        },
        {
          leadsNovos: 0,
          respondidos: 0,
          qualificados: 0,
          agendados: 0,
          compareceram: 0,
          fechados: 0,
        }
      );

      const pacientesPerdidos = prePatients.filter((row) => row.stage === 'perdido').length;
      const perdaReceita = prePatients
        .filter((row) => row.stage === 'perdido')
        .reduce((sum, row) => sum + toNumber(row.estimated_value), 0);
      const faturamentoRealizado = prePatients
        .filter((row) => row.fechou || row.stage === 'fechou')
        .reduce((sum, row) => sum + toNumber(row.estimated_value), 0);

      const responseRows = prePatients.filter(
        (row) => row.response_time_seconds !== null && row.response_time_seconds !== undefined
      );
      const respostaMedia = responseRows.length
        ? Number(
            (
              responseRows.reduce((sum, row) => sum + toNumber(row.response_time_seconds), 0) /
              responseRows.length
            ).toFixed(2)
          )
        : 0;

      const totalLeads = prePatients.length;
      const taxaConversao = calculatePercentage(funnel.fechados, totalLeads);
      const noShowFromLeads = prePatients.filter((row) => Boolean(row.no_show)).length;
      const taxaNoShow = calculatePercentage(
        noShowFromLeads + noShowCountFromAppointments,
        Math.max(consultasAgendadas, funnel.agendados + funnel.compareceram + noShowFromLeads)
      );

      const channelMap = new Map<string, ChannelMetricsRow>();
      prePatients.forEach((row) => {
        const source = row.source_channel || 'nao_informado';
        const current = channelMap.get(source) ?? {
          source_channel: source,
          total_leads: 0,
          total_fechados: 0,
          valor_pipeline: 0,
          valor_fechado: 0,
          valor_perdido: 0,
        };
        current.total_leads = toNumber(current.total_leads) + 1;
        current.valor_pipeline = toNumber(current.valor_pipeline) + toNumber(row.estimated_value);
        if (row.fechou || row.stage === 'fechou') {
          current.total_fechados = toNumber(current.total_fechados) + 1;
          current.valor_fechado = toNumber(current.valor_fechado) + toNumber(row.estimated_value);
        }
        if (row.stage === 'perdido') {
          current.valor_perdido = toNumber(current.valor_perdido) + toNumber(row.estimated_value);
        }
        channelMap.set(source, current);
      });

      const canais = [...channelMap.values()]
        .map((row) => ({
          source_channel: row.source_channel || 'nao_informado',
          total_leads: toNumber(row.total_leads),
          total_fechados: toNumber(row.total_fechados),
          valor_pipeline: toNumber(row.valor_pipeline),
          valor_fechado: toNumber(row.valor_fechado),
          valor_perdido: toNumber(row.valor_perdido),
        }))
        .sort((a, b) => b.valor_fechado - a.valor_fechado);

      const lossReasonMap = new Map<string, { total: number; valor: number }>();
      prePatients
        .filter((row) => row.stage === 'perdido')
        .forEach((row) => {
          const reason =
            row.lost_reason?.trim().toLowerCase() ||
            (row.no_show
              ? 'faltou'
              : row.response_time_seconds && row.response_time_seconds > 600
                ? 'nao respondeu'
                : 'nao fechou');
          const current = lossReasonMap.get(reason) ?? { total: 0, valor: 0 };
          current.total += 1;
          current.valor += toNumber(row.estimated_value);
          lossReasonMap.set(reason, current);
        });

      const lossReasons = [...lossReasonMap.entries()]
        .map(([label, values]) => ({
          label,
          total: values.total,
          valor: values.valor,
        }))
        .sort((a, b) => b.valor - a.valor);

      const computed = {
        faturamentoEstimado,
        faturamentoRealizado,
        consultasAgendadas,
        taxaConversao,
        taxaNoShow,
        tempoMedioRespostaSegundos: respostaMedia,
        pacientesPerdidos,
        perdaReceita,
        principalGargalo: getPrincipalGargalo(funnel),
        funnel,
        lossReasons,
        canais,
        insights: [] as string[],
      };

      setMetrics({
        ...computed,
        insights: buildInsights(computed),
        loading: false,
        error: null,
      });
    } catch (error) {
      setMetrics((prev) => ({
        ...prev,
        loading: false,
        error: getDashboardErrorMessage(error, 'Erro ao carregar dashboard de crescimento.'),
      }));
    }
  };

  useEffect(() => {
    void fetchMetrics();
  }, []);

  return { ...metrics, refresh: fetchMetrics };
};
