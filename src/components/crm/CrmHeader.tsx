import { Badge } from '@/components/ui/badge';

type CrmHeaderProps = {
  appointmentsCount: number;
  hotLeadsCount: number;
  totalPipelineValue: number;
};

export function CrmHeader({
  appointmentsCount,
  hotLeadsCount,
  totalPipelineValue,
}: CrmHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leads & Pacientes</h1>
        <p className="mt-1 text-muted-foreground">
          Pipeline comercial com jornada visual, prioridade e valor em aberto.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="w-fit">
          {appointmentsCount} lead(s) no pipeline
        </Badge>
        <Badge variant="outline" className="w-fit">
          {hotLeadsCount} lead(s) quentes
        </Badge>
        <Badge variant="outline" className="w-fit">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            totalPipelineValue
          )}
        </Badge>
      </div>
    </div>
  );
}
