import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';
import { isMissingColumnError } from '@/lib/dashboardMetrics';

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  role: string;
  avatar_url: string;
  consultation_price: number;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

export function useProfileManagement() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    specialization: '',
    role: '',
    avatar_url: '',
    consultation_price: 0,
  });

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialization: data.specialization || '',
          role: data.role || '',
          avatar_url: data.avatar_url || '',
          consultation_price: data.consultation_price || 0,
        });
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const supabase = await getSupabaseClient();
      let { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          specialization: profileData.specialization,
          avatar_url: profileData.avatar_url,
          consultation_price: profileData.consultation_price,
        })
        .eq('id', user.id);

      if (error && isMissingColumnError(error, 'consultation_price')) {
        ({ error } = await supabase
          .from('profiles')
          .update({
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            specialization: profileData.specialization,
            avatar_url: profileData.avatar_url,
          })
          .eq('id', user.id));
      }

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao salvar perfil:', error);
      toast.error(getErrorMessage(error, 'Erro ao salvar alteracoes'));
    } finally {
      setIsSaving(false);
    }
  };

  const persistAvatarUrl = async (avatarUrl: string) => {
    if (!user?.id) return;

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl || null })
        .eq('id', user.id);

      if (error) throw error;
      await refreshUser();
    } catch (error: unknown) {
      console.error('Erro ao salvar foto de perfil:', error);
      toast.error(getErrorMessage(error, 'Erro ao salvar foto de perfil'));
    }
  };

  const getRoleBadgeLabel = (role: string) => {
    if (role === 'owner') return 'Dono';
    if (role === 'doctor') return 'Medico';
    if (role === 'secretary') return 'Secretaria';
    return null;
  };

  const getRoleBadgeClassName = (role: string) => {
    if (role === 'owner') return 'bg-purple-500';
    if (role === 'doctor') return 'bg-blue-500';
    if (role === 'secretary') return 'bg-green-500';
    return '';
  };

  return {
    getRoleBadgeClassName,
    getRoleBadgeLabel,
    handleSave,
    isLoading,
    isSaving,
    persistAvatarUrl,
    profileData,
    setProfileData,
    user,
  };
}


