import { Suspense, lazy } from 'react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PatientsTable } from '@/components/patients/PatientsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePatientsManagement } from '@/hooks/usePatientsManagement';
import { CalendarClock, Plus, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';

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
    activeSegment,
    error,
    filteredPatients,
    formData,
    handleCreatePatient,
    isCreateDialogOpen,
    isCreating,
    loading,
    patientInsights,
    searchTerm,
    selectedPatientId,
    setActiveSegment,
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
            <p className="mt-1 text-muted-foreground">
              Base ativa da clinica com historico, busca e acesso rapido ao detalhe do paciente.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        <MagicBentoCard contentClassName="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, telefone ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Triagem rapida da base para contato, agenda e entrada recente.
              </p>
              <ToggleGroup
                type="single"
                value={activeSegment}
                onValueChange={(value) => {
                  if (value) setActiveSegment(value as typeof activeSegment);
                }}
                className="flex flex-wrap justify-start md:justify-end"
              >
                <ToggleGroupItem value="all" aria-label="Mostrar toda a base">
                  Todos
                </ToggleGroupItem>
                <ToggleGroupItem value="reachable" aria-label="Mostrar pacientes com contato">
                  Com contato
                </ToggleGroupItem>
                <ToggleGroupItem value="scheduled" aria-label="Mostrar pacientes com agenda">
                  Com agenda
                </ToggleGroupItem>
                <ToggleGroupItem value="recent" aria-label="Mostrar pacientes recentes">
                  Recentes
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </MagicBentoCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MagicBentoCard contentClassName="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Base total</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {patientInsights.totalPatients}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {patientInsights.filteredPatients === patientInsights.totalPatients
                    ? 'Visao completa da base ativa no CRM.'
                    : `${patientInsights.filteredPatients} pacientes no filtro atual.`}
                </p>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
          </MagicBentoCard>

          <MagicBentoCard contentClassName="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Contato valido</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {patientInsights.reachablePatients}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pacientes com email ou telefone prontos para acao.
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
          </MagicBentoCard>

          <MagicBentoCard contentClassName="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Agenda futura</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {patientInsights.upcomingAppointments}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pacientes com proxima consulta ja registrada.
                </p>
              </div>
              <CalendarClock className="h-5 w-5 text-sky-500" />
            </div>
          </MagicBentoCard>

          <MagicBentoCard contentClassName="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Novos 30 dias</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {patientInsights.recentPatients}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ritmo recente de crescimento da base de pacientes.
                </p>
              </div>
              <UserPlus className="h-5 w-5 text-amber-500" />
            </div>
          </MagicBentoCard>
        </div>

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
                  : 'Voce ainda nao possui pacientes no CRM. Assim que a operacao comecar, eles aparecerao aqui.'}
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
