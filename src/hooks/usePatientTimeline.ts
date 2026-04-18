import { useCallback, useEffect, useState } from 'react';
import {
  buildAgentConsultationTimelineEvents,
  buildAnamnesisTimelineEvents,
  buildAppointmentTimelineEvents,
  buildAttachmentTimelineEvents,
  buildClinicalDataTimelineEvents,
  buildExamTimelineEvents,
  buildMedicalRecordTimelineEvents,
  getPatientTimelineErrorMessage,
  sortTimelineEvents,
  type AgentConsultationRow,
  type AnamnesisRow,
  type AppointmentTimelineRow,
  type AttachmentRow,
  type ClinicalDataRow,
  type ExamRow,
  type MedicalRecordRow,
} from '@/lib/patientTimeline';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';

export interface TimelineEvent {
  id: string;
  type: 'medical_record' | 'appointment' | 'anamnesis' | 'clinical_data' | 'exam' | 'attachment' | 'agent_consultation';
  date: string;
  title: string;
  description?: string;
  doctor?: string;
  icon?: string;
  data?: unknown;
}

export function usePatientTimeline(patientId: string | null) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!patientId) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();
      const { data: records } = await supabase
        .from('medical_records')
        .select(`
          id, 
          appointment_date, 
          chief_complaint, 
          diagnosis,
          doctor:profiles!medical_records_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId);

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id, 
          appointment_date, 
          status, 
          type, 
          notes,
          doctor:profiles!appointments_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId);

      const { data: anamnesis } = await supabase
        .from('anamnesis')
        .select(`
          id, 
          created_at, 
          chief_complaint,
          doctor:profiles!anamnesis_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId);

      const { data: clinicalData } = await supabase
        .from('clinical_data')
        .select('*')
        .eq('patient_id', patientId);

      const { data: exams } = await supabase
        .from('exam_history')
        .select('*')
        .eq('patient_id', patientId);

      const { data: attachments } = await supabase
        .from('medical_attachments')
        .select('*')
        .eq('patient_id', patientId);

      const { data: agentConsultations } = await supabase
        .from('agent_consultations')
        .select(`
          id,
          agent_type,
          consultation_date,
          cid_code,
          cid_description,
          confidence_level,
          consultation_input,
          consultation_output,
          doctor:profiles!agent_consultations_doctor_id_fkey(name)
        `)
        .eq('patient_id', patientId);

      const timelineEvents = sortTimelineEvents([
        ...buildMedicalRecordTimelineEvents(records as MedicalRecordRow[] | null),
        ...buildAppointmentTimelineEvents(appointments as AppointmentTimelineRow[] | null),
        ...buildAnamnesisTimelineEvents(anamnesis as AnamnesisRow[] | null),
        ...buildClinicalDataTimelineEvents(clinicalData as ClinicalDataRow[] | null),
        ...buildExamTimelineEvents(exams as ExamRow[] | null),
        ...buildAttachmentTimelineEvents(attachments as AttachmentRow[] | null),
        ...buildAgentConsultationTimelineEvents(
          agentConsultations as AgentConsultationRow[] | null
        ),
      ]);

      setEvents(timelineEvents);
    } catch (error) {
      console.error('Erro ao buscar timeline:', error);
      setError(getPatientTimelineErrorMessage(error, 'Erro ao carregar timeline'));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const refetch = () => {
    void fetchTimeline();
  };

  useEffect(() => {
    void fetchTimeline();
  }, [fetchTimeline]);

  return {
    events,
    loading,
    error,
    refetch,
  };
}
