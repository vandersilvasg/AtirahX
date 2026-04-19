import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClinicAddressSection } from '@/components/clinic-info/ClinicAddressSection';
import { ClinicMedicalTeamSection } from '@/components/clinic-info/ClinicMedicalTeamSection';
import { ClinicPoliciesSection } from '@/components/clinic-info/ClinicPoliciesSection';
import { FileText, Loader2, MapPinned, ShieldCheck, Stethoscope, TimerReset } from 'lucide-react';
import { useClinicInfoManagement } from '@/hooks/useClinicInfoManagement';

export default function ClinicInfo() {
  const {
    clinicInfo,
    doctorPrices,
    doctors,
    formatPrice,
    handleChange,
    handlePriceChange,
    handleSave,
    handleSavePrices,
    handleSaveTeam,
    loading,
    loadingDoctors,
    saving,
    selectedDoctorIds,
    selectedDoctors,
    toggleDoctor,
  } = useClinicInfoManagement();

  const configuredDoctorPrices = Object.values(doctorPrices).filter((price) => price > 0).length;
  const policyReadiness = [
    clinicInfo?.policy_scheduling,
    clinicInfo?.policy_rescheduling,
    clinicInfo?.policy_cancellation,
  ].filter(Boolean).length;
  const operationalCoverage = [clinicInfo?.address_line, clinicInfo?.opening_hours].filter(Boolean).length;
  const summaryCards = [
    {
      title: 'Equipe selecionada',
      value: selectedDoctors.length,
      description: 'Profissionais ativos para agenda, atendimento e receita prevista.',
      icon: Stethoscope,
    },
    {
      title: 'Precos configurados',
      value: configuredDoctorPrices,
      description: 'Medicos com valor de consulta pronto para dashboards e previsao.',
      icon: TimerReset,
    },
    {
      title: 'Base operacional',
      value: `${operationalCoverage}/2`,
      description: 'Endereco e horario comercial preenchidos.',
      icon: MapPinned,
    },
    {
      title: 'Politicas ativas',
      value: `${policyReadiness}/3`,
      description: 'Agendamento, remarcacao e cancelamento prontos para orientar a equipe.',
      icon: ShieldCheck,
    },
  ];

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Informacoes da Clinica</h1>
            <p className="mt-1 text-muted-foreground">
              Configure a base operacional que alimenta agenda, financeiro, automacoes e experiencia do paciente.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span>{card.title}</span>
                  <card.icon className="h-4 w-4 text-primary" />
                </CardDescription>
                <CardTitle className="text-2xl">{loading ? '...' : card.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">{card.description}</CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">O que esta tela alimenta</CardTitle>
            <CardDescription>Esta configuracao precisa sustentar toda a operacao, nao apenas cadastro.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Agenda usa equipe medica ativa, horarios e estrutura da clinica.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Financeiro depende dos precos de consulta para previsao e receita realizada.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Automacoes precisam de politicas claras para confirmar, remarcar e orientar.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Atendimentos e CRM ganham contexto quando a operacao esta bem configurada.
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ClinicAddressSection clinicInfo={clinicInfo} loading={loading} onChange={handleChange} />
          <ClinicPoliciesSection clinicInfo={clinicInfo} loading={loading} onChange={handleChange} />
        </div>

        <ClinicMedicalTeamSection
          doctorPrices={doctorPrices}
          doctors={doctors}
          formatPrice={formatPrice}
          loadingDoctors={loadingDoctors}
          onPriceChange={handlePriceChange}
          onSavePrices={handleSavePrices}
          onSaveTeam={handleSaveTeam}
          selectedDoctorIds={selectedDoctorIds}
          selectedDoctors={selectedDoctors}
          toggleDoctor={toggleDoctor}
        />
      </div>
    </DashboardLayout>
  );
}
