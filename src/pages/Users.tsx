import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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


  return (
    <DashboardLayout requiredRoles={['owner']}>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
            <p className="text-muted-foreground mt-1">Administração de médicos e secretárias</p>
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

        {/* Contador de usuários */}
        <div className="text-sm text-muted-foreground">
          {loading ? 'Carregando...' : `${data.length} usuario(s) encontrado(s)`}
        </div>

        {/* Grid de Cards de Usuarios */}
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







