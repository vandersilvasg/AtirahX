import { useEffect, useMemo, useState } from 'react';
import { getDashboardDateRanges, getDashboardErrorMessage } from '@/lib/dashboardMetrics';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';

type ChannelRow = {
  source_channel: string;
  total_leads: number;
  total_fechados: number;
  valor_pipeline: number;
  valor_fechado: number;
  valor_perdido: number;
};

type CampaignMetricsState = {
  channels: ChannelRow[];
  loading: boolean;
  error: string | null;
};

export const useCampaignMetrics = () => {
  const [state, setState] = useState<CampaignMetricsState>({
    channels: [],
    loading: true,
    error: null,
  });

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const supabase = await getSupabaseClient();
      const { startCurrentMonthIso, startNextMonthIso } = getDashboardDateRanges();
      const { data, error } = await supabase
        .from('pre_patients')
        .select('source_channel, estimated_value, fechou, stage, created_at')
        .gte('created_at', startCurrentMonthIso)
        .lt('created_at', startNextMonthIso)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = new Map<string, ChannelRow>();
      (data ?? []).forEach((row) => {
        const record = row as {
          source_channel?: string | null;
          estimated_value?: number | null;
          fechou?: boolean | null;
          stage?: string | null;
        };
        const sourceChannel = record.source_channel || 'nao_informado';
        const current = grouped.get(sourceChannel) ?? {
          source_channel: sourceChannel,
          total_leads: 0,
          total_fechados: 0,
          valor_pipeline: 0,
          valor_fechado: 0,
          valor_perdido: 0,
        };

        current.total_leads += 1;
        current.valor_pipeline += Number(record.estimated_value || 0);

        if (record.fechou || record.stage === 'fechou') {
          current.total_fechados += 1;
          current.valor_fechado += Number(record.estimated_value || 0);
        }

        if (record.stage === 'perdido') {
          current.valor_perdido += Number(record.estimated_value || 0);
        }

        grouped.set(sourceChannel, current);
      });

      setState({
        channels: [...grouped.values()].sort((a, b) => b.valor_fechado - a.valor_fechado),
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: getDashboardErrorMessage(err, 'Erro ao carregar metricas de campanhas.'),
      }));
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const summary = useMemo(() => {
    const totalLeads = state.channels.reduce((sum, item) => sum + item.total_leads, 0);
    const totalFechados = state.channels.reduce((sum, item) => sum + item.total_fechados, 0);
    const valorFechado = state.channels.reduce((sum, item) => sum + item.valor_fechado, 0);
    const valorPerdido = state.channels.reduce((sum, item) => sum + item.valor_perdido, 0);
    const conversaoGeral = totalLeads ? Number(((totalFechados / totalLeads) * 100).toFixed(1)) : 0;
    return { totalLeads, totalFechados, valorFechado, valorPerdido, conversaoGeral };
  }, [state.channels]);

  return {
    ...state,
    summary,
    refresh: fetchData,
  };
};
