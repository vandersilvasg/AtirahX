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
import { Loader2, Plus } from 'lucide-react';

type UsersAddCalendarDialogProps = {
  isAddingCalendar: boolean;
  isOpen: boolean;
  newCalendarName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  setNewCalendarName: React.Dispatch<React.SetStateAction<string>>;
};

export function UsersAddCalendarDialog({
  isAddingCalendar,
  isOpen,
  newCalendarName,
  onOpenChange,
  onSubmit,
  setNewCalendarName,
}: UsersAddCalendarDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Novo Calendario
          </DialogTitle>
          <DialogDescription>Informe o nome do calendario que deseja adicionar</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calendarName">Nome do Calendario</Label>
            <Input
              id="calendarName"
              placeholder="Ex: Consultas Particulares"
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
              disabled={isAddingCalendar}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isAddingCalendar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isAddingCalendar || !newCalendarName.trim()}>
              {isAddingCalendar ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
