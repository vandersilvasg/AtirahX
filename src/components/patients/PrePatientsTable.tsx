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
import { Pencil, Trash2 } from 'lucide-react';

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
          <TableHead>Funil</TableHead>
          <TableHead>Temperatura</TableHead>
          <TableHead>Ticket</TableHead>
          <TableHead>Próxima ação</TableHead>
          <TableHead className="text-right">Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prePatients.map((prePatient) => (
          <TableRow key={prePatient.id}>
            <TableCell>{prePatient.name ?? '-'}</TableCell>
            <TableCell>
              <div className="space-y-0.5">
                <span className="text-sm">{prePatient.email ?? '-'}</span>
                <div className="text-xs text-muted-foreground">
                  {formatWhatsappToDDDNumber(prePatient.phone)}
                </div>
              </div>
            </TableCell>
            <TableCell>{prePatient.source_channel ?? '-'}</TableCell>
            <TableCell>{prePatient.stage ?? '-'}</TableCell>
            <TableCell className="capitalize">{prePatient.temperature ?? '-'}</TableCell>
            <TableCell>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(Number(prePatient.estimated_value || 0))}
            </TableCell>
            <TableCell>{prePatient.next_action ?? '-'}</TableCell>
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
        ))}
      </TableBody>
    </Table>
  );
}
