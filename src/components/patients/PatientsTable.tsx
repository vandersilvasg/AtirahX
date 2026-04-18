import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  calculateAge,
  formatWhatsappToDDDNumber,
  getInitials,
  isValidDate,
  type Patient,
} from '@/hooks/usePatientsManagement';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PatientsTableProps = {
  error: string | null;
  loading: boolean;
  onSelectPatient: (patientId: string) => void;
  patients: Patient[];
};

export function PatientsTable({
  error,
  loading,
  onSelectPatient,
  patients,
}: PatientsTableProps) {
  return (
    <Table>
      <TableCaption>
        {loading
          ? 'Carregando...'
          : error
            ? `Erro: ${error}`
            : `${patients.length} paciente(s) encontrado(s)`}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Idade</TableHead>
          <TableHead>Proxima Consulta</TableHead>
          <TableHead className="text-right">Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => {
          const age = calculateAge(patient.birth_date);

          return (
            <TableRow
              key={patient.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectPatient(patient.id)}
            >
              <TableCell>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={patient.avatar_url} alt={patient.name} />
                  <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{patient.name}</p>
                  {patient.cpf && (
                    <p className="text-xs text-muted-foreground">CPF: {patient.cpf}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  {patient.email && (
                    <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {patient.email}
                    </p>
                  )}
                  {patient.phone && (
                    <p className="text-sm text-muted-foreground">
                      {formatWhatsappToDDDNumber(patient.phone)}
                    </p>
                  )}
                  {!patient.email && !patient.phone && (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {age ? (
                  <span className="text-sm">{age} anos</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {patient.next_appointment_date && isValidDate(patient.next_appointment_date) ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {format(new Date(patient.next_appointment_date), "dd/MM/yyyy 'as' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Nao agendada</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPatient(patient.id);
                  }}
                >
                  Ver Detalhes
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
