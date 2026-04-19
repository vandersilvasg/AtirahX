import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGrowthDashboardMetrics } from '@/hooks/useGrowthDashboardMetrics';
import {
  AlertTriangle,
  CalendarCheck2,
  DollarSign,
  Gauge,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function Dashboard() {
  const metrics = useGrowthDashboardMetrics();
  const funnelSteps = [
    { label: 'Leads novos', value: metrics.funnel.leadsNovos, previous: metrics.funnel.leadsNovos },
    { label: 'Respondidos', value: metrics.funnel.respondidos, previous: metrics.funnel.leadsNovos },
    { label: 'Qualificados', value: metrics.funnel.qualificados, previous: metrics.funnel.respondidos },
    { label: 'Agendados', value: metrics.funnel.agendados, previous: metrics.funnel.qualificados },
    { label: 'Compareceram', value: metrics.funnel.compareceram, previous: metrics.funnel.agendados },
    { label: 'Fecharam', value: metrics.funnel.fechados, previous: metrics.funnel.compareceram },
  ];

  const kpis = [
    {
      title: 'Faturamento previsto',
      value: currencyFormatter.format(metrics.faturamentoEstimado),
      icon: DollarSign,
      description: 'Pipeline previsto no mes',
    },
    {
      title: 'Faturamento realizado',
      value: currencyFormatter.format(metrics.faturamentoRealizado),
      icon: TrendingUp,
      description: 'Receita fechada no periodo',
    },
    {
      title: 'Consultas agendadas',
      value: String(metrics.consultasAgendadas),
      icon: CalendarCheck2,
      description: 'Consultas futuras ativas',
    },
    {
      title: 'Taxa de conversao',
      value: `${metrics.taxaConversao}%`,
      icon: Gauge,
      description: 'Leads que fecham',
    },
    {
      title: 'Taxa de no-show',
      value: `${metrics.taxaNoShow}%`,
      icon: AlertTriangle,
      description: 'Faltas e ausencias',
    },
    {
      title: 'Tempo medio de resposta',
      value: `${Math.round(metrics.tempoMedioRespostaSegundos)}s`,
      icon: MessageCircle,
      description: 'Velocidade comercial',
    },
  ];

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="space-y-8 p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Crescimento da Clinica</h1>
            <p className="mt-1 text-muted-foreground">
              Painel executivo para faturamento, conversao, no-show e recuperacao.
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((item) => (
            <Card key={item.title}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between text-xs uppercase">
                  <span>{item.title}</span>
                  <item.icon className="h-4 w-4 text-primary" />
                </CardDescription>
                <CardTitle className="text-2xl">{metrics.loading ? '...' : item.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">{item.description}</CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funil de Crescimento</CardTitle>
              <CardDescription>
                Leads {'->'} Respondidos {'->'} Qualificados {'->'} Agendados {'->'} Compareceram {'->'} Fecharam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {funnelSteps.map((step) => (
                <div key={step.label} className="rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span>{step.label}</span>
                    <strong>{step.value}</strong>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Conversao da etapa:{' '}
                    {step.previous > 0 ? `${((step.value / step.previous) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
              ))}
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
                Maior gargalo: {metrics.principalGargalo}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perda de Receita</CardTitle>
              <CardDescription>Oportunidades perdidas e motivos com maior impacto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold text-destructive">
                {currencyFormatter.format(metrics.perdaReceita)}
              </p>
              <p className="text-sm text-muted-foreground">
                Pacientes perdidos contabilizados: {metrics.pacientesPerdidos}
              </p>
              {metrics.lossReasons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Quando houver perdas categorizadas, os motivos aparecerao aqui.
                </p>
              ) : (
                metrics.lossReasons.slice(0, 4).map((reason) => (
                  <div key={reason.label} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{reason.label}</span>
                    <span>
                      {reason.total} • {currencyFormatter.format(reason.valor)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insights IA</CardTitle>
              <CardDescription>Leituras automaticas para orientar a proxima acao da equipe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {metrics.insights.map((insight, index) => (
                <p key={index}>• {insight}</p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campanhas e Origem</CardTitle>
              <CardDescription>Performance por canal de entrada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.canais.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados por canal no momento.</p>
              ) : (
                metrics.canais.slice(0, 5).map((canal) => (
                  <div
                    key={canal.source_channel}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{canal.source_channel}</p>
                      <p className="text-xs text-muted-foreground">
                        {canal.total_fechados}/{canal.total_leads} fechados
                      </p>
                    </div>
                    <p className="font-semibold">{currencyFormatter.format(canal.valor_fechado)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
