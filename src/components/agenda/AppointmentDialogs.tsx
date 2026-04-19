import { Calendar, Clock, FileText, Loader2, Trash2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  formatAgendaDate,
  formatAgendaDateTime,
  formatAgendaTime,
  getAgendaStatusBadgeVariant,
  getAgendaStatusLabel,
  isHolidayAppointment,
} from './constants';
import type { Appointment } from './types';

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteClick: (appointment: Appointment) => void;
  onEditClick: (appointment: Appointment) => void;
}

export function AppointmentDetailsDialog({
  appointment,
  open,
  onOpenChange,
  onDeleteClick,
  onEditClick,
}: AppointmentDetailsDialogProps) {
  const isHoliday = isHolidayAppointment(appointment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isHoliday ? 'Detalhes do Feriado' : 'Detalhes do Agendamento'}</DialogTitle>
          <DialogDescription>
            {isHoliday
              ? 'Informações sobre o feriado nacional'
              : 'Informações completas sobre o agendamento selecionado'}
          </DialogDescription>
        </DialogHeader>
        {appointment && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {isHoliday ? (
                <Calendar className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{isHoliday ? 'Nome do Feriado' : 'Paciente'}</p>
                <p className="text-sm text-muted-foreground">{appointment.patient_id}</p>
              </div>
            </div>

            {appointment.doctor_id && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Médico</p>
                  <p className="text-sm text-muted-foreground">{appointment.doctor_id}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data</p>
                <p className="text-sm text-muted-foreground">{formatAgendaDate(appointment.scheduled_at)}</p>
              </div>
            </div>

            {!isHoliday && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Horário</p>
                  <p className="text-sm text-muted-foreground">{formatAgendaTime(appointment.scheduled_at)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant={getAgendaStatusBadgeVariant(appointment.status)}>
                  {getAgendaStatusLabel(appointment.status)}
                  {isHoliday && ' 🎉'}
                </Badge>
              </div>
            </div>

            {isHoliday && (
              <div className="rounded-lg border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-purple-100/50 p-4 shadow-sm dark:from-purple-950/30 dark:to-purple-900/20">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">Feriado Nacional</p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">Evento de dia inteiro</p>
                  </div>
                </div>
              </div>
            )}

            {appointment.notes && (
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Notas</p>
                  <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
        {appointment && !isHoliday && (
          <div className="mt-4 flex justify-between gap-2 border-t pt-4">
            <Button variant="destructive" onClick={() => onDeleteClick(appointment)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={() => onEditClick(appointment)}>Editar Evento</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AppointmentDeleteDialogProps {
  appointment: Appointment | null;
  isDeleting: boolean;
  open: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentDeleteDialog({
  appointment,
  isDeleting,
  open,
  onConfirm,
  onOpenChange,
}: AppointmentDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita.
            {appointment && (
              <div className="mt-4 rounded-md bg-muted p-3">
                <p className="text-sm font-medium text-foreground">{appointment.patient_id}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatAgendaDateTime(appointment.scheduled_at)}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deletando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar Evento
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
