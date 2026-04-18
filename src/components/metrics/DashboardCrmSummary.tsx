import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardCrmSummaryProps = {
  metricValue: (value: number) => string;
  metrics: {
    automacaoEnviadosHoje: number;
    automacaoFalhas: number;
    automacaoPendentes: number;
    followupsPendentes: number;
    jornadaAgendado: number;
    jornadaAguardando: number;
    jornadaCancelado: number;
    jornadaEmAtendimento: number;
    jornadaFinalizado: number;
    listaEsperaAtivos: number;
    listaEsperaOfertasPendentes: number;
  };
};

export function DashboardCrmSummary({
  metricValue,
  metrics,
}: DashboardCrmSummaryProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-foreground">CRM</h2>
        <p className="text-sm text-muted-foreground">Jornada, automacao e lista de espera</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Jornada das Consultas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Agendado</span>
              <strong>{metricValue(metrics.jornadaAgendado)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Aguardando</span>
              <strong>{metricValue(metrics.jornadaAguardando)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Em atendimento</span>
              <strong>{metricValue(metrics.jornadaEmAtendimento)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Finalizado</span>
              <strong>{metricValue(metrics.jornadaFinalizado)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Cancelado</span>
              <strong>{metricValue(metrics.jornadaCancelado)}</strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automacao de Contatos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Jobs pendentes</span>
              <strong>{metricValue(metrics.automacaoPendentes)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Enviados hoje</span>
              <strong>{metricValue(metrics.automacaoEnviadosHoje)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Falhas</span>
              <strong>{metricValue(metrics.automacaoFalhas)}</strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Espera e Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Pacientes ativos</span>
              <strong>{metricValue(metrics.listaEsperaAtivos)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Ofertas pendentes</span>
              <strong>{metricValue(metrics.listaEsperaOfertasPendentes)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Follow-ups pendentes</span>
              <strong>{metricValue(metrics.followupsPendentes)}</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
