import { type DragEvent, useMemo, useState } from 'react';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import {
  CRM_STAGES,
  formatDateLabel,
  formatPhone,
  getStageLabel,
  groupPrePatientsByStage,
  normalizeStage,
} from '@/lib/crmJourney';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';

export type StageKey =
  | 'lead_novo'
  | 'contato_iniciado'
  | 'qualificado'
  | 'agendado'
  | 'compareceu'
  | 'fechou'
  | 'perdido';

export type StageConfig = {
  key: StageKey;
  label: string;
  badgeClass: string;
};

export { CRM_STAGES, formatDateLabel, formatPhone, normalizeStage } from '@/lib/crmJourney';

export interface PrePatientRow {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null;
  stage: string | null;
  source_channel: string | null;
  estimated_value: number | null;
  temperature: 'frio' | 'morno' | 'quente' | null;
  next_action: string | null;
  procedure_interest: string | null;
  last_contact_at: string | null;
  lost_reason: string | null;
  created_at: string | null;
}

export function useCrmJourney() {
  const {
    data: prePatients,
    setData: setPrePatients,
    loading,
    error,
  } = useRealtimeList<PrePatientRow>({
    table: 'pre_patients',
    select:
      'id, name, phone, status, stage, source_channel, estimated_value, temperature, next_action, procedure_interest, last_contact_at, lost_reason, created_at',
    order: { column: 'created_at', ascending: false },
  });

  const [draggingPrePatientId, setDraggingPrePatientId] = useState<string | null>(null);
  const [updatingPrePatientId, setUpdatingPrePatientId] = useState<string | null>(null);

  const prePatientsByStage = useMemo(() => {
    return groupPrePatientsByStage(prePatients);
  }, [prePatients]);

  const stageMetrics = useMemo(() => {
    return CRM_STAGES.reduce<Record<StageKey, { total: number; valor: number }>>((acc, stage) => {
      const items = prePatientsByStage[stage.key];
      acc[stage.key] = {
        total: items.length,
        valor: items.reduce((sum, item) => sum + Number(item.estimated_value || 0), 0),
      };
      return acc;
    }, {} as Record<StageKey, { total: number; valor: number }>);
  }, [prePatientsByStage]);

  const hotLeadsCount = useMemo(
    () => prePatients.filter((item) => item.temperature === 'quente').length,
    [prePatients]
  );

  const handleDragStart = (event: DragEvent<HTMLDivElement>, prePatientId: string) => {
    event.dataTransfer.setData('text/plain', prePatientId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingPrePatientId(prePatientId);
  };

  const handleDragEnd = () => {
    setDraggingPrePatientId(null);
  };

  const handleDropOnStage = async (event: DragEvent<HTMLDivElement>, targetStage: StageKey) => {
    event.preventDefault();

    const draggedId = event.dataTransfer.getData('text/plain') || draggingPrePatientId;
    setDraggingPrePatientId(null);

    if (!draggedId) return;

    const currentPrePatient = prePatients.find((prePatient) => prePatient.id === draggedId);
    if (!currentPrePatient) return;

    const currentStage = normalizeStage(currentPrePatient.stage);
    if (currentStage === targetStage) return;

    const previousStage = currentPrePatient.stage ?? null;
    const previousStatus = currentPrePatient.status ?? null;
    const previousNextAction = currentPrePatient.next_action ?? null;
    const previousTemperature = currentPrePatient.temperature ?? null;
    const nowIso = new Date().toISOString();
    const nextStatus = targetStage === 'perdido' ? 'perdido' : previousStatus;
    const nextAction =
      targetStage === 'perdido'
        ? 'Avaliar recuperacao futura'
        : targetStage === 'agendado'
          ? 'Confirmar comparecimento'
          : targetStage === 'compareceu'
            ? 'Avancar para proposta e fechamento'
            : previousNextAction;
    const nextTemperature =
      targetStage === 'fechou'
        ? 'quente'
        : targetStage === 'perdido'
          ? 'frio'
          : previousTemperature;

    const stageSpecificFields = {
      compareceu: targetStage === 'compareceu' || targetStage === 'fechou',
      fechou: targetStage === 'fechou',
      no_show: false,
      last_contact_at: nowIso,
      next_action: nextAction,
      temperature: nextTemperature,
    };

    setPrePatients((previous) =>
      previous.map((prePatient) =>
        prePatient.id === draggedId
          ? {
              ...prePatient,
              stage: targetStage,
              status: nextStatus,
              ...stageSpecificFields,
            }
          : prePatient
      )
    );

    setUpdatingPrePatientId(draggedId);

    const supabase = await getSupabaseClient();
    const { error: updateError } = await supabase
      .from('pre_patients')
      .update({
        stage: targetStage,
        status: nextStatus,
        ...stageSpecificFields,
      })
      .eq('id', draggedId);

    if (updateError) {
      setPrePatients((previous) =>
        previous.map((prePatient) =>
          prePatient.id === draggedId
            ? {
                ...prePatient,
                stage: previousStage,
                status: previousStatus,
                next_action: previousNextAction,
                temperature: previousTemperature,
              }
            : prePatient
        )
      );
      toast.error(updateError.message || 'Nao foi possivel mover o lead.');
    } else {
      toast.success(`Lead movido para ${getStageLabel(targetStage)}.`);
    }

    setUpdatingPrePatientId(null);
  };

  const handleDragOverStage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  return {
    prePatients,
    prePatientsByStage,
    stageMetrics,
    hotLeadsCount,
    draggingPrePatientId,
    handleDragEnd,
    handleDragOverStage,
    handleDragStart,
    handleDropOnStage,
    loading,
    pageError: error,
    updatingPrePatientId,
  };
}
