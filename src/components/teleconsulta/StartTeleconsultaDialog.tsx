import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type StartTeleconsultaDialogProps = {
  confirmOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStartWithInvite: () => void;
  onStartWithoutInvite: () => void;
};

export function StartTeleconsultaDialog({
  confirmOpen,
  onOpenChange,
  onStartWithInvite,
  onStartWithoutInvite,
}: StartTeleconsultaDialogProps) {
  return (
    <Dialog open={confirmOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Iniciar Teleconsulta</DialogTitle>
          <DialogDescription>
            Deseja enviar o link de acesso para o paciente via WhatsApp?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onStartWithoutInvite}>
            Nao enviar, apenas abrir
          </Button>
          <Button onClick={onStartWithInvite}>Sim, enviar e abrir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
