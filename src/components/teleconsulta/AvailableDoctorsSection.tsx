import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DoctorAvailability = {
  doctorId: string;
  profile: {
    name?: string | null;
    specialization?: string | null;
  };
};

type AvailableDoctorsSectionProps = {
  availableDoctors: DoctorAvailability[];
  errorDoctors: string | null;
  loadingDoctors: boolean;
};

export function AvailableDoctorsSection({
  availableDoctors,
  errorDoctors,
  loadingDoctors,
}: AvailableDoctorsSectionProps) {
  return (
    <MagicBentoCard contentClassName="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Medicos disponiveis agora</h2>
        <p className="text-sm text-muted-foreground">Com base na tabela de horarios</p>
      </div>
      {loadingDoctors ? (
        <p className="text-muted-foreground">Carregando medicos...</p>
      ) : errorDoctors ? (
        <p className="text-destructive">Erro: {errorDoctors}</p>
      ) : availableDoctors.length === 0 ? (
        <p className="text-muted-foreground">Nenhum medico disponivel neste momento.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {availableDoctors.map(({ doctorId, profile }) => {
            const displayName = profile.name || 'Medico(a)';
            const initials = displayName
              .split(' ')
              .filter(Boolean)
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <Card key={doctorId} className="transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage src={undefined} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{displayName}</CardTitle>
                    <CardDescription className="truncate">
                      {profile.specialization || 'Clinico(a)'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" className="w-full" variant="secondary">
                    Iniciar teleconsulta
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </MagicBentoCard>
  );
}
