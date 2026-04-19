import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfileAvatarSection } from '@/components/profile/ProfileAvatarSection';
import { ProfileInfoSection } from '@/components/profile/ProfileInfoSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfileManagement } from '@/hooks/useProfileManagement';
import { Bell, BriefcaseMedical, Loader2, Save, Shield, UserRoundCheck } from 'lucide-react';

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
  const profileSummaryCards = [
    {
      title: 'Perfil de acesso',
      value: roleLabel ?? 'Nao definido',
      description: 'Define como voce opera no sistema e quais modulos sao prioritarios.',
      icon: Shield,
    },
    {
      title: 'Contato principal',
      value: profileData.email || 'Nao informado',
      description: profileData.phone || 'Telefone ainda nao informado.',
      icon: UserRoundCheck,
    },
    {
      title: 'Especialidade',
      value: profileData.specialization || 'Nao informada',
      description:
        profileData.role === 'doctor'
          ? 'Usada para contexto profissional e leitura de atendimento.'
          : 'Campo opcional para perfis nao medicos.',
      icon: BriefcaseMedical,
    },
    {
      title: 'Preferencias',
      value: 'Padrao da conta',
      description: 'Idioma, notificacoes e seguranca podem evoluir a partir deste perfil.',
      icon: Bell,
    },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie seus dados pessoais, contexto profissional e o que o sistema usa para te identificar.
            </p>
          </div>
          {roleLabel && <Badge className={getRoleBadgeClassName(profileData.role)}>{roleLabel}</Badge>}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {profileSummaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span>{card.title}</span>
                  <card.icon className="h-4 w-4 text-primary" />
                </CardDescription>
                <CardTitle className="text-lg break-all">{card.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">{card.description}</CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leitura da Conta</CardTitle>
            <CardDescription>
              Seu perfil precisa estar confiavel para notificacoes, agenda e relacionamento com pacientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Nome, foto e cargo tornam o atendimento mais humano e reduzem ruido operacional.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Email e telefone completos ajudam em recuperacao de acesso e comunicacao interna.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Para medicos, especialidade e preco de consulta refinam CRM, agenda e dashboards.
            </div>
          </CardContent>
        </Card>

        <ProfileAvatarSection
          onProfileDataChange={setProfileData}
          onPersistAvatarUrl={persistAvatarUrl}
          profileData={profileData}
          userId={user?.id}
        />

        <ProfileInfoSection onProfileDataChange={setProfileData} profileData={profileData} />

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
