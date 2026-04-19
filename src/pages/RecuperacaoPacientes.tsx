import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRecoveryPatients } from '@/hooks/useRecoveryPatients';
import { toast } from 'sonner';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type BucketConfig = {
  key: 'naoResponderam' | 'naoAgendaram' | 'faltaram' | 'naoFecharam';
  title: string;
  description: string;
};

const BUCKETS: BucketConfig[] = [
  {
    key: 'naoResponderam',
    title: 'Nao responderam',
    description: 'Leads sem retorno recente para abordagem ativa.',
  },
  {
    key: 'naoAgendaram',
    title: 'Nao agendaram',
    description: 'Leads qualificados que ainda nao converteram em agenda.',
  },
  {
    key: 'faltaram',
    title: 'Faltaram',
    description: 'Pacientes com risco de perda por ausencia.',
  },
  {
    key: 'naoFecharam',
    title: 'Nao fecharam',
    description: 'Pacientes que avancaram no funil e nao concluiram o fechamento.',
  },
];

export default function RecuperacaoPacientes() {
  const recovery = useRecoveryPatients();

  const handleReactivate = async (leadId: string) => {
    const result = await recovery.reactivateLead(leadId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Lead reativado com sucesso.');
  };

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="space-y-8 p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recuperacao de Pacientes</h1>
            <p className="mt-1 text-muted-foreground">
              Oportunidades perdidas com acao rapida da equipe e reativacao guiada.
            </p>
          </div>
          <Button variant="outline" onClick={() => void recovery.refresh()} disabled={recovery.loading}>
            Atualizar
          </Button>
        </div>

        {recovery.error ? (
          <Card className="border-destructive/40">
            <CardContent className="py-4 text-sm text-destructive">{recovery.error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Nao responderam</CardDescription>
              <CardTitle>{recovery.totals.naoResponderam}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Nao agendaram</CardDescription>
              <CardTitle>{recovery.totals.naoAgendaram}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Faltaram</CardDescription>
              <CardTitle>{recovery.totals.faltaram}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Valor recuperavel</CardDescription>
              <CardTitle>{currencyFormatter.format(recovery.totals.valorRecuperavel)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {BUCKETS.map((bucket) => {
            const leads = recovery[bucket.key];
            return (
              <Card key={bucket.key}>
                <CardHeader>
                  <CardTitle className="text-lg">{bucket.title}</CardTitle>
                  <CardDescription>{bucket.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recovery.loading ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum paciente nesta lista.</p>
                  ) : (
                    leads.slice(0, 8).map((lead) => (
                      <div key={lead.id} className="rounded-lg border px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{lead.name || 'Lead sem nome'}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead.source_channel} • {currencyFormatter.format(Number(lead.estimated_value || 0))}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Ultima interacao: {lead.last_contact_at || 'sem registro'}
                            </p>
                            <p className="mt-1 text-xs text-foreground/80">
                              Proxima acao: {lead.next_action || 'reativar abordagem'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => void handleReactivate(lead.id)}
                            disabled={recovery.reactivatingIds[lead.id]}
                          >
                            Reativar fluxo
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
