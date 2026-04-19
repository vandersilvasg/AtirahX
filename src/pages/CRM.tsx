import { CrmHeader } from '@/components/crm/CrmHeader';
import { CrmKanbanBoard } from '@/components/crm/CrmKanbanBoard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useCrmJourney } from '@/hooks/useCrmJourney';
import { Loader2 } from 'lucide-react';

export default function CRM() {
  const {
    prePatients,
    prePatientsByStage,
    stageMetrics,
    hotLeadsCount,
    draggingPrePatientId,
    handleDragEnd,
    handleDragOverStage,
    handleDragStart,
    handleDropOnStage,
    loading,
    pageError,
    updatingPrePatientId,
  } = useCrmJourney();

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="space-y-6 p-8">
        <CrmHeader
          appointmentsCount={prePatients.length}
          hotLeadsCount={hotLeadsCount}
          totalPipelineValue={prePatients.reduce((sum, item) => sum + Number(item.estimated_value || 0), 0)}
        />

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando jornada...</span>
            </CardContent>
          </Card>
        ) : pageError ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-sm text-destructive">
              Erro ao carregar dados do CRM: {pageError}
            </CardContent>
          </Card>
        ) : (
          <CrmKanbanBoard
            prePatientsByStage={prePatientsByStage}
            stageMetrics={stageMetrics}
            draggingPrePatientId={draggingPrePatientId}
            handleDragEnd={handleDragEnd}
            handleDragOverStage={handleDragOverStage}
            handleDragStart={handleDragStart}
            handleDropOnStage={handleDropOnStage}
            updatingPrePatientId={updatingPrePatientId}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
