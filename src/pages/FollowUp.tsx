import { FollowUpClientsSection } from '@/components/followup/FollowUpClientsSection';
import { FollowUpConfigSection } from '@/components/followup/FollowUpConfigSection';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useFollowUpManagement } from '@/hooks/useFollowUpManagement';

export default function FollowUp() {
  const {
    clientes,
    editConfig,
    error,
    handleSaveConfig,
    loadingClientes,
    loadingConfig,
    savingConfig,
    setEditConfig,
  } = useFollowUpManagement();

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Follow Up</h1>
          <p className="mt-1 text-muted-foreground">
            Configure os periodos e acompanhe seus clientes
          </p>
        </div>

        <FollowUpConfigSection
          editConfig={editConfig}
          loadingConfig={loadingConfig}
          onSave={handleSaveConfig}
          savingConfig={savingConfig}
          setEditConfig={setEditConfig}
        />

        <FollowUpClientsSection
          clientes={clientes}
          error={error}
          loadingClientes={loadingClientes}
        />
      </div>
    </DashboardLayout>
  );
}
