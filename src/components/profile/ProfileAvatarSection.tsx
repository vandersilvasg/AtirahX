import { DoctorAvatarUpload } from '@/components/doctors/DoctorAvatarUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProfileData } from '@/hooks/useProfileManagement';

type ProfileAvatarSectionProps = {
  onProfileDataChange: (profileData: ProfileData) => void;
  onPersistAvatarUrl: (avatarUrl: string) => Promise<void>;
  profileData: ProfileData;
  userId?: string;
};

export function ProfileAvatarSection({
  onProfileDataChange,
  onPersistAvatarUrl,
  profileData,
  userId,
}: ProfileAvatarSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto de Perfil</CardTitle>
        <CardDescription>Adicione ou altere sua foto de perfil</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-6">
        <DoctorAvatarUpload
          doctorId={profileData.id || userId || ''}
          avatarUrl={profileData.avatar_url}
          doctorName={profileData.name}
          onUploadSuccess={(url) => {
            onProfileDataChange({ ...profileData, avatar_url: url });
            void onPersistAvatarUrl(url);
          }}
          onRemoveSuccess={() => {
            onProfileDataChange({ ...profileData, avatar_url: '' });
            void onPersistAvatarUrl('');
          }}
          size="lg"
        />
      </CardContent>
    </Card>
  );
}
