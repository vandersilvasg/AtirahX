import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  getConnectPaircode,
  getWhatsAppIntegrationErrorMessage,
  INITIAL_CONNECT_MODAL,
  INITIAL_EDIT_MODAL,
  isConnected,
  isObjectRecord,
  normalizeInstance,
  normalizeInstancesResponse,
  type ConnectInstanceResponse,
  type ConnectModalState,
  type EditNameModalState,
  type Instance,
} from '@/lib/whatsAppIntegration';
import { webhookRequest } from '@/lib/webhookClient';

export type { Instance } from '@/lib/whatsAppIntegration';
export { getStatusString, isConnected } from '@/lib/whatsAppIntegration';

export function useWhatsAppIntegration() {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);

  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [editNameModal, setEditNameModal] = useState<EditNameModalState>(INITIAL_EDIT_MODAL);
  const [newName, setNewName] = useState('');
  const [connectModal, setConnectModal] = useState<ConnectModalState>(INITIAL_CONNECT_MODAL);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingAttemptsRef.current = 0;
    setPollingInterval(null);
  };

  const resetConnectModal = () => {
    stopPolling();
    setConnectModal(INITIAL_CONNECT_MODAL);
  };

  const resetEditNameModal = () => {
    setEditNameModal(INITIAL_EDIT_MODAL);
    setNewName('');
  };

  const fetchInstances = async (options?: { showSuccessToast?: boolean }) => {
    const showSuccessToast = options?.showSuccessToast ?? false;
    setLoading(true);
    setError(null);

    try {
      const data = await webhookRequest<unknown>('/listar-instancias', {
        method: 'POST',
        body: {},
      });

      setInstances(normalizeInstancesResponse(data));

      if (showSuccessToast) {
        toast.success('Instancias carregadas com sucesso!');
      }
    } catch (err) {
      const errorMessage = getWhatsAppIntegrationErrorMessage(err);
      setError(errorMessage);
      toast.error(`Erro ao carregar instancias: ${errorMessage}`);
      console.error('Erro ao buscar instancias:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConnectModal = (instanceName: string) => {
    setConnectModal({
      ...INITIAL_CONNECT_MODAL,
      open: true,
      instanceName,
    });
  };

  const checkConnectionStatus = async (instanceName: string) => {
    try {
      const data = await webhookRequest<unknown>('/listar-instancias', {
        method: 'POST',
        body: {},
      });

      let foundItem: Instance | null = null;
      const normalizedInstances = normalizeInstancesResponse(data);

      if (normalizedInstances.length > 0) {
        foundItem = normalizedInstances.find((item) => item.name === instanceName) ?? null;
      } else if (isObjectRecord(data) && data.name === instanceName) {
        foundItem = normalizeInstance(data);
      }

      if (foundItem && isConnected(foundItem.status)) {
        stopPolling();
        toast.success('Instancia conectada com sucesso!');
        setConnectModal(INITIAL_CONNECT_MODAL);
        await fetchInstances();
        return true;
      }

      return false;
    } catch (err) {
      console.error('Erro ao verificar status:', err);
      return false;
    }
  };

  const handleConnect = async () => {
    if (!connectModal.instanceName.trim()) {
      toast.error('Por favor, insira o nome da instancia');
      return;
    }

    if (!connectModal.phoneNumber.trim()) {
      toast.error('Por favor, insira o numero de telefone');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`connect-${connectModal.instanceName}`]: true }));

    try {
      const data = await webhookRequest<ConnectInstanceResponse[] | ConnectInstanceResponse>('/conectar-instancia', {
        method: 'POST',
        body: {
          name: connectModal.instanceName.trim(),
          phoneNumber: connectModal.phoneNumber.trim(),
        },
      });

      const paircode = getConnectPaircode(data);

      if (!paircode) {
        toast.error('Nao foi possivel obter o codigo de pareamento');
        return;
      }

      setConnectModal((prev) => ({
        ...prev,
        paircode,
        isWaitingConnection: true,
      }));

      toast.success('Codigo de pareamento gerado! Aguardando conexao...');

      stopPolling();
      const instanceName = connectModal.instanceName.trim();
      const interval = setInterval(async () => {
        pollingAttemptsRef.current += 1;

        const connected = await checkConnectionStatus(instanceName);
        if (connected) {
          return;
        }

        if (pollingAttemptsRef.current >= 30) {
          stopPolling();
          setConnectModal((prev) => ({ ...prev, isWaitingConnection: false }));
          toast.error('Tempo limite atingido ao aguardar conexao da instancia.');
        }
      }, 2000);

      pollingRef.current = interval;
      setPollingInterval(interval);
    } catch (err) {
      const errorMessage = getWhatsAppIntegrationErrorMessage(err);
      toast.error(`Erro ao conectar: ${errorMessage}`);
      console.error('Erro ao conectar instancia:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`connect-${connectModal.instanceName}`]: false }));
    }
  };

  const handleDisconnect = async (instanceName: string) => {
    setActionLoading((prev) => ({ ...prev, [`disconnect-${instanceName}`]: true }));

    try {
      await webhookRequest('/desconectar-instancias', {
        method: 'POST',
        body: { name: instanceName },
      });
      toast.success('Instancia desconectada com sucesso!');
      await fetchInstances();
    } catch (err) {
      const errorMessage = getWhatsAppIntegrationErrorMessage(err);
      toast.error(`Erro ao desconectar: ${errorMessage}`);
      console.error('Erro ao desconectar instancia:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`disconnect-${instanceName}`]: false }));
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.error('Por favor, insira um nome valido');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`update-${editNameModal.instanceId}`]: true }));

    try {
      await webhookRequest('/atualizar-nome-instancia', {
        method: 'POST',
        body: {
          instanceId: editNameModal.instanceId,
          currentName: editNameModal.currentName,
          newName: newName.trim(),
        },
      });
      toast.success('Nome da instancia atualizado com sucesso!');
      resetEditNameModal();
      await fetchInstances();
    } catch (err) {
      const errorMessage = getWhatsAppIntegrationErrorMessage(err);
      toast.error(`Erro ao atualizar nome: ${errorMessage}`);
      console.error('Erro ao atualizar nome:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`update-${editNameModal.instanceId}`]: false }));
    }
  };

  const openEditNameModal = (instanceId: string, currentName: string) => {
    setEditNameModal({ open: true, instanceId, currentName });
    setNewName(currentName);
  };

  useEffect(() => {
    void fetchInstances();
  }, []);

  useEffect(() => {
    if (!connectModal.open && pollingInterval) {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [connectModal.open, pollingInterval]);

  return {
    instances,
    loading,
    error,
    actionLoading,
    editNameModal,
    setEditNameModal,
    newName,
    setNewName,
    connectModal,
    setConnectModal,
    fetchInstances,
    openConnectModal,
    handleConnect,
    handleDisconnect,
    handleUpdateName,
    openEditNameModal,
    resetConnectModal,
    resetEditNameModal,
  } as const;
}
