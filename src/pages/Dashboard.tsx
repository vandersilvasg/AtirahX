import { lazy, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardCrmSummary } from '@/components/metrics/DashboardCrmSummary';
import { DashboardStatsGrid } from '@/components/metrics/DashboardStatsGrid';
import { InsuranceDonutCard } from '@/components/metrics/InsuranceDonutCard';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Activity, Calendar, Stethoscope, Users } from 'lucide-react';

const PeakHoursChartCard = lazy(() =>
  import('@/components/metrics/PeakHoursChartCard').then((module) => ({
    default: module.PeakHoursChartCard,
  }))
);
const WeekdayChartCard = lazy(() =>
  import('@/components/metrics/WeekdayChartCard').then((module) => ({
    default: module.WeekdayChartCard,
  }))
);
const DoctorPieChartCard = lazy(() =>
  import('@/components/metrics/DoctorPieChartCard').then((module) => ({
    default: module.DoctorPieChartCard,
  }))
);
const DiseaseTreemapCard = lazy(() =>
  import('@/components/metrics/DiseaseTreemapCard').then((module) => ({
    default: module.DiseaseTreemapCard,
  }))
);

export default function Dashboard() {
  const metrics = useDashboardMetrics();
  const metricValue = (value: number) => (metrics.loading ? '...' : String(value));
  const chartFallback = (
    <div className="min-h-[320px] animate-pulse rounded-3xl border bg-card/60" />
  );

  const stats = [
    {
      title: 'Consultas Hoje',
      value: String(metrics.consultasHoje),
      icon: Calendar,
      trend: metrics.calculateTrend(metrics.consultasMesAtual, metrics.consultasMesAnterior),
      description: 'vs. mes passado',
    },
    {
      title: 'Pacientes CRM',
      value: String(metrics.pacientesCRM),
      icon: Users,
      trend: metrics.calculateTrend(
        metrics.pacientesCRMMesAtual,
        metrics.pacientesCRMMesAnterior
      ),
      description: 'novos este mes',
    },
    {
      title: 'Pre Pacientes',
      value: String(metrics.prePatientes),
      icon: Activity,
      trend: '-',
      description: 'aguardando conversao',
    },
    {
      title: 'Equipe Medica',
      value: String(metrics.totalMedicos),
      icon: Stethoscope,
      trend: metrics.totalSecretarias > 0 ? `+${metrics.totalSecretarias} sec.` : '-',
      description: 'medicos ativos',
    },
  ];

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Metricas de Atendimento</h1>
          <p className="mt-1 text-muted-foreground">Visao geral do desempenho da clinica</p>
        </div>

        <DashboardStatsGrid loading={metrics.loading} stats={stats} />

        <DashboardCrmSummary metricValue={metricValue} metrics={metrics} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Suspense fallback={chartFallback}>
            <PeakHoursChartCard />
          </Suspense>
          <Suspense fallback={chartFallback}>
            <WeekdayChartCard />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Suspense fallback={chartFallback}>
            <DoctorPieChartCard />
          </Suspense>
          <InsuranceDonutCard />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Suspense fallback={chartFallback}>
            <DiseaseTreemapCard />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}
