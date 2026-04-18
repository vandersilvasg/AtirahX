import type { DragEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CRM_STAGES,
  formatDateLabel,
  formatPhone,
  getAppointmentDateRaw,
  type AppointmentRow,
  type DoctorRow,
  type PatientRow,
  type StageKey,
} from '@/hooks/useCrmJourney';
import { Calendar, Loader2, Phone, Stethoscope } from 'lucide-react';

type CrmKanbanBoardProps = {
  appointmentsByStage: Record<StageKey, AppointmentRow[]>;
  doctorById: Map<string, DoctorRow>;
  draggingAppointmentId: string | null;
  handleDragEnd: () => void;
  handleDragOverStage: (event: DragEvent<HTMLDivElement>) => void;
  handleDragStart: (event: DragEvent<HTMLDivElement>, appointmentId: string) => void;
  handleDropOnStage: (event: DragEvent<HTMLDivElement>, targetStage: StageKey) => Promise<void>;
  patientById: Map<string, PatientRow>;
  updatingAppointmentId: string | null;
};

export function CrmKanbanBoard({
  appointmentsByStage,
  doctorById,
  draggingAppointmentId,
  handleDragEnd,
  handleDragOverStage,
  handleDragStart,
  handleDropOnStage,
  patientById,
  updatingAppointmentId,
}: CrmKanbanBoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {CRM_STAGES.map((stage) => {
          const stageAppointments = appointmentsByStage[stage.key];

          return (
            <Card key={stage.key} className="w-[300px] shrink-0 bg-muted/25">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                    {stage.label}
                  </CardTitle>
                  <Badge variant="outline" className={stage.badgeClass}>
                    {stageAppointments.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent
                className={`min-h-[420px] space-y-3 rounded-md ${
                  draggingAppointmentId ? 'bg-muted/40' : ''
                }`}
                onDragOver={handleDragOverStage}
                onDrop={(event) => void handleDropOnStage(event, stage.key)}
              >
                {stageAppointments.length === 0 ? (
                  <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-background/60 px-4 text-center text-xs text-muted-foreground">
                    Arraste pacientes para esta etapa
                  </div>
                ) : (
                  stageAppointments.map((appointment) => {
                    const patient = appointment.patient_id
                      ? patientById.get(appointment.patient_id)
                      : undefined;
                    const doctor = appointment.doctor_id
                      ? doctorById.get(appointment.doctor_id)
                      : undefined;

                    return (
                      <div
                        key={appointment.id}
                        draggable={updatingAppointmentId !== appointment.id}
                        onDragStart={(event) => handleDragStart(event, appointment.id)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-grab rounded-lg border bg-card p-3 shadow-sm transition active:cursor-grabbing ${
                          draggingAppointmentId === appointment.id ? 'opacity-40' : ''
                        } ${updatingAppointmentId === appointment.id ? 'ring-2 ring-primary/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight text-foreground">
                            {patient?.name || 'Paciente sem cadastro'}
                          </p>
                          {updatingAppointmentId === appointment.id && (
                            <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                          )}
                        </div>

                        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatDateLabel(getAppointmentDateRaw(appointment))}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatPhone(patient?.phone)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                            <span>{doctor?.name ? `Dr(a). ${doctor.name}` : 'Sem medico'}</span>
                          </div>
                        </div>

                        {appointment.reason && (
                          <p className="mt-2 line-clamp-2 text-xs text-foreground/80">
                            {appointment.reason}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
