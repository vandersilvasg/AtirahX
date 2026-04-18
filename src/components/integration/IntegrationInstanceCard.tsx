import type { ComponentType } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStatusString, Instance, isConnected } from '@/hooks/useWhatsAppIntegration';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Loader2,
  Phone,
  Play,
  Power,
  User,
} from 'lucide-react';

type IntegrationInstanceCardProps = {
  actionLoading: Record<string, boolean>;
  formatDate: (dateString: string) => string;
  instance: Instance;
  onConnect: (instanceName: string) => void;
  onDisconnect: (instanceName: string) => void;
  onEditName: (instanceId: string, currentName: string) => void;
};

type InfoRowProps = {
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  label: string;
  value: string;
};

function InfoRow({ icon: Icon, iconClassName, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted">
      <div className="rounded-lg bg-background p-2">
        <Icon className={iconClassName} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function IntegrationInstanceCard({
  actionLoading,
  formatDate,
  instance,
  onConnect,
  onDisconnect,
  onEditName,
}: IntegrationInstanceCardProps) {
  const connected = isConnected(instance.status);
  const connectKey = `connect-${instance.name}`;
  const disconnectKey = `disconnect-${instance.name}`;

  return (
    <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="relative space-y-4 pb-4">
        {instance.status && (
          <div className="absolute right-4 top-4">
            <Badge
              variant={connected ? 'default' : 'secondary'}
              className={`shrink-0 px-3 py-1 shadow-md ${connected ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {connected && <CheckCircle2 className="mr-1 h-3 w-3" />}
              {getStatusString(instance.status)}
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2">
          <div className="relative">
            <Avatar className="h-16 w-16 border-4 border-primary/20 shadow-lg ring-2 ring-background">
              <AvatarImage src={instance.profilePicUrl} alt={instance.profileName || instance.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                <User className="h-8 w-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            {connected && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 animate-pulse rounded-full border-2 border-background bg-green-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-xl font-bold">{instance.name || 'N/A'}</CardTitle>
            <CardDescription className="truncate text-sm font-medium">
              {instance.profileName || 'Sem nome'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        <div className="mb-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {instance.owner && (
          <InfoRow
            icon={Phone}
            iconClassName="h-4 w-4 text-primary"
            label="Proprietario"
            value={instance.owner}
          />
        )}

        {instance.created && (
          <InfoRow
            icon={Calendar}
            iconClassName="h-4 w-4 text-blue-500"
            label="Criado em"
            value={formatDate(instance.created)}
          />
        )}

        {instance.currentTime && (
          <InfoRow
            icon={Clock}
            iconClassName="h-4 w-4 text-purple-500"
            label="Ultima atualizacao"
            value={formatDate(instance.currentTime)}
          />
        )}

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={connected ? 'secondary' : 'default'}
              size="sm"
              className="w-full gap-2"
              disabled={connected || actionLoading[connectKey]}
              onClick={() => instance.name && onConnect(instance.name)}
            >
              {actionLoading[connectKey] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Conectar
            </Button>

            <Button
              variant={!connected ? 'secondary' : 'destructive'}
              size="sm"
              className="w-full gap-2"
              disabled={!connected || actionLoading[disconnectKey]}
              onClick={() => instance.name && onDisconnect(instance.name)}
            >
              {actionLoading[disconnectKey] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              Desconectar
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => instance.id && onEditName(instance.id, instance.name || '')}
          >
            <Edit className="h-4 w-4" />
            Atualizar nome da instancia
          </Button>
        </div>
      </CardContent>

      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-20" />
    </Card>
  );
}
