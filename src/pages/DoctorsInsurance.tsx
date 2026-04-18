import { DoctorsInsuranceList } from '@/components/doctors/DoctorsInsuranceList';
import { DoctorsInsuranceSearch } from '@/components/doctors/DoctorsInsuranceSearch';
import { DoctorsInsuranceStats } from '@/components/doctors/DoctorsInsuranceStats';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDoctorsInsurance } from '@/hooks/useDoctorsInsurance';
import { Loader2 } from 'lucide-react';

export default function DoctorsInsurance() {
  const {
    averagePlans,
    filteredDoctors,
    hasAnyInsurance,
    loading,
    searchTerm,
    setSearchTerm,
    totalDoctors,
    totalWithInsurance,
  } = useDoctorsInsurance();

  if (loading) {
    return (
      <DashboardLayout requiredRoles={['owner', 'secretary']}>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medicos e Convenios</h1>
          <p className="text-muted-foreground">
            Visualizacao consolidada dos medicos com convenios cadastrados.
          </p>
        </div>

        <DoctorsInsuranceStats
          averagePlans={averagePlans}
          totalDoctors={totalDoctors}
          totalWithInsurance={totalWithInsurance}
        />

        <DoctorsInsuranceSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <DoctorsInsuranceList
          filteredDoctors={filteredDoctors}
          hasAnyInsurance={hasAnyInsurance}
        />
      </div>
    </DashboardLayout>
  );
}
