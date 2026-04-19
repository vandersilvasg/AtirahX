import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClinicInfoRow } from '@/hooks/useClinicInfoManagement';
import { Loader2, MapPin } from 'lucide-react';

type ClinicAddressSectionProps = {
  clinicInfo: ClinicInfoRow | null;
  loading: boolean;
  onChange: (field: keyof ClinicInfoRow, value: string) => void;
};

export function ClinicAddressSection({
  clinicInfo,
  loading,
  onChange,
}: ClinicAddressSectionProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <span className="font-semibold">Endereco e Horarios</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-4">
              <Label>Endereco</Label>
              <Input
                placeholder="Rua Exemplo"
                value={clinicInfo?.address_line ?? ''}
                onChange={(e) => onChange('address_line', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Numero</Label>
              <Input
                placeholder="123"
                value={clinicInfo?.address_number ?? ''}
                onChange={(e) => onChange('address_number', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Bairro</Label>
              <Input
                placeholder="Bairro"
                value={clinicInfo?.neighborhood ?? ''}
                onChange={(e) => onChange('neighborhood', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cidade</Label>
              <Input
                placeholder="Cidade"
                value={clinicInfo?.city ?? ''}
                onChange={(e) => onChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input
                placeholder="SP"
                value={clinicInfo?.state ?? ''}
                onChange={(e) => onChange('state', e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                value={clinicInfo?.zip_code ?? ''}
                onChange={(e) => onChange('zip_code', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-6">
              <Label>Horario de Atendimento</Label>
              <Textarea
                placeholder="Ex.: Seg a Sex 08:00 - 18:00, Sab 08:00 - 12:00"
                value={clinicInfo?.opening_hours ?? ''}
                onChange={(e) => onChange('opening_hours', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
