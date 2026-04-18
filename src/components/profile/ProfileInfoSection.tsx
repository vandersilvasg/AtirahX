import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProfileData } from '@/hooks/useProfileManagement';
import { DollarSign, Mail, Phone, Stethoscope, User } from 'lucide-react';

type ProfileInfoSectionProps = {
  onProfileDataChange: (profileData: ProfileData) => void;
  profileData: ProfileData;
};

export function ProfileInfoSection({
  onProfileDataChange,
  profileData,
}: ProfileInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacoes Pessoais</CardTitle>
        <CardDescription>Atualize seus dados pessoais e de contato</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome Completo
          </Label>
          <Input
            id="name"
            value={profileData.name}
            onChange={(e) => onProfileDataChange({ ...profileData, name: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={profileData.email}
            onChange={(e) => onProfileDataChange({ ...profileData, email: e.target.value })}
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={profileData.phone}
            onChange={(e) => onProfileDataChange({ ...profileData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>

        {profileData.role === 'doctor' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="specialization" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Especializacao
              </Label>
              <Input
                id="specialization"
                value={profileData.specialization}
                onChange={(e) =>
                  onProfileDataChange({ ...profileData, specialization: e.target.value })
                }
                placeholder="Ex: Cardiologista, Pediatra, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation_price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Preco da Consulta (R$)
              </Label>
              <Input
                id="consultation_price"
                type="number"
                step="0.01"
                min="0"
                value={profileData.consultation_price}
                onChange={(e) =>
                  onProfileDataChange({
                    ...profileData,
                    consultation_price: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Valor cobrado por consulta (opcional)
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
