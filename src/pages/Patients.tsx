import { Suspense, lazy } from 'react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PatientsTable } from '@/components/patients/PatientsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePatientsManagement } from '@/hooks/usePatientsManagement';
import { Plus, Search, UserPlus } from 'lucide-react';

const PatientDetailModal = lazy(() =>
  import('@/components/patients/PatientDetailModal').then((module) => ({
    default: module.PatientDetailModal,
  }))
);

const PatientsCreateDialog = lazy(() =>
  import('@/components/patients/PatientsCreateDialog').then((module) => ({
    default: module.PatientsCreateDialog,
  }))
);

export default function Patients() {
  const {
    error,
    filteredPatients,
    formData,
    handleCreatePatient,
    isCreateDialogOpen,
    isCreating,
    loading,
    searchTerm,
    selectedPatientId,
    setFormData,
    setIsCreateDialogOpen,
    setSearchTerm,
    setSelectedPatientId,
  } = usePatientsManagement();

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pacientes CRM</h1>
            <p className="mt-1 text-muted-foreground">Sistema de gestao de pacientes</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        <MagicBentoCard contentClassName="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </MagicBentoCard>

        <MagicBentoCard contentClassName="p-6">
          <PatientsTable
            error={error}
            loading={loading}
            onSelectPatient={setSelectedPatientId}
            patients={filteredPatients}
          />

          {!loading && filteredPatients.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <UserPlus className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>
                {searchTerm
                  ? 'Nenhum paciente encontrado com esse criterio'
                  : 'Nenhum paciente cadastrado ainda'}
              </p>
            </div>
          )}
        </MagicBentoCard>
      </div>

      <Suspense fallback={null}>
        {isCreateDialogOpen && (
          <PatientsCreateDialog
            formData={formData}
            isCreating={isCreating}
            onOpenChange={setIsCreateDialogOpen}
            onSubmit={handleCreatePatient}
            open={isCreateDialogOpen}
            setFormData={setFormData}
          />
        )}

        {!!selectedPatientId && (
          <PatientDetailModal
            patientId={selectedPatientId}
            open={!!selectedPatientId}
            onOpenChange={(open) => {
              if (!open) setSelectedPatientId(null);
            }}
          />
        )}
      </Suspense>
    </DashboardLayout>
  );
}
