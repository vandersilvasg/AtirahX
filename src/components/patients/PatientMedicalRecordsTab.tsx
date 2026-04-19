import type { MedicalRecord } from '@/hooks/usePatientData';
import { MedicalHistorySummary } from './MedicalHistorySummary';
import { MedicalRecordForm } from './MedicalRecordForm';
import { MedicalRecordsList } from './MedicalRecordsList';

type PatientMedicalRecordsTabProps = {
  onAdd: () => void;
  onCancel: () => void;
  onSuccess: () => void;
  onView: (record: MedicalRecord) => void;
  patientId: string;
  records: MedicalRecord[];
  showForm: boolean;
};

export function PatientMedicalRecordsTab({
  onAdd,
  onCancel,
  onSuccess,
  onView,
  patientId,
  records,
  showForm,
}: PatientMedicalRecordsTabProps) {
  if (showForm) {
    return (
      <MedicalRecordForm patientId={patientId} onSuccess={onSuccess} onCancel={onCancel} />
    );
  }

  return (
    <>
      <MedicalHistorySummary records={records} />
      <MedicalRecordsList records={records} onAdd={onAdd} onView={onView} />
    </>
  );
}
