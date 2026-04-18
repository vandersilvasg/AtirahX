import { type DragEvent, useMemo, useState } from 'react';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import {
  createEntityMap,
  CRM_STAGES,
  formatDateLabel,
  formatPhone,
  getAppointmentDateRaw,
  getNextAppointmentStatus,
  getStageLabel,
  groupAppointmentsByStage,
  normalizeStage,
} from '@/lib/crmJourney';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';

export type StageKey =
  | 'agendado'
  | 'aguardando'
  | 'em_atendimento'
  | 'finalizado'
  | 'cancelado';

export type StageConfig = {
  key: StageKey;
  label: string;
  badgeClass: string;
};

export { CRM_STAGES, formatDateLabel, formatPhone, getAppointmentDateRaw, normalizeStage } from '@/lib/crmJourney';

export interface AppointmentRow {
  id: string;
  patient_id: string | null;
  doctor_id: string | null;
  status: string | null;
  journey_stage: string | null;
  scheduled_at: string | null;
  appointment_date: string | null;
  reason: string | null;
  notes: string | null;
}

export interface PatientRow {
  id: string;
  name: string;
  phone: string | null;
}

export interface DoctorRow {
  id: string;
  name: string | null;
  role: string | null;
}

export function useCrmJourney() {
  const doctorFilters = useMemo(
    () => [{ column: 'role', operator: 'eq' as const, value: 'doctor' }],
    []
  );

  const {
    data: appointments,
    setData: setAppointments,
    loading: loadingAppointments,
    error: appointmentsError,
  } = useRealtimeList<AppointmentRow>({
    table: 'appointments',
    select:
      'id, patient_id, doctor_id, status, journey_stage, scheduled_at, appointment_date, reason, notes',
    order: { column: 'scheduled_at', ascending: true },
  });

  const {
    data: patients,
    loading: loadingPatients,
    error: patientsError,
  } = useRealtimeList<PatientRow>({
    table: 'patients',
    select: 'id, name, phone',
    order: { column: 'created_at', ascending: false },
  });

  const {
    data: doctors,
    loading: loadingDoctors,
    error: doctorsError,
  } = useRealtimeList<DoctorRow>({
    table: 'profiles',
    select: 'id, name, role',
    filters: doctorFilters,
  });

  const [draggingAppointmentId, setDraggingAppointmentId] = useState<string | null>(null);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);

  const patientById = useMemo(() => {
    return createEntityMap(patients);
  }, [patients]);

  const doctorById = useMemo(() => {
    return createEntityMap(doctors);
  }, [doctors]);

  const appointmentsByStage = useMemo(() => {
    return groupAppointmentsByStage(appointments);
  }, [appointments]);

  const handleDragStart = (event: DragEvent<HTMLDivElement>, appointmentId: string) => {
    event.dataTransfer.setData('text/plain', appointmentId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingAppointmentId(appointmentId);
  };

  const handleDragEnd = () => {
    setDraggingAppointmentId(null);
  };

  const handleDropOnStage = async (
    event: DragEvent<HTMLDivElement>,
    targetStage: StageKey
  ) => {
    event.preventDefault();

    const draggedId = event.dataTransfer.getData('text/plain') || draggingAppointmentId;
    setDraggingAppointmentId(null);

    if (!draggedId) return;

    const currentAppointment = appointments.find((appointment) => appointment.id === draggedId);
    if (!currentAppointment) return;

    const currentStage = normalizeStage(currentAppointment.journey_stage);
    if (currentStage === targetStage) return;

    const previousJourneyStage = currentAppointment.journey_stage ?? null;
    const previousStatus = currentAppointment.status ?? null;
    const nextStatus = getNextAppointmentStatus(targetStage, previousStatus);

    setAppointments((previous) =>
      previous.map((appointment) =>
        appointment.id === draggedId
          ? { ...appointment, journey_stage: targetStage, status: nextStatus }
          : appointment
      )
    );

    setUpdatingAppointmentId(draggedId);

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('appointments')
      .update({ journey_stage: targetStage, status: nextStatus })
      .eq('id', draggedId);

    if (error) {
      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === draggedId
            ? {
                ...appointment,
                journey_stage: previousJourneyStage,
                status: previousStatus,
              }
            : appointment
        )
      );
      toast.error(error.message || 'Nao foi possivel mover o paciente.');
    } else {
      toast.success(`Paciente movido para ${getStageLabel(targetStage)}.`);
    }

    setUpdatingAppointmentId(null);
  };

  const handleDragOverStage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  return {
    appointments,
    appointmentsByStage,
    draggingAppointmentId,
    handleDragEnd,
    handleDragOverStage,
    handleDragStart,
    handleDropOnStage,
    loading: loadingAppointments || loadingPatients || loadingDoctors,
    pageError: appointmentsError || patientsError || doctorsError,
    patientById,
    updatingAppointmentId,
    doctorById,
  };
}
