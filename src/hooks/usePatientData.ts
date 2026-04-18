import { useCallback, useEffect, useState } from 'react';
import {
  buildPatientData,
  EMPTY_PATIENT_DATA,
  getPatientDataErrorMessage,
  PATIENT_DATA_SELECTS,
  type PatientData,
} from '@/lib/patientData';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';

export type {
  AgentExam,
  Anamnesis,
  ClinicalData,
  ExamHistory,
  MedicalAttachment,
  MedicalRecord,
  Patient,
  PatientData,
  PatientDoctorRelation,
} from '@/lib/patientData';

export function usePatientData(patientId: string | null) {
  const [data, setData] = useState<PatientData>(EMPTY_PATIENT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientData = useCallback(async () => {
    if (!patientId) {
      setData(EMPTY_PATIENT_DATA);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = await getSupabaseClient();
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;

      const [
        recordsResult,
        anamnesisResult,
        clinicalResult,
        examsResult,
        attachmentsResult,
        agentExamsResult,
        doctorsResult,
      ] = await Promise.all([
        supabase
          .from('medical_records')
          .select(PATIENT_DATA_SELECTS.medicalRecords)
          .eq('patient_id', patientId)
          .order('appointment_date', { ascending: false }),
        supabase
          .from('anamnesis')
          .select(PATIENT_DATA_SELECTS.anamnesis)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('clinical_data')
          .select('*')
          .eq('patient_id', patientId)
          .order('measurement_date', { ascending: false }),
        supabase
          .from('exam_history')
          .select('*')
          .eq('patient_id', patientId)
          .order('exam_date', { ascending: false }),
        supabase
          .from('medical_attachments')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('agent_consultations')
          .select(PATIENT_DATA_SELECTS.agentExams)
          .eq('patient_id', patientId)
          .eq('agent_type', 'exams')
          .order('consultation_date', { ascending: false }),
        supabase
          .from('patient_doctors')
          .select(PATIENT_DATA_SELECTS.doctors)
          .eq('patient_id', patientId),
      ]);

      if (recordsResult.error) throw recordsResult.error;
      if (anamnesisResult.error) throw anamnesisResult.error;
      if (clinicalResult.error) throw clinicalResult.error;
      if (examsResult.error) throw examsResult.error;
      if (attachmentsResult.error) throw attachmentsResult.error;
      if (agentExamsResult.error) throw agentExamsResult.error;
      if (doctorsResult.error) throw doctorsResult.error;

      setData(
        buildPatientData({
          patient: patientData,
          medicalRecords: recordsResult.data,
          anamnesis: anamnesisResult.data,
          clinicalData: clinicalResult.data,
          examHistory: examsResult.data,
          attachments: attachmentsResult.data,
          agentExams: agentExamsResult.data,
          doctors: doctorsResult.data,
        })
      );
    } catch (error) {
      console.error('Erro ao buscar dados do paciente:', error);
      setError(getPatientDataErrorMessage(error, 'Erro ao carregar dados'));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const refetch = () => {
    void fetchPatientData();
  };

  useEffect(() => {
    void fetchPatientData();
  }, [fetchPatientData]);

  return {
    ...data,
    loading,
    error,
    refetch,
  };
}
