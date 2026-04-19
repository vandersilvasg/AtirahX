import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getSuggestedNextActions,
  type PrePatientFormData,
} from '@/hooks/usePrePatientsManagement';
import { Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';

type PrePatientsDialogProps = {
  formData: PrePatientFormData;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  open: boolean;
  setFormData: (value: PrePatientFormData) => void;
  title: string;
  description: string;
};

export function PrePatientsDialog({
  formData,
  isSaving,
  onOpenChange,
  onSubmit,
  open,
  setFormData,
  title,
  description,
}: PrePatientsDialogProps) {
  const suggestedNextActions = getSuggestedNextActions(formData.stage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="health_insurance">Convenio</Label>
              <Input
                id="health_insurance"
                value={formData.health_insurance}
                onChange={(e) => setFormData({ ...formData, health_insurance: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_interest">Area de interesse</Label>
              <Input
                id="area_interest"
                value={formData.area_interest}
                onChange={(e) => setFormData({ ...formData, area_interest: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="procedure_interest">Procedimento de interesse</Label>
              <Input
                id="procedure_interest"
                value={formData.procedure_interest}
                onChange={(e) =>
                  setFormData({ ...formData, procedure_interest: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_channel">Origem</Label>
              <Input
                id="source_channel"
                value={formData.source_channel}
                onChange={(e) => setFormData({ ...formData, source_channel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Etapa do funil</Label>
              <select
                id="stage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.stage}
                onChange={(e) => {
                  const nextStage = e.target.value;
                  const nextSuggestedAction = getSuggestedNextActions(nextStage)[0] ?? '';
                  setFormData({
                    ...formData,
                    stage: nextStage,
                    next_action:
                      !formData.next_action || suggestedNextActions.includes(formData.next_action)
                        ? nextSuggestedAction
                        : formData.next_action,
                  });
                }}
              >
                <option value="lead_novo">Lead novo</option>
                <option value="contato_iniciado">Contato iniciado</option>
                <option value="qualificado">Qualificado</option>
                <option value="agendado">Agendado</option>
                <option value="compareceu">Compareceu</option>
                <option value="fechou">Fechou</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura</Label>
              <select
                id="temperature"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    temperature: e.target.value as 'frio' | 'morno' | 'quente',
                  })
                }
              >
                <option value="frio">Frio</option>
                <option value="morno">Morno</option>
                <option value="quente">Quente</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_value">Ticket estimado (R$)</Label>
              <Input
                id="estimated_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_action">Proxima acao</Label>
              <Input
                id="next_action"
                value={formData.next_action}
                onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
              />
              {suggestedNextActions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestedNextActions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto whitespace-normal py-1.5 text-left"
                      onClick={() => setFormData({ ...formData, next_action: suggestion })}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="response_time_seconds">Tempo de resposta (s)</Label>
              <Input
                id="response_time_seconds"
                type="number"
                min="0"
                step="1"
                value={formData.response_time_seconds}
                onChange={(e) =>
                  setFormData({ ...formData, response_time_seconds: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_contact_at">Ultimo contato</Label>
              <Input
                id="last_contact_at"
                type="datetime-local"
                value={formData.last_contact_at}
                onChange={(e) => setFormData({ ...formData, last_contact_at: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lost_reason">Motivo de perda</Label>
              <Input
                id="lost_reason"
                value={formData.lost_reason}
                onChange={(e) => setFormData({ ...formData, lost_reason: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:col-span-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.compareceu}
                  onChange={(e) => setFormData({ ...formData, compareceu: e.target.checked })}
                />
                Compareceu
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.fechou}
                  onChange={(e) => setFormData({ ...formData, fechou: e.target.checked })}
                />
                Fechou
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.no_show}
                  onChange={(e) => setFormData({ ...formData, no_show: e.target.checked })}
                />
                No-show
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
