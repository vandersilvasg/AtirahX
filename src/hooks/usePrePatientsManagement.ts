import { useMemo, useState, type FormEvent } from 'react';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { getStageLabel, normalizeStage } from '@/lib/crmJourney';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';

export interface PrePatient {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  health_insurance: string | null;
  status: string | null;
  area_interest: string | null;
  stage: string;
  source_channel: string;
  estimated_value: number;
  temperature: 'frio' | 'morno' | 'quente';
  compareceu: boolean;
  fechou: boolean;
  no_show: boolean;
  lost_reason: string | null;
  next_action: string | null;
  response_time_seconds: number | null;
  last_contact_at: string | null;
  procedure_interest: string | null;
  created_at: string;
}

export type PrePatientFormData = {
  name: string;
  email: string;
  phone: string;
  health_insurance: string;
  status: string;
  area_interest: string;
  stage: string;
  source_channel: string;
  estimated_value: string;
  temperature: 'frio' | 'morno' | 'quente';
  compareceu: boolean;
  fechou: boolean;
  no_show: boolean;
  lost_reason: string;
  next_action: string;
  response_time_seconds: string;
  last_contact_at: string;
  procedure_interest: string;
};

export type PrePatientSegment = 'all' | 'hot' | 'follow_up' | 'converted';

export type PrePatientInsights = {
  totalLeads: number;
  filteredLeads: number;
  hotLeads: number;
  followUpLeads: number;
  convertedLeads: number;
  pipelineValue: number;
};

export type QuickStageAction = {
  label: string;
  targetStage: PrePatient['stage'];
};

const SUGGESTED_NEXT_ACTIONS: Record<string, string[]> = {
  lead_novo: [
    'Realizar primeiro contato em ate 5 minutos',
    'Enviar mensagem inicial com proposta de valor',
  ],
  contato_iniciado: [
    'Confirmar interesse e objeções principais',
    'Qualificar necessidade e urgencia do procedimento',
  ],
  qualificado: [
    'Oferecer agenda e confirmar melhor horario',
    'Enviar condicoes e preparar agendamento',
  ],
  agendado: [
    'Confirmar comparecimento no dia anterior',
    'Enviar orientacoes pre-consulta e localizacao',
  ],
  compareceu: [
    'Apresentar proposta e conduzir fechamento',
    'Registrar retorno comercial em ate 24 horas',
  ],
  fechou: [
    'Registrar detalhes do fechamento e onboarding',
  ],
  perdido: [
    'Registrar motivo e agendar tentativa futura',
  ],
};

const EMPTY_FORM: PrePatientFormData = {
  name: '',
  email: '',
  phone: '',
  health_insurance: '',
  status: '',
  area_interest: '',
  stage: 'lead_novo',
  source_channel: 'nao_informado',
  estimated_value: '0',
  temperature: 'morno',
  compareceu: false,
  fechou: false,
  no_show: false,
  lost_reason: '',
  next_action: '',
  response_time_seconds: '',
  last_contact_at: '',
  procedure_interest: '',
};

function normalizeFormData(formData: Partial<PrePatientFormData>): PrePatientFormData {
  return {
    ...EMPTY_FORM,
    ...formData,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

export function formatWhatsappToDDDNumber(raw?: string | null) {
  if (!raw) return '-';
  const atIdx = raw.indexOf('@');
  const withoutDomain = atIdx >= 0 ? raw.slice(0, atIdx) : raw;
  const digits = withoutDomain.replace(/\D/g, '');
  if (!digits) return '-';
  const local = digits.length > 11 ? digits.slice(-11) : digits;
  if (local.length < 10) return local;
  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  return `(${ddd}) ${number}`;
}

export function matchesPrePatientSegment(
  prePatient: PrePatient,
  segment: PrePatientSegment
) {
  if (segment === 'all') return true;
  if (segment === 'hot') {
    return prePatient.temperature === 'quente' && !prePatient.fechou;
  }
  if (segment === 'follow_up') {
    return Boolean(prePatient.next_action) && !prePatient.fechou && !prePatient.no_show;
  }
  return Boolean(prePatient.fechou || prePatient.stage === 'fechou');
}

export function getPrePatientInsights(
  prePatients: PrePatient[],
  filteredPrePatients: PrePatient[]
): PrePatientInsights {
  return {
    totalLeads: prePatients.length,
    filteredLeads: filteredPrePatients.length,
    hotLeads: prePatients.filter((prePatient) => matchesPrePatientSegment(prePatient, 'hot')).length,
    followUpLeads: prePatients.filter((prePatient) => matchesPrePatientSegment(prePatient, 'follow_up'))
      .length,
    convertedLeads: prePatients.filter((prePatient) => matchesPrePatientSegment(prePatient, 'converted'))
      .length,
    pipelineValue: prePatients.reduce(
      (sum, prePatient) => sum + Number(prePatient.estimated_value || 0),
      0
    ),
  };
}

export function getQuickStageAction(prePatient: PrePatient): QuickStageAction | null {
  const currentStage = normalizeStage(prePatient.stage);

  if (prePatient.fechou || currentStage === 'fechou' || currentStage === 'perdido') {
    return null;
  }

  if (currentStage === 'lead_novo') {
    return { label: 'Iniciar contato', targetStage: 'contato_iniciado' };
  }

  if (currentStage === 'contato_iniciado') {
    return { label: 'Qualificar', targetStage: 'qualificado' };
  }

  if (currentStage === 'qualificado') {
    return { label: 'Agendar', targetStage: 'agendado' };
  }

  if (currentStage === 'agendado') {
    return { label: 'Confirmar comparecimento', targetStage: 'compareceu' };
  }

  return { label: 'Marcar fechamento', targetStage: 'fechou' };
}

export function getSuggestedNextActions(stage: string | null | undefined) {
  return SUGGESTED_NEXT_ACTIONS[normalizeStage(stage)] ?? [];
}

function getStageUpdatePayload(prePatient: PrePatient, targetStage: PrePatient['stage']) {
  const nowIso = new Date().toISOString();
  const nextStatus = targetStage === 'perdido' ? 'perdido' : prePatient.status;
  const suggestedNextAction = getSuggestedNextActions(targetStage)[0] ?? null;
  const nextAction =
    targetStage === 'perdido'
      ? 'Avaliar recuperacao futura'
      : targetStage === 'agendado'
        ? 'Confirmar comparecimento'
        : targetStage === 'compareceu'
          ? 'Avancar para proposta e fechamento'
          : suggestedNextAction ?? prePatient.next_action;
  const nextTemperature =
    targetStage === 'fechou'
      ? 'quente'
      : targetStage === 'perdido'
        ? 'frio'
        : prePatient.temperature;

  return {
    stage: targetStage,
    status: nextStatus,
    compareceu: targetStage === 'compareceu' || targetStage === 'fechou',
    fechou: targetStage === 'fechou',
    no_show: false,
    last_contact_at: nowIso,
    next_action: nextAction,
    temperature: nextTemperature,
  };
}

export function usePrePatientsManagement() {
  const { data, setData, loading, error } = useRealtimeList<PrePatient>({
    table: 'pre_patients',
    order: { column: 'created_at', ascending: false },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState<PrePatientSegment>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrePatientFormData>(EMPTY_FORM);

  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return data.filter((prePatient) => {
      if (!matchesPrePatientSegment(prePatient, activeSegment)) {
        return false;
      }

      return (
        (prePatient.name ?? '').toLowerCase().includes(search) ||
        (prePatient.email ?? '').toLowerCase().includes(search) ||
        (prePatient.phone ?? '').includes(search) ||
        (prePatient.health_insurance ?? '').toLowerCase().includes(search) ||
        (prePatient.status ?? '').toLowerCase().includes(search) ||
        (prePatient.area_interest ?? '').toLowerCase().includes(search) ||
        (prePatient.stage ?? '').toLowerCase().includes(search) ||
        (prePatient.source_channel ?? '').toLowerCase().includes(search) ||
        (prePatient.temperature ?? '').toLowerCase().includes(search) ||
        (prePatient.next_action ?? '').toLowerCase().includes(search)
      );
    });
  }, [activeSegment, data, searchTerm]);

  const prePatientInsights = useMemo(
    () => getPrePatientInsights(data, filtered),
    [data, filtered]
  );

  const resetForm = () => {
    setFormData(EMPTY_FORM);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEdit = (prePatient: PrePatient) => {
    setSelectedId(prePatient.id);
    setFormData({
      name: prePatient.name ?? '',
      email: prePatient.email ?? '',
      phone: prePatient.phone ?? '',
      health_insurance: prePatient.health_insurance ?? '',
      status: prePatient.status ?? '',
      area_interest: prePatient.area_interest ?? '',
      stage: prePatient.stage ?? 'lead_novo',
      source_channel: prePatient.source_channel ?? 'nao_informado',
      estimated_value: String(prePatient.estimated_value ?? 0),
      temperature: prePatient.temperature ?? 'morno',
      compareceu: Boolean(prePatient.compareceu),
      fechou: Boolean(prePatient.fechou),
      no_show: Boolean(prePatient.no_show),
      lost_reason: prePatient.lost_reason ?? '',
      next_action: prePatient.next_action ?? '',
      response_time_seconds:
        prePatient.response_time_seconds !== null && prePatient.response_time_seconds !== undefined
          ? String(prePatient.response_time_seconds)
          : '',
      last_contact_at: prePatient.last_contact_at ? prePatient.last_contact_at.slice(0, 16) : '',
      procedure_interest: prePatient.procedure_interest ?? '',
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const supabase = await getSupabaseClient();
      const normalizedForm = normalizeFormData(formData);
      const { error: insertError } = await supabase.from('pre_patients').insert({
        name: normalizedForm.name || null,
        email: normalizedForm.email || null,
        phone: normalizedForm.phone || null,
        health_insurance: normalizedForm.health_insurance || null,
        status: normalizedForm.status || null,
        area_interest: normalizedForm.area_interest || null,
        stage: normalizedForm.stage,
        source_channel: normalizedForm.source_channel,
        estimated_value: Number(normalizedForm.estimated_value || 0),
        temperature: normalizedForm.temperature,
        compareceu: normalizedForm.compareceu,
        fechou: normalizedForm.fechou,
        no_show: normalizedForm.no_show,
        lost_reason: normalizedForm.lost_reason || null,
        next_action: normalizedForm.next_action || null,
        response_time_seconds: normalizedForm.response_time_seconds
          ? Number(normalizedForm.response_time_seconds)
          : null,
        last_contact_at: normalizedForm.last_contact_at
          ? new Date(normalizedForm.last_contact_at).toISOString()
          : null,
        procedure_interest: normalizedForm.procedure_interest || null,
      });

      if (insertError) throw insertError;

      toast.success('Pre paciente criado.');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Erro ao criar pre paciente'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;

    setIsSaving(true);
    try {
      const supabase = await getSupabaseClient();
      const normalizedForm = normalizeFormData(formData);
      const { error: updateError } = await supabase
        .from('pre_patients')
        .update({
          name: normalizedForm.name || null,
          email: normalizedForm.email || null,
          phone: normalizedForm.phone || null,
          health_insurance: normalizedForm.health_insurance || null,
          status: normalizedForm.status || null,
          area_interest: normalizedForm.area_interest || null,
          stage: normalizedForm.stage,
          source_channel: normalizedForm.source_channel,
          estimated_value: Number(normalizedForm.estimated_value || 0),
          temperature: normalizedForm.temperature,
          compareceu: normalizedForm.compareceu,
          fechou: normalizedForm.fechou,
          no_show: normalizedForm.no_show,
          lost_reason: normalizedForm.lost_reason || null,
          next_action: normalizedForm.next_action || null,
          response_time_seconds: normalizedForm.response_time_seconds
            ? Number(normalizedForm.response_time_seconds)
            : null,
          last_contact_at: normalizedForm.last_contact_at
            ? new Date(normalizedForm.last_contact_at).toISOString()
            : null,
          procedure_interest: normalizedForm.procedure_interest || null,
        })
        .eq('id', selectedId);

      if (updateError) throw updateError;

      toast.success('Pre paciente atualizado.');
      setIsEditDialogOpen(false);
      setSelectedId(null);
      resetForm();
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Erro ao atualizar pre paciente'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = await getSupabaseClient();
      const { error: deleteError } = await supabase.from('pre_patients').delete().eq('id', id);
      if (deleteError) throw deleteError;
      toast.success('Pre paciente removido.');
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Erro ao remover'));
    }
  };

  const handleQuickStageAdvance = async (prePatient: PrePatient) => {
    const quickAction = getQuickStageAction(prePatient);
    if (!quickAction) return;

    const optimisticPayload = getStageUpdatePayload(prePatient, quickAction.targetStage);
    setQuickActionId(prePatient.id);
    setData((previous) =>
      previous.map((item) =>
        item.id === prePatient.id
          ? {
              ...item,
              ...optimisticPayload,
            }
          : item
      )
    );

    try {
      const supabase = await getSupabaseClient();
      const { error: updateError } = await supabase
        .from('pre_patients')
        .update(optimisticPayload)
        .eq('id', prePatient.id);

      if (updateError) throw updateError;

      toast.success(`Lead movido para ${getStageLabel(normalizeStage(quickAction.targetStage))}.`);
    } catch (error: unknown) {
      setData((previous) =>
        previous.map((item) =>
          item.id === prePatient.id
            ? {
                ...item,
                stage: prePatient.stage,
                status: prePatient.status,
                compareceu: prePatient.compareceu,
                fechou: prePatient.fechou,
                no_show: prePatient.no_show,
                last_contact_at: prePatient.last_contact_at,
                next_action: prePatient.next_action,
                temperature: prePatient.temperature,
              }
            : item
        )
      );
      console.error(error);
      toast.error(getErrorMessage(error, 'Erro ao atualizar etapa rapidamente'));
    } finally {
      setQuickActionId(null);
    }
  };

  return {
    activeSegment,
    error,
    filtered,
    formData,
    handleCreate,
    handleDelete,
    handleUpdate,
    isCreateDialogOpen,
    isEditDialogOpen,
    isSaving,
    loading,
    quickActionId,
    handleQuickStageAdvance,
    openCreate,
    openEdit,
    prePatientInsights,
    searchTerm,
    setActiveSegment,
    setFormData,
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    setSearchTerm,
  };
}

