import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { getDashboardErrorMessage } from '@/lib/dashboardMetrics';

type RecoveryLead = {
  id: string;
  name: string | null;
  stage: string;
  status: string | null;
  no_show: boolean;
  compareceu: boolean;
  fechou: boolean;
  next_action: string | null;
  source_channel: string;
  estimated_value: number;
  last_contact_at: string | null;
  phone: string | null;
};

type Buckets = {
  naoResponderam: RecoveryLead[];
  naoAgendaram: RecoveryLead[];
  faltaram: RecoveryLead[];
  naoFecharam: RecoveryLead[];
};

const EMPTY_BUCKETS: Buckets = {
  naoResponderam: [],
  naoAgendaram: [],
  faltaram: [],
  naoFecharam: [],
};

export const useRecoveryPatients = () => {
  const [data, setData] = useState<Buckets>(EMPTY_BUCKETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactivatingIds, setReactivatingIds] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = await getSupabaseClient();
      const { data: leads, error: leadsError } = await supabase
        .from('pre_patients')
        .select(
          'id, name, stage, status, no_show, compareceu, fechou, next_action, source_channel, estimated_value, last_contact_at, phone'
        )
        .order('updated_at', { ascending: false });

      if (leadsError) throw leadsError;

      const now = Date.now();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const parsed = (leads ?? []) as RecoveryLead[];

      const buckets = parsed.reduce<Buckets>((acc, lead) => {
        const lastContactMs = lead.last_contact_at ? new Date(lead.last_contact_at).getTime() : 0;

        if (
          lead.stage === 'lead_novo' &&
          (!lead.last_contact_at || now - lastContactMs > threeDaysMs)
        ) {
          acc.naoResponderam.push(lead);
        }
        if (
          (lead.stage === 'qualificado' || lead.stage === 'contato_iniciado') &&
          !lead.compareceu &&
          !lead.fechou
        ) {
          acc.naoAgendaram.push(lead);
        }
        if (lead.no_show || (lead.stage === 'agendado' && !lead.compareceu)) {
          acc.faltaram.push(lead);
        }
        if ((lead.stage === 'compareceu' || lead.compareceu) && !lead.fechou) {
          acc.naoFecharam.push(lead);
        }
        return acc;
      }, EMPTY_BUCKETS);

      setData(buckets);
    } catch (err) {
      setError(getDashboardErrorMessage(err, 'Erro ao carregar recuperação de pacientes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const reactivateLead = async (leadId: string) => {
    try {
      setReactivatingIds((prev) => ({ ...prev, [leadId]: true }));
      const supabase = await getSupabaseClient();
      const { error: updateError } = await supabase
        .from('pre_patients')
        .update({
          stage: 'contato_iniciado',
          temperature: 'morno',
          next_action: 'Fluxo de reativacao iniciado - entrar em contato',
          last_contact_at: new Date().toISOString(),
          no_show: false,
        })
        .eq('id', leadId);

      if (updateError) throw updateError;
      await fetchData();
      return { ok: true as const };
    } catch (err) {
      return {
        ok: false as const,
        error: getDashboardErrorMessage(err, 'Erro ao reativar paciente.'),
      };
    } finally {
      setReactivatingIds((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  const totals = useMemo(
    () => ({
      naoResponderam: data.naoResponderam.length,
      naoAgendaram: data.naoAgendaram.length,
      faltaram: data.faltaram.length,
      naoFecharam: data.naoFecharam.length,
      valorRecuperavel:
        [...data.naoAgendaram, ...data.faltaram, ...data.naoFecharam].reduce(
          (sum, lead) => sum + Number(lead.estimated_value || 0),
          0
        ),
    }),
    [data]
  );

  return {
    ...data,
    totals,
    loading,
    error,
    reactivatingIds,
    reactivateLead,
    refresh: fetchData,
  };
};
