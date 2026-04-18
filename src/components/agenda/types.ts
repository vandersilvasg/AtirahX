export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  scheduled_at: string;
  status: string;
  notes?: string;
}

export interface AgendaItem {
  id: string;
  nome: string;
  timeZone?: string;
  accessRole?: string;
  color?: string;
  isPrimary?: boolean;
  isSelected?: boolean;
}
