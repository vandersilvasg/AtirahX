import { MagicBentoCard } from '@/components/bento/MagicBento';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrePatientsDialog } from '@/components/patients/PrePatientsDialog';
import { PrePatientsTable } from '@/components/patients/PrePatientsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePrePatientsManagement } from '@/hooks/usePrePatientsManagement';
import { Flame, Plus, Search, Target, TrendingUp, UserCheck } from 'lucide-react';

export default function PrePatients() {
  const {
    activeSegment,
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
    prePatientInsights,
    searchTerm,
    setActiveSegment,
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, telefone, convenio, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Triagem comercial por calor, follow-up pendente e conversao.
              </p>
              <ToggleGroup
                type="single"
                value={activeSegment}
                onValueChange={(value) => {
                  if (value) setActiveSegment(value as typeof activeSegment);
                }}
                className="flex flex-wrap justify-start md:justify-end"
              >
                <ToggleGroupItem value="all" aria-label="Mostrar todos os leads">
                  Todos
                </ToggleGroupItem>
                <ToggleGroupItem value="hot" aria-label="Mostrar leads quentes">
                  Quentes
                </ToggleGroupItem>
                <ToggleGroupItem value="follow_up" aria-label="Mostrar leads com follow-up">
                  Follow-up
                </ToggleGroupItem>
                <ToggleGroupItem value="converted" aria-label="Mostrar leads convertidos">
                  Convertidos
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </MagicBentoCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MagicBentoCard contentClassName="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Base de leads</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {prePatientInsights.totalLeads}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {prePatientInsights.filteredLeads === prePatientInsights.totalLeads
                    ? 'Visao completa da fila comercial.'
                    : `${prePatientInsights.filteredLeads} leads no filtro atual.`}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </MagicBentoCard>

          <MagicBentoCard contentClassName="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Leads quentes</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {prePatientInsights.hotLeads}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Oportunidades com maior propensao de fechamento.
                </p>
              </div>
              <Flame className="h-5 w-5 text-rose-500" />
            </div>
          </MagicBentoCard>

          <MagicBentoCard contentClassName="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Follow-up ativo</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {prePatientInsights.followUpLeads}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Leads com proxima acao registrada e sem fechamento.
                </p>
              </div>
              <Target className="h-5 w-5 text-amber-500" />
            </div>
          </MagicBentoCard>

          <MagicBentoCard contentClassName="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Fechados</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {prePatientInsights.convertedLeads}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pipeline atual de{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  }).format(prePatientInsights.pipelineValue)}
                  .
                </p>
              </div>
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
          </MagicBentoCard>
        </div>

        <MagicBentoCard contentClassName="p-6">
          <PrePatientsTable
            error={error}
            loading={loading}
            onDelete={handleDelete}
            onEdit={openEdit}
            prePatients={filtered}
          />

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Target className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>
                {searchTerm
                  ? 'Nenhum lead encontrado com esse criterio.'
                  : 'Nao ha leads nesse segmento agora. Novas captacoes aparecerao aqui.'}
              </p>
            </div>
          )}
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
