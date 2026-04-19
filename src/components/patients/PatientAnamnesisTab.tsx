import type { Anamnesis } from '@/hooks/usePatientData';
import { AnamnesisForm } from './AnamnesisForm';

type PatientAnamnesisTabProps = {
  items: Anamnesis[];
  onCancel: () => void;
  onCreate: () => void;
  onSuccess: () => void;
  patientId: string;
  showForm: boolean;
};

export function PatientAnamnesisTab({
  items,
  onCancel,
  onCreate,
  onSuccess,
  patientId,
  showForm,
}: PatientAnamnesisTabProps) {
  if (showForm) {
    return <AnamnesisForm patientId={patientId} onSuccess={onSuccess} onCancel={onCancel} />;
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">Nenhuma anamnese registrada</p>
        <button onClick={onCreate} className="text-primary hover:underline">
          + Criar primeira anamnese
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onCreate} className="text-sm text-primary hover:underline">
          + Nova Anamnese
        </button>
      </div>
      {items.map((item) => (
        <div key={item.id} className="space-y-2 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString('pt-BR')}
            {item.doctor && ` - Dr(a). ${item.doctor.name}`}
          </p>
          {item.chief_complaint && (
            <p className="text-sm">
              <strong>Queixa:</strong> {item.chief_complaint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
