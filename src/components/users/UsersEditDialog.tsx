import { DoctorAvatarUpload } from '@/components/doctors/DoctorAvatarUpload';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ManagedUser, UserRole } from '@/hooks/useUsersManagement';
import { Edit, Loader2 } from 'lucide-react';

type EditFormData = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  role: UserRole;
  avatar_url: string;
};

type UsersEditDialogProps = {
  editFormData: EditFormData;
  isOpen: boolean;
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  setEditFormData: React.Dispatch<React.SetStateAction<EditFormData>>;
  userToEdit: ManagedUser | null;
};

export function UsersEditDialog({
  editFormData,
  isOpen,
  isUpdating,
  onOpenChange,
  onSubmit,
  setEditFormData,
  userToEdit,
}: UsersEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>Atualize as informacoes do usuario</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex justify-center py-4">
            <DoctorAvatarUpload
              doctorId={userToEdit?.id || ''}
              avatarUrl={editFormData.avatar_url}
              doctorName={editFormData.name || 'Usuario'}
              onUploadSuccess={(url) => setEditFormData({ ...editFormData, avatar_url: url })}
              onRemoveSuccess={() => setEditFormData({ ...editFormData, avatar_url: '' })}
              size="lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome Completo</Label>
            <Input
              id="edit-name"
              placeholder="Nome do usuario"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="email@exemplo.com"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input
              id="edit-phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              disabled={isUpdating}
            />
          </div>

          {editFormData.role === 'doctor' && (
            <div className="space-y-2">
              <Label htmlFor="edit-specialization">Especializacao</Label>
              <Input
                id="edit-specialization"
                placeholder="Ex: Cardiologista, Pediatra, etc."
                value={editFormData.specialization}
                onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                disabled={isUpdating}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-role">Perfil</Label>
            <Select
              value={editFormData.role}
              onValueChange={(value: 'doctor' | 'secretary' | 'owner') =>
                setEditFormData({ ...editFormData, role: value })
              }
              disabled={isUpdating || userToEdit?.role === 'owner'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Medico</SelectItem>
                <SelectItem value="secretary">Secretaria</SelectItem>
                {userToEdit?.role === 'owner' && <SelectItem value="owner">Dono</SelectItem>}
              </SelectContent>
            </Select>
            {userToEdit?.role === 'owner' && (
              <p className="text-xs text-muted-foreground">Nao e possivel alterar o perfil de Dono</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alteracoes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
