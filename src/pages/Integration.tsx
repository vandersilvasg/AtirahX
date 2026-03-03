import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Plug, User, Calendar, Clock, Phone, Play, Power, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { webhookRequest } from '@/lib/webhookClient';

interface InstanceStatus {
  connected?: boolean;
  jid?: string;
  loggedIn?: boolean;
}

interface Instance {
  id?: string;
  status?: string | InstanceStatus;
  name?: string;
  profileName?: string;
  profilePicUrl?: string;
  owner?: string;
  created?: string;
  currentTime?: string;
  [key: string]: unknown;
}

type InstancesListResponse = {
  instances?: Instance[];
  data?: Instance[] | Instance;
} & Instance;

type ConnectInstanceResponse = {
  instance?: {
    paircode?: string;
  };
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeInstance = (value: unknown): Instance => {
  if (!isObjectRecord(value)) return {};
  const nestedInstance = isObjectRecord(value.instance) ? value.instance : {};

  return {
    id: (value.id as string) || (value.instanceId as string) || (nestedInstance.instanceId as string),
    name: (value.name as string) || (value.instanceName as string) || (nestedInstance.instanceName as string) || 'N/A',
    profileName:
      (value.profileName as string) ||
      (nestedInstance.profileName as string) ||
      (value.systemName as string) ||
      'Sem nome',
    profilePicUrl:
      (value.profilePicUrl as string) ||
      (nestedInstance.profilePicUrl as string) ||
      (value.profilePictureUrl as string),
    status: (value.status as string | InstanceStatus) || (nestedInstance.status as string | InstanceStatus) || (value.connectionStatus as string),
    owner: (value.owner as string) || (nestedInstance.owner as string) || (value.number as string),
    created: (value.created as string) || (nestedInstance.created as string) || (value.createdAt as string),
    currentTime: (value.currentTime as string) || (value.updatedAt as string) || (value.lastSeen as string),
    ...value,
  };
};

// Helper para extrair status como string
const getStatusString = (status: string | InstanceStatus | undefined): string => {
  if (!status) return 'unknown';
  if (typeof status === 'string') return status;
  // Se for objeto, verifica se estÃ¡ conectado
  if (typeof status === 'object') {
    if (status.connected || status.loggedIn) return 'connected';
    return 'disconnected';
  }
  return 'unknown';
};

// Helper para verificar se estÃ¡ conectado
const isConnected = (status: string | InstanceStatus | undefined): boolean => {
  if (!status) return false;
  if (typeof status === 'string') return status === 'connected';
  if (typeof status === 'object') return !!(status.connected || status.loggedIn);
  return false;
};

export default function Integration() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [editNameModal, setEditNameModal] = useState<{ open: boolean; instanceId: string; currentName: string }>({
    open: false,
    instanceId: '',
    currentName: '',
  });
  const [newName, setNewName] = useState('');
  const [connectModal, setConnectModal] = useState<{ 
    open: boolean; 
    instanceName: string; 
    phoneNumber: string;
    paircode: string;
    isWaitingConnection: boolean;
  }>({
    open: false,
    instanceName: '',
    phoneNumber: '',
    paircode: '',
    isWaitingConnection: false,
  });
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const fetchInstances = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await webhookRequest<unknown>('/listar-instancias', {
        method: 'POST',
        body: {},
      });
      
      console.log('[Integration] Dados brutos recebidos:', JSON.stringify(data, null, 2));
      
      // Normaliza os dados para o formato esperado
      let instancesList: Instance[] = [];
      
      if (Array.isArray(data)) {
        instancesList = data.map(normalizeInstance);
      } else if (isObjectRecord(data) && Array.isArray((data as InstancesListResponse).instances)) {
        instancesList = ((data as InstancesListResponse).instances ?? []).map(normalizeInstance);
      } else if (isObjectRecord(data) && (data as InstancesListResponse).data) {
        const rawData = (data as InstancesListResponse).data;
        instancesList = (Array.isArray(rawData) ? rawData : [rawData]).map(normalizeInstance);
      } else {
        instancesList = [normalizeInstance(data)];
      }
      console.log('[Integration] InstÃ¢ncias normalizadas:', instancesList);
      setInstances(instancesList);
      
      toast.success('InstÃ¢ncias carregadas com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro ao carregar instÃ¢ncias: ${errorMessage}`);
      console.error('Erro ao buscar instÃ¢ncias:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConnectModal = (instanceName: string) => {
    setConnectModal({ 
      open: true, 
      instanceName, 
      phoneNumber: '',
      paircode: '',
      isWaitingConnection: false,
    });
  };

  const checkConnectionStatus = async (instanceName: string) => {
    try {
      console.log('ðŸ” Verificando status da instÃ¢ncia:', instanceName);
      
      const data = await webhookRequest<unknown>('/listar-instancias', {
        method: 'POST',
        body: {},
      });
      console.log('ðŸ“¦ Dados recebidos:', data);
      console.log('ðŸ“‹ Tipo dos dados:', Array.isArray(data) ? 'Array' : 'Objeto');
      
      let foundItem: Instance | null = null;
      
      // Procura a instÃ¢ncia - pode ser array [{...}] ou objeto direto {...}
      if (Array.isArray(data)) {
        console.log('ðŸ”Ž Buscando instÃ¢ncia no ARRAY com nome:', instanceName);
        foundItem = data.map(normalizeInstance).find((item) => {
          console.log('  - Verificando item:', item.name, '===', instanceName, '?', item.name === instanceName);
          return item.name === instanceName;
        }) ?? null;
      } else if (isObjectRecord(data)) {
        console.log('ðŸ”Ž Verificando OBJETO direto com nome:', data.name);
        // Se for um objeto direto, verifica se o nome bate
        if (data.name === instanceName) {
          foundItem = normalizeInstance(data);
          console.log('âœ… Nome bate!');
        } else {
          console.log('âŒ Nome nÃ£o bate:', data.name, '!==', instanceName);
        }
      }
      
      console.log('âœ… InstÃ¢ncia encontrada:', foundItem);
      
      // Verifica se a instÃ¢ncia estÃ¡ conectada
      if (foundItem) {
        console.log('ðŸ“Š Status atual:', foundItem.status);
        
        if (isConnected(foundItem.status)) {
          console.log('ðŸŽ‰ Status CONNECTED detectado! Fechando modal...');
          
          // Parar polling
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          
          // Mostrar sucesso e fechar modal
          toast.success('âœ… InstÃ¢ncia conectada com sucesso!');
          setConnectModal({ 
            open: false, 
            instanceName: '', 
            phoneNumber: '',
            paircode: '',
            isWaitingConnection: false,
          });
          
          // Atualizar lista
          await fetchInstances();
          
          return true;
        } else {
          console.log('â³ Status ainda Ã©:', foundItem.status, '- Aguardando...');
        }
      } else {
        console.log('âŒ InstÃ¢ncia nÃ£o encontrada');
      }
      
      return false;
    } catch (err) {
      console.error('Erro ao verificar status:', err);
      return false;
    }
  };

  const handleConnect = async () => {
    if (!connectModal.instanceName.trim()) {
      toast.error('Por favor, insira o nome da instÃ¢ncia');
      return;
    }

    if (!connectModal.phoneNumber.trim()) {
      toast.error('Por favor, insira o nÃºmero de telefone');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`connect-${connectModal.instanceName}`]: true }));
    
    try {
      const data = await webhookRequest<ConnectInstanceResponse[] | ConnectInstanceResponse>('/conectar-instancia', {
        method: 'POST',
        body: {
          name: connectModal.instanceName.trim(),
          phoneNumber: connectModal.phoneNumber.trim(),
        },
      });
      
      // Extrair paircode da resposta do endpoint /conectar-instancia
      // Estrutura: [{instance: {paircode: "5YE9-GA45"}}]
      let paircode = '';
      if (Array.isArray(data) && data.length > 0) {
        paircode = data[0]?.instance?.paircode || '';
      } else if (data.instance?.paircode) {
        paircode = data.instance.paircode || '';
      }
      
      if (paircode) {
        // Atualizar modal com paircode e estado de aguardando
        setConnectModal(prev => ({ 
          ...prev, 
          paircode,
          isWaitingConnection: true,
        }));
        
        toast.success('CÃ³digo de pareamento gerado! Aguardando conexÃ£o...');
        
        // Iniciar polling a cada 2 segundos
        const interval = setInterval(() => {
          checkConnectionStatus(connectModal.instanceName);
        }, 2000);
        
        setPollingInterval(interval);
      } else {
        toast.error('NÃ£o foi possÃ­vel obter o cÃ³digo de pareamento');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao conectar: ${errorMessage}`);
      console.error('Erro ao conectar instÃ¢ncia:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`connect-${connectModal.instanceName}`]: false }));
    }
  };

  const handleDisconnect = async (instanceName: string) => {
    setActionLoading(prev => ({ ...prev, [`disconnect-${instanceName}`]: true }));
    
    try {
      await webhookRequest('/desconectar-instancias', {
        method: 'POST',
        body: { name: instanceName },
      });
      toast.success('InstÃ¢ncia desconectada com sucesso!');
      await fetchInstances(); // Atualiza a lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao desconectar: ${errorMessage}`);
      console.error('Erro ao desconectar instÃ¢ncia:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`disconnect-${instanceName}`]: false }));
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error('Por favor, insira um nome vÃ¡lido');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`update-${editNameModal.instanceId}`]: true }));
    
    try {
      await webhookRequest('/atualizar-nome-instancia', {
        method: 'POST',
        body: {
          instanceId: editNameModal.instanceId,
          currentName: editNameModal.currentName,
          newName: newName.trim(),
        },
      });
      toast.success('Nome da instÃ¢ncia atualizado com sucesso!');
      setEditNameModal({ open: false, instanceId: '', currentName: '' });
      setNewName('');
      await fetchInstances(); // Atualiza a lista
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar nome: ${errorMessage}`);
      console.error('Erro ao atualizar nome:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`update-${editNameModal.instanceId}`]: false }));
    }
  };

  const openEditNameModal = (instanceId: string, currentName: string) => {
    setEditNameModal({ open: true, instanceId, currentName });
    setNewName(currentName);
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  // Limpar polling quando o modal fechar ou componente desmontar
  useEffect(() => {
    if (!connectModal.open && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [connectModal.open, pollingInterval]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 border border-primary/20">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Plug className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  IntegraÃ§Ã£o WhatsApp
                </h1>
              </div>
              <p className="text-muted-foreground ml-14">
                Gerencie e monitore suas instÃ¢ncias do WhatsApp conectadas
              </p>
            </div>
            <Button 
              onClick={fetchInstances} 
              disabled={loading}
              size="lg"
              className="gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Atualizar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-2 border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 p-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-lg text-destructive">Erro ao carregar dados</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button 
                    onClick={fetchInstances} 
                    variant="destructive" 
                    size="sm"
                    className="mt-3 gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && instances.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping">
                    <Plug className="w-12 h-12 text-primary/20" />
                  </div>
                  <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Carregando instÃ¢ncias...</p>
                  <p className="text-sm text-muted-foreground">Aguarde enquanto buscamos os dados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instances Grid */}
        {!loading && instances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance, index) => (
              <Card 
                key={instance.id || index} 
                className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30 hover:-translate-y-1"
              >
                {/* Gradiente de fundo decorativo */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="relative space-y-4 pb-4">
                  {/* Badge de Status no canto */}
                  {instance.status && (
                    <div className="absolute top-4 right-4">
                      <Badge 
                        variant={isConnected(instance.status) ? 'default' : 'secondary'}
                        className={`
                          shrink-0 px-3 py-1 shadow-md
                          ${isConnected(instance.status) ? 'bg-green-500 hover:bg-green-600' : ''}
                        `}
                      >
                        {isConnected(instance.status) && (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        {getStatusString(instance.status)}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Avatar e Info Principal */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="relative">
                      <Avatar className="w-16 h-16 border-4 border-primary/20 shadow-lg ring-2 ring-background">
                        <AvatarImage src={instance.profilePicUrl} alt={instance.profileName || instance.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                          <User className="w-8 h-8 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      {isConnected(instance.status) && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold truncate">
                        {instance.name || 'N/A'}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium truncate">
                        {instance.profileName || 'Sem nome'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-3">
                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
                  
                  {/* Owner */}
                  {instance.owner && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ProprietÃ¡rio</p>
                        <p className="text-sm font-semibold text-foreground">{instance.owner}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* CriaÃ§Ã£o */}
                  {instance.created && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Calendar className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Criado em</p>
                        <p className="text-sm font-semibold text-foreground">{formatDate(instance.created)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Ãšltima AtualizaÃ§Ã£o */}
                  {instance.currentTime && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Clock className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ãšltima atualizaÃ§Ã£o</p>
                        <p className="text-sm font-semibold text-foreground">{formatDate(instance.currentTime)}</p>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4" />

                  {/* BotÃµes de AÃ§Ã£o */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* BotÃ£o Conectar */}
                      <Button
                        variant={isConnected(instance.status) ? 'secondary' : 'default'}
                        size="sm"
                        className="w-full gap-2"
                        disabled={isConnected(instance.status) || actionLoading[`connect-${instance.name}`]}
                        onClick={() => instance.name && openConnectModal(instance.name)}
                      >
                        {actionLoading[`connect-${instance.name}`] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Conectar
                      </Button>

                      {/* BotÃ£o Desconectar */}
                      <Button
                        variant={!isConnected(instance.status) ? 'secondary' : 'destructive'}
                        size="sm"
                        className="w-full gap-2"
                        disabled={!isConnected(instance.status) || actionLoading[`disconnect-${instance.name}`]}
                        onClick={() => instance.name && handleDisconnect(instance.name)}
                      >
                        {actionLoading[`disconnect-${instance.name}`] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                        Desconectar
                      </Button>
                    </div>

                    {/* BotÃ£o Atualizar Nome */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => instance.id && openEditNameModal(instance.id, instance.name || '')}
                    >
                      <Edit className="w-4 h-4" />
                      Atualizar nome da InstÃ¢ncia
                    </Button>
                  </div>
                </CardContent>
                
                {/* Borda animada no hover */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && instances.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="p-6 rounded-full bg-muted/50">
                  <Plug className="w-16 h-16 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-bold">Nenhuma instÃ¢ncia encontrada</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    NÃ£o hÃ¡ instÃ¢ncias do WhatsApp disponÃ­veis no momento. Tente atualizar ou verifique sua conexÃ£o.
                  </p>
                </div>
                <Button 
                  onClick={fetchInstances} 
                  variant="outline" 
                  size="lg"
                  className="mt-4 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para conectar instÃ¢ncia */}
      <Dialog open={connectModal.open} onOpenChange={(open) => {
        if (!open) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setConnectModal({ 
            open: false, 
            instanceName: '', 
            phoneNumber: '',
            paircode: '',
            isWaitingConnection: false,
          });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {connectModal.isWaitingConnection ? 'Aguardando ConexÃ£o' : 'Conectar InstÃ¢ncia WhatsApp'}
            </DialogTitle>
            <DialogDescription>
              {connectModal.isWaitingConnection 
                ? 'Utilize o cÃ³digo abaixo para parear sua instÃ¢ncia do WhatsApp' 
                : 'Informe o nome da instÃ¢ncia e o nÃºmero de telefone para conectar.'}
            </DialogDescription>
          </DialogHeader>
          
          {!connectModal.isWaitingConnection ? (
            // FormulÃ¡rio inicial
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="instanceName" className="text-sm font-medium">
                    Nome da InstÃ¢ncia
                  </Label>
                  <Input
                    id="instanceName"
                    placeholder="Digite o nome da instÃ¢ncia"
                    value={connectModal.instanceName}
                    onChange={(e) => setConnectModal(prev => ({ ...prev, instanceName: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    NÃºmero de Telefone
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Digite o nÃºmero de telefone (ex: 5511999999999)"
                    value={connectModal.phoneNumber}
                    onChange={(e) => setConnectModal(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !actionLoading[`connect-${connectModal.instanceName}`]) {
                        handleConnect();
                      }
                    }}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConnectModal({ 
                      open: false, 
                      instanceName: '', 
                      phoneNumber: '',
                      paircode: '',
                      isWaitingConnection: false,
                    });
                  }}
                  disabled={actionLoading[`connect-${connectModal.instanceName}`]}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={
                    actionLoading[`connect-${connectModal.instanceName}`] || 
                    !connectModal.instanceName.trim() || 
                    !connectModal.phoneNumber.trim()
                  }
                  className="gap-2"
                >
                  {actionLoading[`connect-${connectModal.instanceName}`] ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Conectar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Tela de aguardando com paircode
            <>
              <div className="py-6 space-y-6">
                {/* CÃ³digo de Pareamento */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 shadow-lg">
                    <p className="text-5xl font-bold tracking-wider text-primary font-mono">
                      {connectModal.paircode}
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      CÃ³digo de Pareamento
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Abra o WhatsApp no seu celular, vÃ¡ em <strong>Aparelhos conectados</strong> e insira o cÃ³digo acima
                    </p>
                  </div>
                </div>

                {/* Indicador de aguardando */}
                <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <div className="flex-1 text-center">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Aguardando conexÃ£o...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verificando status a cada 2 segundos
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (pollingInterval) {
                      clearInterval(pollingInterval);
                      setPollingInterval(null);
                    }
                    setConnectModal({ 
                      open: false, 
                      instanceName: '', 
                      phoneNumber: '',
                      paircode: '',
                      isWaitingConnection: false,
                    });
                  }}
                  className="gap-2"
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar nome da instÃ¢ncia */}
      <Dialog open={editNameModal.open} onOpenChange={(open) => {
        if (!open) {
          setEditNameModal({ open: false, instanceId: '', currentName: '' });
          setNewName('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Atualizar Nome da InstÃ¢ncia
            </DialogTitle>
            <DialogDescription>
              Digite o novo nome para a instÃ¢ncia. O nome atual Ã©: <strong>{editNameModal.currentName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Novo nome
              </Label>
              <Input
                id="name"
                placeholder="Digite o novo nome da instÃ¢ncia"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateName();
                  }
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditNameModal({ open: false, instanceId: '', currentName: '' });
                setNewName('');
              }}
              disabled={actionLoading[`update-${editNameModal.instanceId}`]}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateName}
              disabled={actionLoading[`update-${editNameModal.instanceId}`] || !newName.trim()}
              className="gap-2"
            >
              {actionLoading[`update-${editNameModal.instanceId}`] ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Atualizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

