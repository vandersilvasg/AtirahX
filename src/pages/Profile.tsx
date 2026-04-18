import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfileAvatarSection } from '@/components/profile/ProfileAvatarSection';
import { ProfileInfoSection } from '@/components/profile/ProfileInfoSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfileManagement } from '@/hooks/useProfileManagement';
import { Loader2, Save } from 'lucide-react';

export default function Profile() {
  const {
    getRoleBadgeClassName,
    getRoleBadgeLabel,
    handleSave,
    isLoading,
    isSaving,
    persistAvatarUrl,
    profileData,
    setProfileData,
    user,
  } = useProfileManagement();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const roleLabel = getRoleBadgeLabel(profileData.role);

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie suas informacoes pessoais e profissionais
            </p>
          </div>
          {roleLabel && <Badge className={getRoleBadgeClassName(profileData.role)}>{roleLabel}</Badge>}
        </div>

        <ProfileAvatarSection
          onProfileDataChange={setProfileData}
          onPersistAvatarUrl={persistAvatarUrl}
          profileData={profileData}
          userId={user?.id}
        />

        <ProfileInfoSection
          onProfileDataChange={setProfileData}
          profileData={profileData}
        />

        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alteracoes
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
