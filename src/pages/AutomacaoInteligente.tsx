import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAutomationInteligente } from '@/hooks/useAutomationInteligente';
import { Bot, CalendarClock, MessagesSquare, Repeat } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const MODULES = [
  {
    title: 'SDR IA',
    description: 'Atendimento inicial e qualificacao automatica de leads.',
    icon: Bot,
    objective: 'Responder, qualificar e encaminhar para agendamento',
  },
  {
    title: 'Follow-up automatico',
    description: 'Reengajamento de leads e pacientes sem resposta.',
    icon: MessagesSquare,
    objective: 'Reduzir perda por abandono e demora de resposta',
  },
  {
    title: 'Confirmacao de consulta',
    description: 'Lembretes e confirmacao para reducao de no-show.',
    icon: CalendarClock,
    objective: 'Aumentar comparecimento e preencher agenda',
  },
  {
    title: 'Reativacao inteligente',
    description: 'Fluxos de recuperacao para perdidos e faltosos.',
    icon: Repeat,
    objective: 'Recuperar receita e trazer pacientes de volta',
  },
];

export default function AutomacaoInteligente() {
  const automation = useAutomationInteligente();

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="space-y-8 p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Automacao Inteligente (IA)</h1>
            <p className="mt-1 text-muted-foreground">
              Painel operacional da IA para acelerar receita e reduzir perdas.
            </p>
          </div>
          <Button variant="outline" onClick={() => void automation.refresh()} disabled={automation.loading}>
            Atualizar
          </Button>
        </div>

        {automation.error ? (
          <Card className="border-destructive/40">
            <CardContent className="py-4 text-sm text-destructive">{automation.error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Jobs totais</CardDescription>
              <CardTitle>{automation.summary.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle>{automation.summary.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processando</CardDescription>
              <CardTitle>{automation.summary.processing}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Concluidos</CardDescription>
              <CardTitle>{automation.summary.done}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Falhas</CardDescription>
              <CardTitle>{automation.summary.failed}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modulos de automacao</CardTitle>
              <CardDescription>Arquitetura comercial e clinica focada em execucao.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MODULES.map((module) => (
                <div key={module.title} className="rounded-lg border px-3 py-3">
                  <div className="flex items-center gap-2">
                    <module.icon className="h-4 w-4 text-primary" />
                    <p className="font-medium">{module.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                  <p className="mt-2 text-xs text-foreground/80">Objetivo: {module.objective}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atalhos operacionais</CardTitle>
              <CardDescription>Fluxos ja disponiveis no sistema para execucao imediata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <NavLink to="/whatsapp" className="block rounded-lg border px-3 py-2 hover:bg-accent/30">
                Central de Conversas (WhatsApp + IA)
              </NavLink>
              <NavLink to="/crm" className="block rounded-lg border px-3 py-2 hover:bg-accent/30">
                Pipeline de Leads & Pacientes
              </NavLink>
              <NavLink
                to="/recuperacao-pacientes"
                className="block rounded-lg border px-3 py-2 hover:bg-accent/30"
              >
                Recuperacao de Pacientes
              </NavLink>
              <NavLink to="/agenda" className="block rounded-lg border px-3 py-2 hover:bg-accent/30">
                Agenda Inteligente
              </NavLink>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
