import { useEffect, useMemo, useState } from 'react';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';

export type TimeUnit = 'minutes' | 'hours' | 'days';

export interface FollowUpConfig {
  id: string;
  followup1_minutes: number;
  followup2_minutes: number;
  followup3_minutes: number;
}

export interface ClienteFollowUp {
  id: number;
  nome: string;
  numero: string;
  ultima_atividade: string;
  sessionid: string;
  'follow-up1': string | null;
  data_envio1: string | null;
  mensagem1: string | null;
  'follow-up2': string | null;
  data_envio2: string | null;
  mensagem2: string | null;
  'follow-up3': string | null;
  data_envio3: string | null;
  mensagem3: string | null;
  situacao: string | null;
  followup: string;
}

type FollowUpStatus = {
  completed: number;
  total: number;
  followups: Array<{
    num: number;
    status: string | null;
    date: string | null;
  }>;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

export function toMinutes(value: number, unit: TimeUnit): number {
  switch (unit) {
    case 'minutes':
      return value;
    case 'hours':
      return value * 60;
    case 'days':
      return value * 1440;
    default:
      return value;
  }
}

function fromMinutes(minutes: number): { value: number; unit: TimeUnit } {
  if (minutes % 1440 === 0) return { value: minutes / 1440, unit: 'days' };
  if (minutes % 60 === 0) return { value: minutes / 60, unit: 'hours' };
  return { value: minutes, unit: 'minutes' };
}

export function formatPhone(numero: string) {
  return numero
    .replace('@s.whatsapp.net', '')
    .replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
}

export function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function getFollowUpStatus(cliente: ClienteFollowUp): FollowUpStatus {
  const followups = [
    { num: 1, status: cliente['follow-up1'], date: cliente.data_envio1 },
    { num: 2, status: cliente['follow-up2'], date: cliente.data_envio2 },
    { num: 3, status: cliente['follow-up3'], date: cliente.data_envio3 },
  ];
  const completed = followups.filter((followup) => followup.status === 'concluido').length;
  return { completed, total: 3, followups };
}

export function useFollowUpManagement() {
  const [config, setConfig] = useState<FollowUpConfig | null>(null);
  const [editConfig, setEditConfig] = useState({
    followup1: { value: 7, unit: 'days' as TimeUnit },
    followup2: { value: 15, unit: 'days' as TimeUnit },
    followup3: { value: 30, unit: 'days' as TimeUnit },
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const followUpFilters = useMemo(
    () => [{ column: 'followup', operator: 'neq' as const, value: 'encerrado' }],
    []
  );

  const followUpOrder = useMemo(
    () => ({ column: 'ultima_atividade', ascending: false }),
    []
  );

  const {
    data: clientes,
    loading: loadingClientes,
    error,
  } = useRealtimeList<ClienteFollowUp>({
    table: 'clientes_followup',
    filters: followUpFilters,
    order: followUpOrder,
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const supabase = await getSupabaseClient();
        const { data, error: configError } = await supabase
          .from('followup_config')
          .select('*')
          .limit(1)
          .single();

        if (configError) {
          console.error('Erro ao carregar config:', configError);
          return;
        }

        if (data) {
          setConfig(data);
          setEditConfig({
            followup1: fromMinutes(data.followup1_minutes),
            followup2: fromMinutes(data.followup2_minutes),
            followup3: fromMinutes(data.followup3_minutes),
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configuracao:', error);
      } finally {
        setLoadingConfig(false);
      }
    }

    void loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const supabase = await getSupabaseClient();
      const dataToSave = {
        followup1_minutes: toMinutes(editConfig.followup1.value, editConfig.followup1.unit),
        followup2_minutes: toMinutes(editConfig.followup2.value, editConfig.followup2.unit),
        followup3_minutes: toMinutes(editConfig.followup3.value, editConfig.followup3.unit),
      };

      if (config?.id) {
        const { error: updateError } = await supabase
          .from('followup_config')
          .update(dataToSave)
          .eq('id', config.id);

        if (updateError) throw updateError;
        toast.success('Configuracao salva com sucesso!');
      } else {
        const { data, error: insertError } = await supabase
          .from('followup_config')
          .insert([dataToSave])
          .select()
          .single();

        if (insertError) throw insertError;
        setConfig(data);
        toast.success('Configuracao criada com sucesso!');
      }
    } catch (error: unknown) {
      console.error('Erro ao salvar configuracao:', error);
      toast.error(
        `Erro ao salvar configuracao: ${getErrorMessage(error, 'Erro desconhecido')}`
      );
    } finally {
      setSavingConfig(false);
    }
  };

  return {
    clientes,
    editConfig,
    error,
    getFollowUpStatus,
    handleSaveConfig,
    loadingClientes,
    loadingConfig,
    savingConfig,
    setEditConfig,
  };
}


