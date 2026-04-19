import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatWhatsappToDDDNumber,
  type PrePatient,
} from '@/hooks/usePrePatientsManagement';
import { Pencil, ShieldAlert, Target, Thermometer, Trash2 } from 'lucide-react';

function getTemperatureBadgeClassName(temperature?: string | null) {
  if (temperature === 'quente') {
    return 'border-rose-500/20 bg-rose-500/10 text-rose-600';
  }
  if (temperature === 'frio') {
    return 'border-slate-500/20 bg-slate-500/10 text-slate-600';
  }
  return 'border-amber-500/20 bg-amber-500/10 text-amber-700';
}

function getStageBadgeClassName(stage?: string | null) {
  if (stage === 'fechou') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
  }
  if (stage === 'perdido') {
    return 'border-destructive/20 bg-destructive/10 text-destructive';
  }
  if (stage === 'agendado' || stage === 'compareceu') {
    return 'border-sky-500/20 bg-sky-500/10 text-sky-700';
  }
  return 'border-primary/20 bg-primary/10 text-primary';
}

function getCommercialStatus(prePatient: PrePatient) {
  if (prePatient.fechou || prePatient.stage === 'fechou') {
    return {
      label: 'Fechado',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
    };
  }

  if (prePatient.no_show) {
    return {
      label: 'No-show',
      className: 'border-destructive/20 bg-destructive/10 text-destructive',
    };
  }

  if (prePatient.next_action) {
    return {
      label: 'Follow-up ativo',
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
    };
  }

  return {
    label: 'Em andamento',
    className: 'border-slate-500/20 bg-slate-500/10 text-slate-700',
  };
}

type PrePatientsTableProps = {
  error: string | null;
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  onEdit: (prePatient: PrePatient) => void;
  prePatients: PrePatient[];
};

export function PrePatientsTable({
  error,
  loading,
  onDelete,
  onEdit,
  prePatients,
}: PrePatientsTableProps) {
  return (
    <Table>
      <TableCaption>
        {loading
          ? 'Carregando...'
          : error
            ? `Erro: ${error}`
            : `${prePatients.length} lead(s) encontrado(s)`}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Pipeline</TableHead>
          <TableHead>Ticket</TableHead>
          <TableHead>Proxima acao</TableHead>
          <TableHead className="text-right">Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prePatients.map((prePatient) => {
          const status = getCommercialStatus(prePatient);

          return (
            <TableRow key={prePatient.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{prePatient.name ?? '-'}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                    {prePatient.health_insurance && (
                      <Badge variant="secondary">{prePatient.health_insurance}</Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <span className="text-sm">{prePatient.email ?? '-'}</span>
                  <div className="text-xs text-muted-foreground">
                    {formatWhatsappToDDDNumber(prePatient.phone)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{prePatient.source_channel ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">
                    {prePatient.area_interest ?? 'Sem area definida'}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Badge variant="outline" className={getStageBadgeClassName(prePatient.stage)}>
                    <Target className="mr-1 h-3 w-3" />
                    {prePatient.stage ?? 'sem etapa'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`capitalize ${getTemperatureBadgeClassName(prePatient.temperature)}`}
                  >
                    <Thermometer className="mr-1 h-3 w-3" />
                    {prePatient.temperature ?? 'morno'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(prePatient.estimated_value || 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {prePatient.compareceu ? 'Compareceu' : 'Ainda sem comparecimento'}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {prePatient.next_action ? (
                  <div className="space-y-1">
                    <p className="text-sm">{prePatient.next_action}</p>
                    <p className="text-xs text-muted-foreground">
                      {prePatient.last_contact_at
                        ? `Ultimo contato: ${new Date(prePatient.last_contact_at).toLocaleDateString('pt-BR')}`
                        : 'Sem ultimo contato registrado'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldAlert className="h-4 w-4" />
                    Sem proxima acao
                  </div>
                )}
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button variant="outline" size="sm" onClick={() => onEdit(prePatient)}>
                  <Pencil className="mr-1 h-4 w-4" /> Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void onDelete(prePatient.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Remover
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
