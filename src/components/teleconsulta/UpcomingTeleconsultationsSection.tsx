import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Button } from '@/components/ui/button';
import type { UpcomingTeleconsultation } from '@/hooks/useTeleconsultationSession';

type UpcomingTeleconsultationsSectionProps = {
  errorUpcoming: string | null;
  loadingUpcoming: boolean;
  onPrepareInvite: (teleconsultation: UpcomingTeleconsultation) => void;
  upcoming: UpcomingTeleconsultation[];
};

export function UpcomingTeleconsultationsSection({
  errorUpcoming,
  loadingUpcoming,
  onPrepareInvite,
  upcoming,
}: UpcomingTeleconsultationsSectionProps) {
  return (
    <MagicBentoCard contentClassName="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Proximas TeleConsultas</h2>
        <p className="text-sm text-muted-foreground">Baseadas em agendamentos futuros</p>
      </div>
      {loadingUpcoming ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : errorUpcoming ? (
        <p className="text-destructive">Erro: {errorUpcoming}</p>
      ) : upcoming.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma teleconsulta futura.</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((teleconsultation) => {
            const appointment = teleconsultation.appointments;
            const when = appointment?.scheduled_at
              ? new Date(appointment.scheduled_at)
              : teleconsultation.start_time
                ? new Date(teleconsultation.start_time)
                : null;
            const patientName = appointment?.patients?.name || 'Paciente';
            const doctorName = appointment?.doctor_profile?.name || 'Medico(a)';

            return (
              <div
                key={teleconsultation.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{patientName}</div>
                  <div className="truncate text-sm text-muted-foreground">Com {doctorName}</div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-medium">{when ? when.toLocaleDateString() : '-'}</div>
                  <div className="text-xs text-muted-foreground">
                    {when ? when.toLocaleTimeString() : '-'}
                  </div>
                  <div className="mt-2">
                    <Button size="sm" onClick={() => onPrepareInvite(teleconsultation)}>
                      Iniciar teleconsulta
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MagicBentoCard>
  );
}
