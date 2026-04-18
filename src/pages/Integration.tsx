import { IntegrationDialogs } from '@/components/integration/IntegrationDialogs';
import {
  IntegrationEmptyState,
  IntegrationErrorState,
  IntegrationLoadingState,
} from '@/components/integration/IntegrationFeedback';
import { IntegrationHeader } from '@/components/integration/IntegrationHeader';
import { IntegrationInstanceCard } from '@/components/integration/IntegrationInstanceCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';

function formatDate(dateString: string) {
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
}

export default function Integration() {
  const {
    instances,
    loading,
    error,
    actionLoading,
    editNameModal,
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
  } = useWhatsAppIntegration();

  const refreshInstances = () => void fetchInstances({ showSuccessToast: true });

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        <IntegrationHeader loading={loading} onRefresh={refreshInstances} />

        {error && <IntegrationErrorState error={error} onRetry={refreshInstances} />}

        {loading && instances.length === 0 && <IntegrationLoadingState />}

        {!loading && instances.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instances.map((instance, index) => (
              <IntegrationInstanceCard
                key={instance.id || index}
                actionLoading={actionLoading}
                formatDate={formatDate}
                instance={instance}
                onConnect={openConnectModal}
                onDisconnect={(instanceName) => void handleDisconnect(instanceName)}
                onEditName={openEditNameModal}
              />
            ))}
          </div>
        )}

        {!loading && !error && instances.length === 0 && (
          <IntegrationEmptyState onRetry={refreshInstances} />
        )}
      </div>

      <IntegrationDialogs
        actionLoading={actionLoading}
        connectModal={connectModal}
        editNameModal={editNameModal}
        newName={newName}
        onConnect={() => void handleConnect()}
        onResetConnectModal={resetConnectModal}
        onResetEditNameModal={resetEditNameModal}
        onUpdateName={() => void handleUpdateName()}
        setConnectModal={setConnectModal}
        setNewName={setNewName}
      />
    </DashboardLayout>
  );
}
