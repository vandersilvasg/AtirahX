import { Suspense, lazy, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AgendaToolbar } from '@/components/agenda/AgendaToolbar';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { ScheduleConfigSection } from '@/components/agenda/ScheduleConfigSection';
import { DayCalendar } from '@/components/calendar/DayCalendar';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { WeekCalendar } from '@/components/calendar/WeekCalendar';
import type { AgendaItem, Appointment } from '@/components/agenda/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAgendaExternalData } from '@/hooks/useAgendaExternalData';
import { useAgendaInteractions } from '@/hooks/useAgendaInteractions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

type AgendaData = unknown;

const AppointmentDetailsDialog = lazy(() =>
  import('@/components/agenda/AppointmentDialogs').then((module) => ({
    default: module.AppointmentDetailsDialog,
  }))
);

const AppointmentDeleteDialog = lazy(() =>
  import('@/components/agenda/AppointmentDialogs').then((module) => ({
    default: module.AppointmentDeleteDialog,
  }))
);

const CreateEventModal = lazy(() =>
  import('@/components/agenda/CreateEventModal').then((module) => ({
    default: module.CreateEventModal,
  }))
);

const EditEventModal = lazy(() =>
  import('@/components/agenda/EditEventModal').then((module) => ({
    default: module.EditEventModal,
  }))
);

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terca-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sabado' },
];

export default function Agenda() {
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [currentDayDate, setCurrentDayDate] = useState(new Date());
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<string>('todos');
  const [, setAgendaData] = useState<AgendaData | null>(null);
  const [loadingAgendas, setLoadingAgendas] = useState(false);
  const [loadingAgendaData, setLoadingAgendaData] = useState(false);
  const [externalAppointments, setExternalAppointments] = useState<Appointment[]>([]);
  const [doctorCalendarId, setDoctorCalendarId] = useState<string | null>(null);

  const { fetchAgendas, refreshCurrentAgenda } = useAgendaExternalData({
    currentDayDate,
    currentMonth,
    currentWeekDate,
    doctorCalendarId,
    selectedAgenda,
    setAgendaData,
    setAgendas,
    setDoctorCalendarId,
    setExternalAppointments,
    setLoadingAgendaData,
    setLoadingAgendas,
    userId: user?.id,
    userRole: user?.role,
    viewMode,
  });

  const {
    createEventDate,
    createEventStartTime,
    eventToDelete,
    eventToEdit,
    handleAppointmentClick,
    handleDayClick,
    handleDeleteEvent,
    handleDeleteEventClick,
    handleEditEvent,
    handleEventCreated,
    handleEventDeleted,
    handleEventMoved,
    handleEventUpdated,
    handleSaveSchedules,
    handleScheduleChange,
    isCreateEventModalOpen,
    isDeleting,
    isDialogOpen,
    isEditEventModalOpen,
    isSaving,
    localSchedules,
    selectedAppointment,
    setIsCreateEventModalOpen,
    setIsDialogOpen,
    setIsEditEventModalOpen,
    setShowDeleteDialog,
    showDeleteDialog,
  } = useAgendaInteractions({
    agendas,
    daysOfWeek: DAYS_OF_WEEK,
    externalAppointments,
    refreshCurrentAgenda,
    selectedAgenda,
    userId: user?.id,
    userRole: user?.role,
  });

  const displayedAppointments = externalAppointments;
  const consultasHoje = displayedAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.start);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  }).length;

  const renderAgendaView = () => (
    <div className="space-y-6">
      <AgendaToolbar
        agendas={agendas}
        loadingAgendas={loadingAgendas}
        onRefreshAgendas={fetchAgendas}
        onSelectAgenda={setSelectedAgenda}
        onViewModeChange={setViewMode}
        selectedAgenda={selectedAgenda}
        userRole={user?.role}
        viewMode={viewMode}
      />
      <MagicBentoCard contentClassName="min-h-[calc(100vh-20rem)] p-0">
        {!loadingAgendaData && (
          <>
            {viewMode === 'month' && (
              <MonthCalendar
                appointments={displayedAppointments}
                onDayClick={handleDayClick}
                onAppointmentClick={handleAppointmentClick}
                onEventMoved={handleEventMoved}
              />
            )}
            {viewMode === 'week' && (
              <WeekCalendar
                appointments={displayedAppointments}
                currentDate={currentWeekDate}
                onDateChange={setCurrentWeekDate}
                onDayClick={handleDayClick}
                onAppointmentClick={handleAppointmentClick}
                onEventMoved={handleEventMoved}
              />
            )}
            {viewMode === 'day' && (
              <DayCalendar
                appointments={displayedAppointments}
                currentDate={currentDayDate}
                onDateChange={setCurrentDayDate}
                onTimeSlotClick={handleDayClick}
                onAppointmentClick={handleAppointmentClick}
                onEventMoved={handleEventMoved}
              />
            )}
          </>
        )}
        {loadingAgendaData && (
          <div className="flex h-full min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-muted-foreground">Carregando eventos da agenda...</div>
            </div>
          </div>
        )}
      </MagicBentoCard>
    </div>
  );

  const renderScheduleConfig = () => (
    <ScheduleConfigSection
      daysOfWeek={DAYS_OF_WEEK}
      isSaving={isSaving}
      localSchedules={localSchedules}
      onSaveSchedules={handleSaveSchedules}
      onScheduleChange={handleScheduleChange}
    />
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda Inteligente</h1>
          <p className="mt-1 text-muted-foreground">
            Visualize ocupacao, acompanhe consultas do dia e sincronize agendas externas quando disponiveis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MagicBentoCard contentClassName="p-4">
            <p className="text-xs uppercase text-muted-foreground">Consultas hoje</p>
            <p className="mt-2 text-2xl font-semibold">{consultasHoje}</p>
          </MagicBentoCard>
          <MagicBentoCard contentClassName="p-4">
            <p className="text-xs uppercase text-muted-foreground">Eventos carregados</p>
            <p className="mt-2 text-2xl font-semibold">{displayedAppointments.length}</p>
          </MagicBentoCard>
          <MagicBentoCard contentClassName="p-4">
            <p className="text-xs uppercase text-muted-foreground">Agenda selecionada</p>
            <p className="mt-2 text-sm font-semibold">{selectedAgenda === 'todos' ? 'Todas' : selectedAgenda}</p>
          </MagicBentoCard>
          <MagicBentoCard contentClassName="p-4">
            <p className="text-xs uppercase text-muted-foreground">Sincronizacao</p>
            <p className="mt-2 text-sm font-semibold">
              {displayedAppointments.length > 0 ? 'Ativa' : 'Aguardando conexao externa'}
            </p>
          </MagicBentoCard>
        </div>

        {user?.role === 'doctor' ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Visao Geral</TabsTrigger>
              <TabsTrigger value="schedule">Configurar Horarios</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {renderAgendaView()}
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              {renderScheduleConfig()}
            </TabsContent>
          </Tabs>
        ) : (
          renderAgendaView()
        )}
      </div>

      <Suspense fallback={null}>
        {isDialogOpen && (
          <AppointmentDetailsDialog
            appointment={selectedAppointment}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onDeleteClick={handleDeleteEventClick}
            onEditClick={(appointment) => {
              handleEditEvent(appointment);
              setIsDialogOpen(false);
            }}
          />
        )}

        {isCreateEventModalOpen && (
          <CreateEventModal
            open={isCreateEventModalOpen}
            onOpenChange={setIsCreateEventModalOpen}
            initialDate={createEventDate}
            initialStartTime={createEventStartTime}
            calendarId={selectedAgenda !== 'todos' ? selectedAgenda : undefined}
            onEventCreated={handleEventCreated}
          />
        )}

        {isEditEventModalOpen && (
          <EditEventModal
            open={isEditEventModalOpen}
            onOpenChange={setIsEditEventModalOpen}
            appointment={eventToEdit}
            onEventUpdated={handleEventUpdated}
            onEventDeleted={handleEventDeleted}
          />
        )}

        {showDeleteDialog && (
          <AppointmentDeleteDialog
            appointment={eventToDelete}
            isDeleting={isDeleting}
            open={showDeleteDialog}
            onConfirm={handleDeleteEvent}
            onOpenChange={setShowDeleteDialog}
          />
        )}
      </Suspense>
    </DashboardLayout>
  );
}
