import { DoctorScheduleGrid } from '@/components/doctors/DoctorScheduleGrid';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useDoctorScheduleManagement } from '@/hooks/useDoctorScheduleManagement';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function DoctorSchedule() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const {
    doctorName,
    handleSaveAll,
    handleScheduleChange,
    isSaving,
    loading,
    localSchedules,
    schedules,
  } = useDoctorScheduleManagement(doctorId);

  if (loading && schedules.length === 0) {
    return (
      <DashboardLayout requiredRoles={['owner']}>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurar Agenda</h1>
              <p className="mt-1 text-muted-foreground">{doctorName || 'Carregando...'}</p>
            </div>
          </div>
          <Button onClick={() => void handleSaveAll()} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Todos
              </>
            )}
          </Button>
        </div>

        <DoctorScheduleGrid
          localSchedules={localSchedules}
          onScheduleChange={handleScheduleChange}
        />
      </div>
    </DashboardLayout>
  );
}
