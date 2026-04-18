import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DoctorProfile } from '@/hooks/useClinicInfoManagement';
import { Loader2, Stethoscope } from 'lucide-react';

type ClinicMedicalTeamSectionProps = {
  doctorPrices: Record<string, number>;
  doctors: DoctorProfile[];
  formatPrice: (price: number) => string;
  loadingDoctors: boolean;
  onPriceChange: (doctorId: string, value: string) => void;
  onSavePrices: () => void;
  onSaveTeam: () => void;
  selectedDoctorIds: string[];
  selectedDoctors: DoctorProfile[];
  toggleDoctor: (doctorId: string, checked: boolean) => void;
};

export function ClinicMedicalTeamSection({
  doctorPrices,
  doctors,
  formatPrice,
  loadingDoctors,
  onPriceChange,
  onSavePrices,
  onSaveTeam,
  selectedDoctorIds,
  selectedDoctors,
  toggleDoctor,
}: ClinicMedicalTeamSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span className="font-semibold">Equipe Medica e Precos</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onSavePrices} disabled={loadingDoctors}>
            Salvar precos
          </Button>
          <Button variant="outline" onClick={onSaveTeam} disabled={loadingDoctors}>
            Salvar equipe medica
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {selectedDoctors.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 text-sm text-muted-foreground">Equipe atual selecionada</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selectedDoctors.map((doctor) => (
                <div key={doctor.id} className="rounded-md border bg-blue-50/30 p-3">
                  <div className="truncate font-medium text-foreground">
                    {doctor.name || 'Medico'}
                  </div>
                  {doctor.specialization && (
                    <div className="truncate text-xs text-muted-foreground">
                      {doctor.specialization}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingDoctors ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando medicos...
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-muted-foreground">Nenhum medico cadastrado.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="rounded-lg border p-4 transition-colors hover:shadow-sm"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground">
                      {doctor.name || 'Medico'}
                    </div>
                    {doctor.specialization && (
                      <div className="truncate text-sm text-muted-foreground">
                        {doctor.specialization}
                      </div>
                    )}
                    {doctor.email && (
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {doctor.email}
                      </div>
                    )}
                  </div>
                  <div className="pt-1">
                    <Checkbox
                      checked={selectedDoctorIds.includes(doctor.id)}
                      onCheckedChange={(checked) =>
                        toggleDoctor(doctor.id, Boolean(checked))
                      }
                      aria-label={`Selecionar ${doctor.name || 'medico'}`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`price-${doctor.id}`} className="text-xs">
                    Preco da Consulta
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id={`price-${doctor.id}`}
                      type="text"
                      placeholder="0,00"
                      value={formatPrice(doctorPrices[doctor.id] || 0)}
                      onChange={(e) => onPriceChange(doctor.id, e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
