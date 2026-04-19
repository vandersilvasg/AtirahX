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
import type { ManagedUser } from '@/hooks/useUsersManagement';
import { Loader2 } from 'lucide-react';

type UsersDeleteDialogProps = {
  isDeleting: boolean;
  isOpen: boolean;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
  userToDelete: ManagedUser | null;
};

export function UsersDeleteDialog({
  isDeleting,
  isOpen,
  onDelete,
  onOpenChange,
  userToDelete,
}: UsersDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar o usuario <strong>{userToDelete?.name}</strong>?
            <br />
            <br />
            Esta acao nao pode ser desfeita. Todos os dados associados a este usuario serao removidos permanentemente.
            {userToDelete?.role === 'doctor' && (
              <>
                <br />
                <br />
                <strong>Atencao:</strong> Os horarios de trabalho configurados para este medico tambem serao deletados.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deletando...
              </>
            ) : (
              'Deletar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
