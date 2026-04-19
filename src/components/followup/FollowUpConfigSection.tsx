import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TimeUnit } from '@/hooks/useFollowUpManagement';
import { toMinutes } from '@/hooks/useFollowUpManagement';
import { Clock, Save } from 'lucide-react';

type EditConfig = {
  followup1: { value: number; unit: TimeUnit };
  followup2: { value: number; unit: TimeUnit };
  followup3: { value: number; unit: TimeUnit };
};

type FollowUpConfigSectionProps = {
  editConfig: EditConfig;
  loadingConfig: boolean;
  onSave: () => Promise<void>;
  savingConfig: boolean;
  setEditConfig: (value: EditConfig) => void;
};

export function FollowUpConfigSection({
  editConfig,
  loadingConfig,
  onSave,
  savingConfig,
  setEditConfig,
}: FollowUpConfigSectionProps) {
  return (
    <MagicBentoCard>
      <CardHeader className="space-y-4 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Configuracao de Periodos</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Defina o intervalo de tempo para cada follow-up
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-8">
        {loadingConfig ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(['followup1', 'followup2', 'followup3'] as const).map((key, index) => (
                <div key={key} className="group">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
                      {index + 1}
                    </span>
                    {index === 0
                      ? 'Primeiro Follow-up'
                      : index === 1
                        ? 'Segundo Follow-up'
                        : 'Terceiro Follow-up'}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={key} className="mb-1.5 block text-xs text-muted-foreground">
                        Periodo
                      </Label>
                      <Input
                        id={key}
                        type="number"
                        min="1"
                        value={editConfig[key].value}
                        onChange={(e) =>
                          setEditConfig({
                            ...editConfig,
                            [key]: {
                              ...editConfig[key],
                              value: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="h-11 text-center text-lg font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs text-muted-foreground">
                        Unidade
                      </Label>
                      <select
                        value={editConfig[key].unit}
                        onChange={(e) =>
                          setEditConfig({
                            ...editConfig,
                            [key]: {
                              ...editConfig[key],
                              unit: e.target.value as TimeUnit,
                            },
                          })
                        }
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="minutes">Minutos</option>
                        <option value="hours">Horas</option>
                        <option value="days">Dias</option>
                      </select>
                    </div>
                    <div className="pt-1 text-center text-xs text-muted-foreground">
                      = {toMinutes(editConfig[key].value, editConfig[key].unit)} minutos
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button onClick={() => void onSave()} disabled={savingConfig} className="px-6">
                <Save className="mr-2 h-4 w-4" />
                {savingConfig ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </MagicBentoCard>
  );
}
