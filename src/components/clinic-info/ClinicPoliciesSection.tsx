import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClinicInfoRow } from '@/hooks/useClinicInfoManagement';
import { Building2, Loader2 } from 'lucide-react';

type ClinicPoliciesSectionProps = {
  clinicInfo: ClinicInfoRow | null;
  loading: boolean;
  onChange: (field: keyof ClinicInfoRow, value: string) => void;
};

export function ClinicPoliciesSection({
  clinicInfo,
  loading,
  onChange,
}: ClinicPoliciesSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <span className="font-semibold">Politicas</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agendamento</Label>
              <Textarea
                placeholder="Regras para agendamentos"
                value={clinicInfo?.policy_scheduling ?? ''}
                onChange={(e) => onChange('policy_scheduling', e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Reagendamento</Label>
              <Textarea
                placeholder="Regras para reagendamentos"
                value={clinicInfo?.policy_rescheduling ?? ''}
                onChange={(e) => onChange('policy_rescheduling', e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Cancelamento</Label>
              <Textarea
                placeholder="Regras para cancelamentos"
                value={clinicInfo?.policy_cancellation ?? ''}
                onChange={(e) => onChange('policy_cancellation', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
