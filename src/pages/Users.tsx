import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersAddCalendarDialog } from '@/components/users/UsersAddCalendarDialog';
import { UsersCreateDialog } from '@/components/users/UsersCreateDialog';
import { UsersCalendarsDialog } from '@/components/users/UsersCalendarsDialog';
import { UsersDeleteDialog } from '@/components/users/UsersDeleteDialog';
import { UsersEditDialog } from '@/components/users/UsersEditDialog';
import { UsersGrid } from '@/components/users/UsersGrid';
import { parseCalendarData, useUsersManagement } from '@/hooks/useUsersManagement';
import { useRealtimeProfiles } from '@/hooks/useRealtimeProfiles';
import { useAuth } from '@/contexts/AuthContext';

export default function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { profiles: data, isLoading: loading } = useRealtimeProfiles([], {
    channelName: 'users-page-profiles',
    onlyUpdates: false,
  });
  const {
    currentUserId,
    deletingCalendarId,
    editFormData,
    formData,
    handleAddCalendarSubmit,
    handleCreateUser,
    handleDeleteCalendar,
    handleDeleteClick,
    handleDeleteUser,
    handleEditClick,
    handleLinkCalendar,
    handleLinkSchedule,
    handleUpdateUser,
    isAddCalendarModalOpen,
    isAddingCalendar,
    isCreating,
    isDeleteDialogOpen,
    isDeleting,
    isDialogOpen,
    isEditDialogOpen,
    isLinkModalOpen,
    isLinkingSchedule,
    isUpdating,
    linkedCalendarId,
    linkingCalendarId,
    newCalendarName,
    setEditFormData,
    setFormData,
    setIsAddCalendarModalOpen,
    setIsDeleteDialogOpen,
    setIsDialogOpen,
    setIsEditDialogOpen,
    setIsLinkModalOpen,
    setNewCalendarName,
    userToDelete,
    userToEdit,
    webhookResponse,
  } = useUsersManagement({
    currentAuthUserId: currentUser?.auth_id,
  });

  const handleConfigureSchedule = (userId: string) => {
    navigate(`/users/${userId}/schedule`);
  };

  const doctorsCount = data.filter((profile) => profile.role === 'doctor').length;
  const secretaryCount = data.filter((profile) => profile.role === 'secretary').length;
  const ownerCount = data.filter((profile) => profile.role === 'owner').length;
  const profilesWithContact = data.filter((profile) => profile.email || profile.phone).length;
  const usersSummaryCards = [
    {
      title: 'Equipe total',
      value: data.length,
      description: 'Usuarios ativos na operacao da clinica.',
    },
    {
      title: 'Corpo clinico',
      value: doctorsCount,
      description: 'Medicos disponiveis para agenda, atendimento e receita.',
    },
    {
      title: 'Recepcao e comercial',
      value: secretaryCount,
      description: 'Usuarios que sustentam triagem, agenda e conversao.',
    },
    {
      title: 'Perfis com contato',
      value: profilesWithContact,
      description: `${ownerCount} perfil(is) de gestao e ${Math.max(data.length - profilesWithContact, 0)} com cadastro incompleto.`,
    },
  ];

  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
            <p className="mt-1 text-muted-foreground">
              Controle de equipe, papeis operacionais e disponibilidade para agenda e atendimento.
            </p>
          </div>

          <UsersCreateDialog
            formData={formData}
            isCreating={isCreating}
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmit={handleCreateUser}
            setFormData={setFormData}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {usersSummaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs uppercase tracking-wide">{card.title}</CardDescription>
                <CardTitle className="text-2xl">{loading ? '...' : card.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">{card.description}</CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leitura da Operacao</CardTitle>
            <CardDescription>
              O objetivo desta tela e manter a equipe pronta para executar agenda, atendimento e crescimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Medicos precisam estar completos para alimentar agenda, consultas e receita prevista.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Secretarias e time comercial sustentam velocidade de resposta e recuperacao de pacientes.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Vincule agendas apenas quando o perfil ja estiver pronto para operacao real.
            </div>
          </CardContent>
        </Card>

        <UsersGrid
          currentAuthUserId={currentUser?.auth_id}
          isLinkingSchedule={isLinkingSchedule}
          loading={loading}
          onConfigureSchedule={handleConfigureSchedule}
          onDeleteClick={handleDeleteClick}
          onEditClick={handleEditClick}
          onLinkSchedule={handleLinkSchedule}
          users={data}
        />
      </div>

      <UsersCalendarsDialog
        currentUserId={currentUserId}
        deletingCalendarId={deletingCalendarId}
        isOpen={isLinkModalOpen}
        linkedCalendarId={linkedCalendarId}
        linkingCalendarId={linkingCalendarId}
        onClose={() => setIsLinkModalOpen(false)}
        onDeleteCalendar={handleDeleteCalendar}
        onLinkCalendar={handleLinkCalendar}
        onOpenAddCalendar={() => setIsAddCalendarModalOpen(true)}
        parseCalendarData={parseCalendarData}
        webhookResponse={webhookResponse}
      />

      <UsersEditDialog
        editFormData={editFormData}
        isOpen={isEditDialogOpen}
        isUpdating={isUpdating}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateUser}
        setEditFormData={setEditFormData}
        userToEdit={userToEdit}
      />

      <UsersAddCalendarDialog
        isAddingCalendar={isAddingCalendar}
        isOpen={isAddCalendarModalOpen}
        newCalendarName={newCalendarName}
        onOpenChange={setIsAddCalendarModalOpen}
        onSubmit={handleAddCalendarSubmit}
        setNewCalendarName={setNewCalendarName}
      />

      <UsersDeleteDialog
        isDeleting={isDeleting}
        isOpen={isDeleteDialogOpen}
        onDelete={handleDeleteUser}
        onOpenChange={setIsDeleteDialogOpen}
        userToDelete={userToDelete}
      />
    </DashboardLayout>
  );
}
