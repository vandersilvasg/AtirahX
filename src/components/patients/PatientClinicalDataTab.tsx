import type { ClinicalData } from '@/hooks/usePatientData';
import { ClinicalDataForm } from './ClinicalDataForm';

type PatientClinicalDataTabProps = {
  items: ClinicalData[];
  onCancel: () => void;
  onCreate: () => void;
  onSuccess: () => void;
  patientId: string;
  showForm: boolean;
};

export function PatientClinicalDataTab({
  items,
  onCancel,
  onCreate,
  onSuccess,
  patientId,
  showForm,
}: PatientClinicalDataTabProps) {
  if (showForm) {
    return <ClinicalDataForm patientId={patientId} onSuccess={onSuccess} onCancel={onCancel} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onCreate} className="text-sm text-primary hover:underline">
          + Registrar Dados Clinicos
        </button>
      </div>
      {items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((data) => (
            <div key={data.id} className="rounded-lg border p-4">
              <p className="mb-2 text-sm text-muted-foreground">
                {new Date(data.measurement_date).toLocaleDateString('pt-BR')}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                {data.weight_kg && <p>Peso: {data.weight_kg}kg</p>}
                {data.height_cm && <p>Altura: {data.height_cm}cm</p>}
                {data.bmi && <p>IMC: {data.bmi}</p>}
                {data.blood_pressure_systolic && data.blood_pressure_diastolic && (
                  <p>
                    PA: {data.blood_pressure_systolic}/{data.blood_pressure_diastolic}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <p>Nenhum dado clinico registrado</p>
        </div>
      )}
    </div>
  );
}
