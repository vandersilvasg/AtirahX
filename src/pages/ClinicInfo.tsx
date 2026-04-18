import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ClinicAddressSection } from '@/components/clinic-info/ClinicAddressSection';
import { ClinicMedicalTeamSection } from '@/components/clinic-info/ClinicMedicalTeamSection';
import { ClinicPoliciesSection } from '@/components/clinic-info/ClinicPoliciesSection';
import { FileText, Loader2 } from 'lucide-react';
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

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Informacoes da Clinica</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie endereco, horario e politicas da clinica
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ClinicAddressSection
            clinicInfo={clinicInfo}
            loading={loading}
            onChange={handleChange}
          />
          <ClinicPoliciesSection
            clinicInfo={clinicInfo}
            loading={loading}
            onChange={handleChange}
          />
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
