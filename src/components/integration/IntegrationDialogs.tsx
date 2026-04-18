import type { Dispatch, SetStateAction } from 'react';
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
import { CheckCircle2, Edit, Loader2, Play } from 'lucide-react';

type ConnectModalState = {
  open: boolean;
  instanceName: string;
  phoneNumber: string;
  paircode: string;
  isWaitingConnection: boolean;
};

type EditNameModalState = {
  open: boolean;
  instanceId: string;
  currentName: string;
};

type IntegrationDialogsProps = {
  actionLoading: Record<string, boolean>;
  connectModal: ConnectModalState;
  editNameModal: EditNameModalState;
  newName: string;
  onConnect: () => void;
  onResetConnectModal: () => void;
  onResetEditNameModal: () => void;
  onUpdateName: () => void;
  setConnectModal: Dispatch<SetStateAction<ConnectModalState>>;
  setNewName: Dispatch<SetStateAction<string>>;
};

export function IntegrationDialogs({
  actionLoading,
  connectModal,
  editNameModal,
  newName,
  onConnect,
  onResetConnectModal,
  onResetEditNameModal,
  onUpdateName,
  setConnectModal,
  setNewName,
}: IntegrationDialogsProps) {
  return (
    <>
      <Dialog
        open={connectModal.open}
        onOpenChange={(open) => {
          if (!open) onResetConnectModal();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              {connectModal.isWaitingConnection
                ? 'Aguardando conexao'
                : 'Conectar instancia WhatsApp'}
            </DialogTitle>
            <DialogDescription>
              {connectModal.isWaitingConnection
                ? 'Utilize o codigo abaixo para parear sua instancia do WhatsApp.'
                : 'Informe o nome da instancia e o numero de telefone para conectar.'}
            </DialogDescription>
          </DialogHeader>

          {!connectModal.isWaitingConnection ? (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="instanceName" className="text-sm font-medium">
                    Nome da instancia
                  </Label>
                  <Input
                    id="instanceName"
                    placeholder="Digite o nome da instancia"
                    value={connectModal.instanceName}
                    onChange={(event) =>
                      setConnectModal((prev) => ({ ...prev, instanceName: event.target.value }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Numero de telefone
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Digite o numero de telefone (ex: 5511999999999)"
                    value={connectModal.phoneNumber}
                    onChange={(event) =>
                      setConnectModal((prev) => ({ ...prev, phoneNumber: event.target.value }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !actionLoading[`connect-${connectModal.instanceName}`]) {
                        onConnect();
                      }
                    }}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={onResetConnectModal}
                  disabled={actionLoading[`connect-${connectModal.instanceName}`]}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={onConnect}
                  disabled={
                    actionLoading[`connect-${connectModal.instanceName}`] ||
                    !connectModal.instanceName.trim() ||
                    !connectModal.phoneNumber.trim()
                  }
                  className="gap-2"
                >
                  {actionLoading[`connect-${connectModal.instanceName}`] ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Conectar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-6 py-6">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 shadow-lg">
                    <p className="font-mono text-5xl font-bold tracking-wider text-primary">
                      {connectModal.paircode}
                    </p>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Codigo de pareamento</p>
                    <p className="max-w-md text-xs text-muted-foreground">
                      Abra o WhatsApp no celular, va em <strong>Aparelhos conectados</strong> e
                      insira o codigo acima.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <div className="flex-1 text-center">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Aguardando conexao...
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Verificando status a cada 2 segundos
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={onResetConnectModal} className="gap-2">
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editNameModal.open}
        onOpenChange={(open) => {
          if (!open) onResetEditNameModal();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Atualizar nome da instancia
            </DialogTitle>
            <DialogDescription>
              Digite o novo nome para a instancia. O nome atual e{' '}
              <strong>{editNameModal.currentName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Novo nome
              </Label>
              <Input
                id="name"
                placeholder="Digite o novo nome da instancia"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onUpdateName();
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onResetEditNameModal}
              disabled={actionLoading[`update-${editNameModal.instanceId}`]}
            >
              Cancelar
            </Button>
            <Button
              onClick={onUpdateName}
              disabled={actionLoading[`update-${editNameModal.instanceId}`] || !newName.trim()}
              className="gap-2"
            >
              {actionLoading[`update-${editNameModal.instanceId}`] ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Atualizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
