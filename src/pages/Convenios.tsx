import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InsuranceCompaniesAccordion } from '@/components/convenios/InsuranceCompaniesAccordion';
import { InsuranceSearchBar } from '@/components/convenios/InsuranceSearchBar';
import { InsuranceStatsCards } from '@/components/convenios/InsuranceStatsCards';
import { Card, CardContent } from '@/components/ui/card';
import { useInsuranceManagement } from '@/hooks/useInsuranceManagement';
import {
  Building2,
  Loader2,
} from 'lucide-react';

export default function Convenios() {
  const {
    acceptedCompaniesCount,
    companies,
    filteredCompanies,
    getPlanTypeBadgeColor,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    togglePlanAcceptance,
    totalAcceptedPlans,
    user,
  } = useInsuranceManagement();

  if (loading) {
    return (
      <DashboardLayout requiredRoles={['secretary', 'doctor']}>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRoles={['secretary', 'doctor']}>
      <div className="space-y-6 p-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Gerenciamento de Convenios</h1>
          <p className="text-muted-foreground">
            {user?.role === 'doctor'
              ? 'Selecione os convenios e planos que voce aceita'
              : 'Visualize os convenios aceitos pelos medicos'}
          </p>
        </div>

        <InsuranceStatsCards
          acceptedCompaniesCount={acceptedCompaniesCount}
          companiesCount={companies.length}
          totalAcceptedPlans={totalAcceptedPlans}
        />

        <InsuranceSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <InsuranceCompaniesAccordion
          filteredCompanies={filteredCompanies}
          getPlanTypeBadgeColor={getPlanTypeBadgeColor}
          saving={saving}
          togglePlanAcceptance={togglePlanAcceptance}
          userRole={user?.role}
        />

        {filteredCompanies.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Nenhuma operadora encontrada</h3>
              <p className="text-muted-foreground">Tente ajustar os filtros de busca</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
