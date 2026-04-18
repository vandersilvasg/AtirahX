import { Badge } from '@/components/ui/badge';

type CrmHeaderProps = {
  appointmentsCount: number;
};

export function CrmHeader({ appointmentsCount }: CrmHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">CRM</h1>
        <p className="mt-1 text-muted-foreground">
          Jornada do paciente em formato Kanban. Arraste os cards entre as etapas.
        </p>
      </div>
      <Badge variant="secondary" className="w-fit">
        {appointmentsCount} card(s) na jornada
      </Badge>
    </div>
  );
}
