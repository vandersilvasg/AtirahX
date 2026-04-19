import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { DoctorSchedule } from '@/hooks/useDoctorSchedule';
import { Loader2, Save } from 'lucide-react';

type DayOfWeek = {
  label: string;
  value: number;
};

type ScheduleConfigSectionProps = {
  daysOfWeek: DayOfWeek[];
  isSaving: boolean;
  localSchedules: Record<number, DoctorSchedule>;
  onSaveSchedules: () => void;
  onScheduleChange: <K extends keyof DoctorSchedule>(
    dayOfWeek: number,
    field: K,
    value: DoctorSchedule[K]
  ) => void;
};

export function ScheduleConfigSection({
  daysOfWeek,
  isSaving,
  localSchedules,
  onSaveSchedules,
  onScheduleChange,
}: ScheduleConfigSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Configure seus horarios de trabalho para cada dia da semana
        </p>
        <Button onClick={onSaveSchedules} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Todos
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {daysOfWeek.map((day) => {
          const schedule = localSchedules[day.value];
          if (!schedule) return null;

          return (
            <MagicBentoCard key={day.value} contentClassName="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{day.label}</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${day.value}`}>Ativo</Label>
                    <Switch
                      id={`active-${day.value}`}
                      checked={schedule.is_active}
                      onCheckedChange={(checked) =>
                        onScheduleChange(day.value, 'is_active', checked)
                      }
                    />
                  </div>
                </div>

                {schedule.is_active && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`start-${day.value}`}>Inicio</Label>
                      <Input
                        id={`start-${day.value}`}
                        type="time"
                        value={schedule.start_time}
                        onChange={(event) =>
                          onScheduleChange(day.value, 'start_time', event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`end-${day.value}`}>Fim</Label>
                      <Input
                        id={`end-${day.value}`}
                        type="time"
                        value={schedule.end_time}
                        onChange={(event) =>
                          onScheduleChange(day.value, 'end_time', event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`duration-${day.value}`}>
                        Duracao da Consulta (min)
                      </Label>
                      <Input
                        id={`duration-${day.value}`}
                        type="number"
                        min="15"
                        step="5"
                        value={schedule.appointment_duration}
                        onChange={(event) =>
                          onScheduleChange(
                            day.value,
                            'appointment_duration',
                            parseInt(event.target.value, 10)
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`break-start-${day.value}`}>Inicio Intervalo</Label>
                      <Input
                        id={`break-start-${day.value}`}
                        type="time"
                        value={schedule.break_start_time || ''}
                        onChange={(event) =>
                          onScheduleChange(
                            day.value,
                            'break_start_time',
                            event.target.value || undefined
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`break-end-${day.value}`}>Fim Intervalo</Label>
                      <Input
                        id={`break-end-${day.value}`}
                        type="time"
                        value={schedule.break_end_time || ''}
                        onChange={(event) =>
                          onScheduleChange(
                            day.value,
                            'break_end_time',
                            event.target.value || undefined
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </MagicBentoCard>
          );
        })}
      </div>
    </div>
  );
}
