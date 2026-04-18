import type { TimelineEvent } from '@/hooks/usePatientTimeline';

type DoctorRelation = {
  name?: string | null;
};

export type MedicalRecordRow = {
  id: string;
  appointment_date: string;
  chief_complaint?: string | null;
  diagnosis?: string | null;
  doctor?: DoctorRelation | null;
};

export type AppointmentTimelineRow = {
  id: string;
  appointment_date: string;
  status?: string | null;
  type?: string | null;
  notes?: string | null;
  doctor?: DoctorRelation | null;
};

export type AnamnesisRow = {
  id: string;
  created_at: string;
  chief_complaint?: string | null;
  doctor?: DoctorRelation | null;
};

export type ClinicalDataRow = {
  id: string;
  measurement_date: string;
  weight_kg?: number | null;
  height_cm?: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
};

export type ExamRow = {
  id: string;
  exam_date: string;
  exam_name: string;
  exam_type?: string | null;
  result_summary?: string | null;
};

export type AttachmentRow = {
  id: string;
  created_at: string;
  description?: string | null;
  file_name: string;
};

export type AgentConsultationRow = {
  id: string;
  agent_type?: string | null;
  consultation_date: string;
  cid_code?: string | null;
  cid_description?: string | null;
  confidence_level?: string | number | null;
  consultation_input?: unknown;
  consultation_output?: unknown;
  doctor?: DoctorRelation | null;
};

export function getPatientTimelineErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function buildMedicalRecordTimelineEvents(records: MedicalRecordRow[] | null | undefined): TimelineEvent[] {
  return (records ?? []).map((record) => ({
    id: record.id,
    type: 'medical_record',
    date: record.appointment_date,
    title: 'Consulta Medica',
    description: record.chief_complaint || record.diagnosis || 'Consulta realizada',
    doctor: record.doctor?.name ?? undefined,
    icon: 'stethoscope',
    data: record,
  }));
}

export function buildAppointmentTimelineEvents(
  appointments: AppointmentTimelineRow[] | null | undefined
): TimelineEvent[] {
  return (appointments ?? []).map((appointment) => ({
    id: appointment.id,
    type: 'appointment',
    date: appointment.appointment_date,
    title: appointment.type || 'Consulta Agendada',
    description: `Status: ${appointment.status || 'N/A'}${appointment.notes ? ` - ${appointment.notes}` : ''}`,
    doctor: appointment.doctor?.name ?? undefined,
    icon: 'calendar',
    data: appointment,
  }));
}

export function buildAnamnesisTimelineEvents(items: AnamnesisRow[] | null | undefined): TimelineEvent[] {
  return (items ?? []).map((anamnesisItem) => ({
    id: anamnesisItem.id,
    type: 'anamnesis',
    date: anamnesisItem.created_at,
    title: 'Anamnese',
    description: anamnesisItem.chief_complaint || 'Ficha de anamnese preenchida',
    doctor: anamnesisItem.doctor?.name ?? undefined,
    icon: 'file-text',
    data: anamnesisItem,
  }));
}

export function getClinicalDataDescription(clinicalItem: ClinicalDataRow) {
  const details: string[] = [];

  if (clinicalItem.weight_kg) details.push(`Peso: ${clinicalItem.weight_kg}kg`);
  if (clinicalItem.height_cm) details.push(`Altura: ${clinicalItem.height_cm}cm`);
  if (clinicalItem.blood_pressure_systolic && clinicalItem.blood_pressure_diastolic) {
    details.push(`PA: ${clinicalItem.blood_pressure_systolic}/${clinicalItem.blood_pressure_diastolic}`);
  }

  return details.join(' | ') || 'Dados clinicos registrados';
}

export function buildClinicalDataTimelineEvents(items: ClinicalDataRow[] | null | undefined): TimelineEvent[] {
  return (items ?? []).map((clinicalItem) => ({
    id: clinicalItem.id,
    type: 'clinical_data',
    date: clinicalItem.measurement_date,
    title: 'Medicao Clinica',
    description: getClinicalDataDescription(clinicalItem),
    icon: 'activity',
    data: clinicalItem,
  }));
}

export function buildExamTimelineEvents(exams: ExamRow[] | null | undefined): TimelineEvent[] {
  return (exams ?? []).map((exam) => ({
    id: exam.id,
    type: 'exam',
    date: exam.exam_date,
    title: exam.exam_name,
    description: exam.result_summary || `Exame: ${exam.exam_type || 'N/A'}`,
    icon: 'clipboard',
    data: exam,
  }));
}

export function buildAttachmentTimelineEvents(
  attachments: AttachmentRow[] | null | undefined
): TimelineEvent[] {
  return (attachments ?? []).map((attachment) => ({
    id: attachment.id,
    type: 'attachment',
    date: attachment.created_at,
    title: 'Arquivo Anexado',
    description: attachment.description || attachment.file_name,
    icon: 'paperclip',
    data: attachment,
  }));
}

export function getAgentConsultationSummary(consultation: AgentConsultationRow) {
  switch (consultation.agent_type) {
    case 'cid': {
      let description = consultation.cid_description || 'Consulta de codigo CID';
      if (consultation.confidence_level) {
        description += ` (Confianca: ${consultation.confidence_level})`;
      }

      return {
        title: `CID: ${consultation.cid_code || 'Consulta CID'}`,
        description,
      };
    }
    case 'medication':
      return {
        title: 'Calculo de Medicacao',
        description: 'Calculo de dosagem medicamentosa',
      };
    case 'protocol':
      return {
        title: 'Protocolo Clinico',
        description: 'Consulta de protocolo clinico',
      };
    case 'exams':
      return {
        title: 'Interpretacao de Exames',
        description: 'Auxilio na interpretacao de exames',
      };
    default:
      return {
        title: 'Consulta de Agente IA',
        description: '',
      };
  }
}

export function buildAgentConsultationTimelineEvents(
  consultations: AgentConsultationRow[] | null | undefined
): TimelineEvent[] {
  return (consultations ?? []).map((consultation) => {
    const summary = getAgentConsultationSummary(consultation);

    return {
      id: consultation.id,
      type: 'agent_consultation',
      date: consultation.consultation_date,
      title: summary.title,
      description: summary.description,
      doctor: consultation.doctor?.name ?? undefined,
      icon: 'bot',
      data: consultation,
    };
  });
}

export function sortTimelineEvents(events: TimelineEvent[]) {
  return [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
