import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCampaignMetrics } from '@/hooks/useCampaignMetrics';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const toPercent = (value: number) => `${value.toFixed(1)}%`;

export default function CampanhasOrigem() {
  const metrics = useCampaignMetrics();

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="space-y-8 p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campanhas & Origem</h1>
            <p className="mt-1 text-muted-foreground">
              Compare canais por conversao, receita e eficiencia comercial.
            </p>
          </div>
          <Button variant="outline" onClick={() => void metrics.refresh()} disabled={metrics.loading}>
            Atualizar
          </Button>
        </div>

        {metrics.error ? (
          <Card className="border-destructive/40">
            <CardContent className="py-4 text-sm text-destructive">{metrics.error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Leads totais</CardDescription>
              <CardTitle>{metrics.summary.totalLeads}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Fechados</CardDescription>
              <CardTitle>{metrics.summary.totalFechados}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conversao geral</CardDescription>
              <CardTitle>{toPercent(metrics.summary.conversaoGeral)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Valor fechado</CardDescription>
              <CardTitle>{currencyFormatter.format(metrics.summary.valorFechado)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance por canal</CardTitle>
            <CardDescription>Indicadores de conversao, valor fechado e valor perdido por origem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.loading ? (
              <p className="text-sm text-muted-foreground">Carregando canais...</p>
            ) : metrics.channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de campanhas/origem.</p>
            ) : (
              metrics.channels.map((channel) => {
                const conversion = channel.total_leads
                  ? (channel.total_fechados / channel.total_leads) * 100
                  : 0;
                const roiProxy =
                  channel.valor_perdido > 0
                    ? ((channel.valor_fechado - channel.valor_perdido) / channel.valor_perdido) * 100
                    : channel.valor_fechado > 0
                      ? 100
                      : 0;

                return (
                  <div
                    key={channel.source_channel}
                    className="grid grid-cols-1 gap-3 rounded-lg border px-4 py-3 md:grid-cols-6"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">Canal</p>
                      <p className="font-medium">{channel.source_channel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Leads</p>
                      <p>{channel.total_leads}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conversao</p>
                      <p>{toPercent(conversion)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor fechado</p>
                      <p>{currencyFormatter.format(channel.valor_fechado)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor perdido</p>
                      <p>{currencyFormatter.format(channel.valor_perdido)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ROI estimado</p>
                      <p>{toPercent(roiProxy)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
