import { MagicBentoCard } from '@/components/bento/MagicBento';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrePatientsDialog } from '@/components/patients/PrePatientsDialog';
import { PrePatientsTable } from '@/components/patients/PrePatientsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePrePatientsManagement } from '@/hooks/usePrePatientsManagement';
import { Plus, Search } from 'lucide-react';

export default function PrePatients() {
  const {
    error,
    filtered,
    formData,
    handleCreate,
    handleDelete,
    handleUpdate,
    isCreateDialogOpen,
    isEditDialogOpen,
    isSaving,
    loading,
    openCreate,
    openEdit,
    searchTerm,
    setFormData,
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    setSearchTerm,
  } = usePrePatientsManagement();

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pre-pacientes</h1>
            <p className="mt-1 text-muted-foreground">
              Fila qualificada de leads antes da promocao para o CRM principal.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ao preencher o campo nome e salvar, o lead pode seguir automaticamente para o CRM.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pre Paciente
          </Button>
        </div>

        <MagicBentoCard contentClassName="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone, convenio, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </MagicBentoCard>

        <MagicBentoCard contentClassName="p-6">
          <PrePatientsTable
            error={error}
            loading={loading}
            onDelete={handleDelete}
            onEdit={openEdit}
            prePatients={filtered}
          />
        </MagicBentoCard>
      </div>

      <PrePatientsDialog
        description="Cadastre as informacoes do lead"
        formData={formData}
        isSaving={isSaving}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        open={isCreateDialogOpen}
        setFormData={setFormData}
        title="Novo Pre Paciente"
      />

      <PrePatientsDialog
        description="Atualize as informacoes do lead"
        formData={formData}
        isSaving={isSaving}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdate}
        open={isEditDialogOpen}
        setFormData={setFormData}
        title="Editar Pre Paciente"
      />
    </DashboardLayout>
  );
}
