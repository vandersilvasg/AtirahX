import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { webhookRequest } from '@/lib/webhookClient';
import { toast } from 'sonner';
import {
  DEFAULT_CREATE_FORM,
  DEFAULT_EDIT_FORM,
  getUsersErrorMessage,
  parseCalendarData,
  type CreateUserFormData,
  type EditUserFormData,
  type UserRole,
  type WebhookCalendarsResponse,
} from '@/lib/usersManagement';

export { parseCalendarData };

export type ManagedUser = {
  id: string;
  auth_user_id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  consultation_price?: number | null;
};

type UseUsersManagementParams = {
  currentAuthUserId?: string;
};


export function useUsersManagement({ currentAuthUserId }: UseUsersManagementParams) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isLinkingSchedule, setIsLinkingSchedule] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<WebhookCalendarsResponse | null>(null);
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [deletingCalendarId, setDeletingCalendarId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isAddCalendarModalOpen, setIsAddCalendarModalOpen] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [linkedCalendarId, setLinkedCalendarId] = useState<string | null>(null);
  const [linkingCalendarId, setLinkingCalendarId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState(DEFAULT_EDIT_FORM);
  const [formData, setFormData] = useState(DEFAULT_CREATE_FORM);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const supabase = await getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
          },
          emailRedirectTo: `${window.location.origin}/reset-password`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) {
        throw new Error('Falha ao criar usuario no sistema de autenticacao');
      }

      const { error: profileError } = await supabase.rpc('create_or_update_doctor_profile', {
        p_auth_user_id: authData.user.id,
        p_name: formData.name,
        p_role: formData.role,
      });

      if (profileError) {
        const { error: directError } = await supabase.from('profiles').insert({
          auth_user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialization: formData.specialization,
          role: formData.role,
        });

        if (directError) throw directError;
      } else {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: formData.email,
            phone: formData.phone,
            specialization: formData.specialization,
          })
          .eq('auth_user_id', authData.user.id);

        if (updateError) {
          console.error('Erro ao atualizar campos adicionais:', updateError);
        }
      }

      toast.success(`${formData.role === 'doctor' ? 'Medico' : 'Secretaria'} criado(a) com sucesso!`);
      setFormData(DEFAULT_CREATE_FORM);
      setIsDialogOpen(false);
    } catch (err: unknown) {
      console.error('Erro ao criar usuario:', err);
      toast.error(getUsersErrorMessage(err, 'Erro ao criar usuario'));
    } finally {
      setIsCreating(false);
    }
  };

  const fetchLinkedCalendar = async (userId: string) => {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('profile_calendars')
        .select('calendar_id, calendar_name')
        .eq('profile_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar calendar vinculado:', error);
        return;
      }

      setLinkedCalendarId(data?.calendar_id ?? null);
    } catch (err) {
      console.error('Erro ao buscar calendar vinculado:', err);
    }
  };

  const handleLinkCalendar = async (userId: string, calendarId: string, calendarName: string) => {
    setLinkingCalendarId(calendarId);
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from('profile_calendars').upsert(
        {
          profile_id: userId,
          calendar_id: calendarId,
          calendar_name: calendarName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      );

      if (error) throw error;

      setLinkedCalendarId(calendarId);
      toast.success(`Agenda "${calendarName}" vinculada com sucesso!`);
    } catch (err: unknown) {
      console.error('Erro ao vincular calendar:', err);
      toast.error(getUsersErrorMessage(err, 'Erro ao vincular agenda'));
    } finally {
      setLinkingCalendarId(null);
    }
  };

  const handleLinkSchedule = async (userId: string) => {
    setCurrentUserId(userId);
    setIsLinkingSchedule(true);

    try {
      await fetchLinkedCalendar(userId);

      const data = await webhookRequest<WebhookCalendarsResponse>('/gestao-agendas', {
        method: 'POST',
        body: {
          userId,
          funcao: 'leitura',
        },
      });

      if (!data || (typeof data === 'string' && data.trim() === '')) {
        throw new Error('Resposta vazia do servidor');
      }

      setWebhookResponse(data);
      toast.success('Agenda vinculada com sucesso!');
      setTimeout(() => {
        setIsLinkModalOpen(true);
      }, 100);
    } catch (err: unknown) {
      console.error('Erro ao vincular agenda:', err);
      toast.error(getUsersErrorMessage(err, 'Erro ao vincular agenda'));
    } finally {
      setIsLinkingSchedule(false);
    }
  };

  const handleAddCalendar = async (userId: string, calendarName: string) => {
    setIsAddingCalendar(true);
    try {
      await webhookRequest<WebhookCalendarsResponse>('/gestao-agendas', {
        method: 'POST',
        body: {
          userId,
          funcao: 'adicionar',
          calendarName,
        },
      });

      toast.success('Calendario adicionado com sucesso!');
      setIsAddCalendarModalOpen(false);
      setNewCalendarName('');
      await handleLinkSchedule(userId);
    } catch (err: unknown) {
      console.error('Erro ao adicionar calendario:', err);
      toast.error(getUsersErrorMessage(err, 'Erro ao adicionar calendario'));
    } finally {
      setIsAddingCalendar(false);
    }
  };

  const handleAddCalendarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendarName.trim()) {
      toast.error('Por favor, informe o nome da agenda');
      return;
    }

    void handleAddCalendar(currentUserId, newCalendarName);
  };

  const handleDeleteCalendar = async (userId: string, calendarId: string) => {
    setDeletingCalendarId(calendarId);
    try {
      await webhookRequest<WebhookCalendarsResponse>('/gestao-agendas', {
        method: 'POST',
        body: {
          userId,
          funcao: 'apagar',
          calendarId,
        },
      });

      toast.success('Calendario excluido com sucesso!');
      await handleLinkSchedule(userId);
    } catch (err: unknown) {
      console.error('Erro ao deletar calendario:', err);
      toast.error(getUsersErrorMessage(err, 'Erro ao deletar calendario'));
    } finally {
      setDeletingCalendarId(null);
    }
  };

  const handleEditClick = (user: ManagedUser) => {
    setUserToEdit(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      specialization: user.specialization || '',
      role: user.role,
      avatar_url: user.avatar_url || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setIsUpdating(true);
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          specialization: editFormData.specialization,
          role: editFormData.role,
          avatar_url: editFormData.avatar_url,
        })
        .eq('id', userToEdit.id);

      if (error) throw error;

      toast.success('Usuario atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setUserToEdit(null);
    } catch (err: unknown) {
      console.error('Erro ao atualizar usuario:', err);
      toast.error(getUsersErrorMessage(err, 'Erro ao atualizar usuario'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (user: ManagedUser) => {
    if (user.auth_user_id === currentAuthUserId) {
      toast.error('Voce nao pode deletar seu proprio usuario');
      return;
    }

    if (user.role === 'owner') {
      toast.error('Nao e possivel deletar usuarios com perfil de Dono');
      return;
    }

    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const supabase = await getSupabaseClient();
      const { error: deleteError } = await supabase.from('profiles').delete().eq('id', userToDelete.id);

      if (deleteError) throw deleteError;

      if (userToDelete.auth_user_id) {
        try {
          const { error: authError } = await supabase.auth.admin.deleteUser(userToDelete.auth_user_id);
          if (authError) {
            console.warn('Nao foi possivel deletar usuario do Auth (requer Admin API):', authError);
          }
        } catch (err) {
          console.warn('Auth Admin API nao disponivel:', err);
        }
      }

      toast.success(`${userToDelete.role === 'doctor' ? 'Medico' : 'Secretaria'} deletado(a) com sucesso!`);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: unknown) {
      console.error('Erro ao deletar usuario:', err);
      toast.error(getUsersErrorMessage(err, 'Erro ao deletar usuario'));
    } finally {
      setIsDeleting(false);
    }
  };

  return {
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
  };
}
