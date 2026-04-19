import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DOCTOR_SCHEDULE_DAYS } from '@/hooks/useDoctorScheduleManagement';
import type { DoctorSchedule as ScheduleType } from '@/hooks/useDoctorSchedule';
import { Calendar, Clock, Coffee, Timer } from 'lucide-react';

type DoctorScheduleGridProps = {
  localSchedules: Record<number, ScheduleType>;
  onScheduleChange: (
    dayOfWeek: number,
    field: keyof ScheduleType,
    value: ScheduleType[keyof ScheduleType]
  ) => void;
};

export function DoctorScheduleGrid({
  localSchedules,
  onScheduleChange,
}: DoctorScheduleGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {DOCTOR_SCHEDULE_DAYS.map((day) => {
        const schedule = localSchedules[day.value];
        if (!schedule) return null;

        return (
          <Card
            key={day.value}
            className={`transition-all duration-200 ${
              schedule.is_active
                ? 'border-primary/50 bg-primary/5'
                : 'border-muted bg-muted/20'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  {day.label}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {schedule.is_active ? (
                    <Badge variant="default" className="bg-green-600">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                  <Switch
                    id={`active-${day.value}`}
                    checked={schedule.is_active}
                    onCheckedChange={(checked) =>
                      onScheduleChange(day.value, 'is_active', checked)
                    }
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {schedule.is_active ? (
                <>
                  <div className="space-y-3 rounded-lg border bg-background/80 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Horario de Funcionamento
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`start-${day.value}`} className="text-xs">
                          Inicio
                        </Label>
                        <Input
                          id={`start-${day.value}`}
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) =>
                            onScheduleChange(day.value, 'start_time', e.target.value)
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`end-${day.value}`} className="text-xs">
                          Fim
                        </Label>
                        <Input
                          id={`end-${day.value}`}
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) =>
                            onScheduleChange(day.value, 'end_time', e.target.value)
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border bg-background/80 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      Duracao da Consulta
                    </div>
                    <div className="space-y-1.5">
                      <Input
                        id={`duration-${day.value}`}
                        type="number"
                        min="15"
                        step="5"
                        value={schedule.appointment_duration}
                        onChange={(e) =>
                          onScheduleChange(
                            day.value,
                            'appointment_duration',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="h-9"
                      />
                      <p className="text-xs text-muted-foreground">Minutos por consulta</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border bg-background/80 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Coffee className="h-4 w-4" />
                      Intervalo (Almoco/Pausa)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`break-start-${day.value}`} className="text-xs">
                          Inicio
                        </Label>
                        <Input
                          id={`break-start-${day.value}`}
                          type="time"
                          value={schedule.break_start_time || ''}
                          onChange={(e) =>
                            onScheduleChange(
                              day.value,
                              'break_start_time',
                              e.target.value || undefined
                            )
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`break-end-${day.value}`} className="text-xs">
                          Fim
                        </Label>
                        <Input
                          id={`break-end-${day.value}`}
                          type="time"
                          value={schedule.break_end_time || ''}
                          onChange={(e) =>
                            onScheduleChange(
                              day.value,
                              'break_end_time',
                              e.target.value || undefined
                            )
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Calendar className="mx-auto mb-2 h-12 w-12 opacity-30" />
                  <p className="text-sm">Dia inativo</p>
                  <p className="mt-1 text-xs">Ative para configurar os horarios</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
