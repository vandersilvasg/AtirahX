export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  avatar_url?: string;
  health_insurance?: string;
  next_appointment_date?: string;
  last_appointment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  chief_complaint?: string;
  history_present_illness?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescriptions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    name: string;
    specialization?: string;
  };
}

export interface Anamnesis {
  id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint?: string;
  history_present_illness?: string;
  past_medical_history?: string;
  family_history?: string;
  social_history?: string;
  allergies?: string;
  current_medications?: string;
  review_of_systems?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    name: string;
  };
}

export interface ClinicalData {
  id: string;
  patient_id: string;
  doctor_id?: string;
  measurement_date: string;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature_celsius?: number;
  oxygen_saturation?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamHistory {
  id: string;
  patient_id: string;
  doctor_id?: string;
  exam_type: string;
  exam_name: string;
  exam_date: string;
  result_summary?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalAttachment {
  id: string;
  patient_id: string;
  uploaded_by?: string;
  related_to_type?: string;
  related_to_id?: string;
  file_name: string;
  file_path: string;
  file_size_bytes?: number;
  file_type?: string;
  description?: string;
  created_at: string;
}

export interface AgentExam {
  id: string;
  patient_id: string;
  doctor_id: string;
  agent_type: string;
  consultation_input: unknown;
  consultation_output: unknown;
  exam_type?: string;
  exam_result_summary?: string;
  exam_file_name?: string;
  exam_analysis_date?: string;
  consultation_date: string;
  created_at: string;
  doctor?: {
    name: string;
  };
}

export interface PatientDoctorRelation {
  id: string;
  patient_id: string;
  doctor_id: string;
  created_at?: string;
  doctor?: {
    id: string;
    name: string;
    specialization?: string;
  };
}

export interface PatientData {
  patient: Patient | null;
  medicalRecords: MedicalRecord[];
  anamnesis: Anamnesis[];
  clinicalData: ClinicalData[];
  examHistory: ExamHistory[];
  attachments: MedicalAttachment[];
  agentExams: AgentExam[];
  doctors: PatientDoctorRelation[];
}

export const EMPTY_PATIENT_DATA: PatientData = {
  patient: null,
  medicalRecords: [],
  anamnesis: [],
  clinicalData: [],
  examHistory: [],
  attachments: [],
  agentExams: [],
  doctors: [],
};

export const PATIENT_DATA_SELECTS = {
  medicalRecords: `
    *,
    doctor:profiles!medical_records_doctor_id_fkey(name, specialization)
  `,
  anamnesis: `
    *,
    doctor:profiles!anamnesis_doctor_id_fkey(name)
  `,
  agentExams: `
    *,
    doctor:profiles!agent_consultations_doctor_id_fkey(name)
  `,
  doctors: `
    *,
    doctor:profiles!patient_doctors_doctor_id_fkey(id, name, specialization)
  `,
} as const;

export function getPatientDataErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function buildPatientData(payload: {
  patient: Patient | null;
  medicalRecords?: MedicalRecord[] | null;
  anamnesis?: Anamnesis[] | null;
  clinicalData?: ClinicalData[] | null;
  examHistory?: ExamHistory[] | null;
  attachments?: MedicalAttachment[] | null;
  agentExams?: AgentExam[] | null;
  doctors?: PatientDoctorRelation[] | null;
}): PatientData {
  return {
    patient: payload.patient,
    medicalRecords: payload.medicalRecords || [],
    anamnesis: payload.anamnesis || [],
    clinicalData: payload.clinicalData || [],
    examHistory: payload.examHistory || [],
    attachments: payload.attachments || [],
    agentExams: payload.agentExams || [],
    doctors: payload.doctors || [],
  };
}
