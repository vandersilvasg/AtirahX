import { useEffect, useState } from 'react';
import {
  buildMetricCountsFromRpcData,
  calculateDashboardTrend,
  EMPTY_METRICS,
  getDashboardDateRanges,
  getDashboardErrorMessage,
  getSafeMetricCount,
  type DashboardMetrics,
  type DashboardMetricsRpcRow,
  type MetricCounts,
} from '@/lib/dashboardMetrics';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';

export type { DashboardMetrics } from '@/lib/dashboardMetrics';

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    ...EMPTY_METRICS,
    loading: true,
    error: null,
  });

  useEffect(() => {
    void fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeCount = async (
    queryPromise: Promise<{ count: number | null; error: { message: string } | null }>
  ): Promise<number> => {
    const { count, error } = await queryPromise;
    return getSafeMetricCount(count, error);
  };

  const fetchCrmMetrics = async (): Promise<Pick<
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
  >> => {
    const { startTodayIso } = getDashboardDateRanges();
    const supabase = await getSupabaseClient();

    const [
      jornadaAgendado,
      jornadaAguardando,
      jornadaEmAtendimento,
      jornadaFinalizado,
      jornadaCancelado,
      automacaoPendentes,
      automacaoEnviadosHoje,
      automacaoFalhas,
      listaEsperaAtivos,
      listaEsperaOfertasPendentes,
    ] = await Promise.all([
      safeCount(
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('journey_stage', 'agendado')
      ),
      safeCount(
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('journey_stage', 'aguardando')
      ),
      safeCount(
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('journey_stage', 'em_atendimento')
      ),
      safeCount(
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('journey_stage', 'finalizado')
      ),
      safeCount(
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('journey_stage', 'cancelado')
      ),
      safeCount(
        supabase
          .from('appointment_automation_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      ),
      safeCount(
        supabase
          .from('appointment_automation_jobs')
          .select('*', { count: 'exact', head: true })
          .in('status', ['sent', 'done'])
          .gte('executed_at', startTodayIso)
      ),
      safeCount(
        supabase
          .from('appointment_automation_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'failed')
      ),
      safeCount(
        supabase
          .from('appointment_waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
      ),
      safeCount(
        supabase
          .from('appointment_waitlist_offers')
          .select('*', { count: 'exact', head: true })
          .eq('offer_status', 'pending')
      ),
    ]);

    return {
      jornadaAgendado,
      jornadaAguardando,
      jornadaEmAtendimento,
      jornadaFinalizado,
      jornadaCancelado,
      automacaoPendentes,
      automacaoEnviadosHoje,
      automacaoFalhas,
      listaEsperaAtivos,
      listaEsperaOfertasPendentes,
    };
  };

  const buildMetricCountsFromRpc = async (): Promise<MetricCounts | null> => {
    const supabase = await getSupabaseClient();
    const { data: mainMetrics, error: mainError } =
      await supabase.rpc<DashboardMetricsRpcRow[]>('get_dashboard_metrics');

    if (mainError) {
      console.warn('RPC get_dashboard_metrics nao encontrada, buscando dados manualmente');
      return null;
    }

    if (!mainMetrics || mainMetrics.length === 0) {
      return null;
    }

    const crmMetrics = await fetchCrmMetrics();
    return buildMetricCountsFromRpcData(mainMetrics[0], crmMetrics);
  };

  const fetchMetricsManually = async (): Promise<MetricCounts> => {
    const crmMetrics = await fetchCrmMetrics();
    const supabase = await getSupabaseClient();
    const {
      startTodayIso,
      endTodayIso,
      startCurrentMonthIso,
      startNextMonthIso,
      startLastMonthIso,
    } = getDashboardDateRanges();

    const [
      consultasHoje,
      consultasMesAtual,
      consultasMesAnterior,
      pacientesCRM,
      pacientesCRMMesAtual,
      pacientesCRMMesAnterior,
      prePatientes,
      totalMedicos,
      totalSecretarias,
      mensagensHoje,
      mensagensMesAtual,
      followupsPendentes,
      prontuariosCriados,
      consultasIA,
    ] = await Promise.all([
      safeCount(
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('scheduled_at', startTodayIso)
          .lt('scheduled_at', endTodayIso)
      ),
      safeCount(
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('scheduled_at', startCurrentMonthIso)
          .lt('scheduled_at', startNextMonthIso)
      ),
      safeCount(
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('scheduled_at', startLastMonthIso)
          .lt('scheduled_at', startCurrentMonthIso)
      ),
      safeCount(
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
      ),
      safeCount(
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startCurrentMonthIso)
          .lt('created_at', startNextMonthIso)
      ),
      safeCount(
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startLastMonthIso)
          .lt('created_at', startCurrentMonthIso)
      ),
      safeCount(
        supabase
          .from('pre_patients')
          .select('*', { count: 'exact', head: true })
      ),
      safeCount(
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'doctor')
      ),
      safeCount(
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'secretary')
      ),
      safeCount(
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startTodayIso)
          .lt('created_at', endTodayIso)
      ),
      safeCount(
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startCurrentMonthIso)
          .lt('created_at', startNextMonthIso)
      ),
      safeCount(
        supabase
          .from('follow_ups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      ),
      safeCount(
        supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true })
      ),
      safeCount(
        supabase
          .from('agent_consultations')
          .select('*', { count: 'exact', head: true })
      ),
    ]);

    return {
      consultasHoje,
      consultasMesAtual,
      consultasMesAnterior,
      pacientesCRM,
      pacientesCRMMesAtual,
      pacientesCRMMesAnterior,
      prePatientes,
      totalMedicos,
      totalSecretarias,
      mensagensHoje,
      mensagensMesAtual,
      followupsPendentes,
      prontuariosCriados,
      consultasIA,
      ...crmMetrics,
    };
  };

  const fetchMetrics = async () => {
    try {
      setMetrics((prev) => ({ ...prev, loading: true, error: null }));

      const rpcMetrics = await buildMetricCountsFromRpc();
      if (rpcMetrics) {
        setMetrics({
          ...rpcMetrics,
          loading: false,
          error: null,
        });
        return;
      }

      const fallbackMetrics = await fetchMetricsManually();
      setMetrics({
        ...fallbackMetrics,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Erro ao buscar metricas:', err);
      setMetrics((prev) => ({
        ...prev,
        loading: false,
        error: getDashboardErrorMessage(err, 'Erro ao carregar metricas. Tente novamente.'),
      }));
    }
  };

  return {
    ...metrics,
    calculateTrend: calculateDashboardTrend,
    refresh: fetchMetrics,
  };
}
