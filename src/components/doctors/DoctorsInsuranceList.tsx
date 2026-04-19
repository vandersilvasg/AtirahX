import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DoctorSummary } from '@/hooks/useDoctorsInsurance';
import { Award, Building2, FileText, Mail, Stethoscope } from 'lucide-react';

type DoctorsInsuranceListProps = {
  filteredDoctors: DoctorSummary[];
  hasAnyInsurance: boolean;
};

export function DoctorsInsuranceList({
  filteredDoctors,
  hasAnyInsurance,
}: DoctorsInsuranceListProps) {
  if (!hasAnyInsurance) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Award className="mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Nenhum convenio encontrado</h2>
          <p className="text-muted-foreground">
            Ainda nao existem medicos com convenios vinculados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredDoctors.map((doctor) => (
        <Card key={doctor.doctor_id}>
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">{doctor.doctor_name}</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {doctor.doctor_specialty ? (
                    <span className="inline-flex items-center gap-1">
                      <Stethoscope className="h-4 w-4" />
                      {doctor.doctor_specialty}
                    </span>
                  ) : null}
                  {doctor.doctor_email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {doctor.doctor_email}
                    </span>
                  ) : null}
                </div>
              </div>

              <Badge variant="secondary">{doctor.total_insurance_plans} planos</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Operadoras
                </div>
                <p className="text-sm text-muted-foreground">
                  {doctor.insurance_companies || 'Sem operadoras vinculadas'}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Planos
                </div>
                <p className="text-sm text-muted-foreground">
                  {doctor.insurance_plans_list || 'Sem planos vinculados'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
