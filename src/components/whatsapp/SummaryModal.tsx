import { useMemo, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, AlertTriangle, CheckCircle2, Clock, TrendingUp, MessageSquare, Bot, User as UserIcon, AlertCircle, Download, Heart, Smile, Meh, Frown, Target, Lightbulb, Shield, Zap, Users, Activity, BarChart3, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  type AnalysisPeriod,
  type ConversationSummary,
} from '@/lib/geminiAnalyzer';

type SummaryPeriod = 'dia_atual' | 'ultimos_7_dias' | 'ultimos_15_dias' | 'ultimos_30_dias';

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  patientPhone: string | null;
}

export function SummaryModal({ open, onOpenChange, sessionId, patientPhone }: SummaryModalProps) {
  const [period, setPeriod] = useState<SummaryPeriod>('dia_atual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ConversationSummary | null>(null);
  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setPeriod('dia_atual');
    setParsed(null);
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    if (!sessionId) {
      setError('Nenhuma conversa selecionada.');
      return;
    }

    setLoading(true);
    setError(null);
    setParsed(null);
    
    try {
      // 1. Buscar todas as mensagens da sessão
      console.log('📥 Buscando mensagens da sessão:', sessionId);
      console.log('🔄 Período selecionado:', period);
      
      const [{ analyzeConversationWithGemini }, { listMessagesBySession }] = await Promise.all([
        import('@/lib/geminiAnalyzer'),
        import('@/lib/medxHistory'),
      ]);

      const messages = await listMessagesBySession(sessionId);
      console.log('📨 Mensagens recebidas:', messages);
      
      if (messages.length === 0) {
        throw new Error('Nenhuma mensagem encontrada nesta conversa.');
      }

      console.log(`✅ ${messages.length} mensagens encontradas`);
      console.log('📋 Primeira mensagem:', messages[0]);

      // 2. Analisar conversa com Gemini
      console.log('🤖 Iniciando análise com Gemini...');
      console.log('⏳ Aguarde, isso pode levar alguns segundos...');
      
      const summary = await analyzeConversationWithGemini(
        sessionId,
        period as AnalysisPeriod,
        messages
      );

      console.log('📊 Resumo recebido:', summary);

      // 3. Definir resultado
      setParsed(summary);
      toast.success('✅ Resumo gerado com sucesso!');
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar resumo';
      console.error('❌ Erro completo:', err);
      console.error('❌ Stack trace:', err instanceof Error ? err.stack : 'N/A');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !parsed) return;

    setDownloading(true);
    try {
      const printWindow = window.open('', '_blank', 'width=1100,height=1400');

      if (!printWindow) {
        throw new Error('Nao foi possivel abrir a janela de impressao.');
      }

      const fileName = `resumo-conversa-${new Date().toISOString().split('T')[0]}.pdf`;
      const currentStyles = Array.from(
        document.querySelectorAll('style, link[rel="stylesheet"]'),
      )
        .map((node) => node.outerHTML)
        .join('\n');

      const printStyles = `
        <style>
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #111827 !important;
            font-family: Arial, sans-serif;
          }

          .print-shell {
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
          }

          .print-shell * {
            color: inherit;
          }

          .print-shell svg {
            opacity: 1 !important;
          }

          .print-shell .text-transparent {
            color: #1f2937 !important;
            -webkit-text-fill-color: #1f2937 !important;
          }

          .print-shell .text-muted-foreground {
            color: #4b5563 !important;
          }

          .print-shell .bg-background,
          .print-shell .bg-card,
          .print-shell .bg-accent,
          .print-shell .bg-muted,
          .print-shell [class*="bg-gradient"] {
            background: #ffffff !important;
          }

          .print-shell .border,
          .print-shell .border-2,
          .print-shell [class*="border-"] {
            border-color: #d1d5db !important;
          }

          .print-shell .rounded-2xl,
          .print-shell .rounded-xl {
            box-shadow: none !important;
          }

          .print-shell .animate-pulse,
          .print-shell [class*="animate-"] {
            animation: none !important;
          }

          .print-shell .grid,
          .print-shell .rounded-2xl,
          .print-shell .rounded-xl {
            break-inside: avoid;
          }
        </style>
      `;

      const html = `
        <!doctype html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>${fileName}</title>
            ${currentStyles}
            ${printStyles}
          </head>
          <body>
            <main class="print-shell">
              ${contentRef.current.innerHTML}
            </main>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 250);
      };

      printWindow.addEventListener(
        'afterprint',
        () => {
          printWindow.close();
        },
        { once: true },
      );

      toast.success('Janela de impressao aberta. Escolha "Salvar como PDF" para exportar.');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao abrir a impressao. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  const resumo = useMemo(() => parsed?.resumo_conversa as string | undefined, [parsed]);
  const nota = useMemo(() => Number(parsed?.nota_atendimento ?? 0), [parsed]);
  const metricas = parsed?.metricas;
  const qualidade = parsed?.qualidade;
  const flags = parsed?.flags;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aberto': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'fechado': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'pendente': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getNotaColor = (n: number) => {
    if (n >= 4) return 'text-green-500';
    if (n >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden grid grid-rows-[auto_1fr_auto] gap-0 p-0">
        {/* Header com gradiente */}
        <div className="relative px-6 pt-6 pb-4 border-b bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-md opacity-50"></div>
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Análise Inteligente de Conversa
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {parsed ? 'Resultados da análise' : 'Selecione o período para gerar o resumo'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {!parsed && (
          <>
            <div className="min-h-0 overflow-hidden px-6">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-4 py-6">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Período de Análise</Label>
                    <RadioGroup value={period} onValueChange={(v) => setPeriod(v as SummaryPeriod)}>
                      {[
                        { value: 'dia_atual', label: 'Dia atual', icon: Clock, desc: 'Apenas conversas de hoje' },
                        { value: 'ultimos_7_dias', label: 'Últimos 7 dias', icon: TrendingUp, desc: 'Semana completa' },
                        { value: 'ultimos_15_dias', label: 'Últimos 15 dias', icon: TrendingUp, desc: 'Quinzena' },
                        { value: 'ultimos_30_dias', label: 'Últimos 30 dias', icon: TrendingUp, desc: 'Mês completo' }
                      ].map(({ value, label, icon: Icon, desc }) => (
                        <label
                          key={value}
                          className="relative flex items-center gap-4 p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all group"
                        >
                          <RadioGroupItem value={value} className="mt-0.5" />
                          <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                          <div className="flex-1">
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground">{desc}</div>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/20 flex items-start gap-3 animate-in fade-in-0 zoom-in-95 duration-200">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                      <div className="text-sm text-destructive">{error}</div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/30">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Análise
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {parsed && (
          <>
            <div className="min-h-0 overflow-hidden px-6">
              <ScrollArea className="h-full pr-2">
                <div ref={contentRef} className="space-y-6 py-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  {/* Header com nota e status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-background to-muted/30 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Nota do Atendimento</div>
                          <div className={`text-5xl font-bold ${getNotaColor(nota)}`}>{nota}<span className="text-2xl text-muted-foreground">/5</span></div>
                        </div>
                        <div className={`p-3 rounded-xl ${nota >= 4 ? 'bg-green-500/10' : nota >= 3 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                          {nota >= 4 ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <AlertTriangle className="w-8 h-8 text-amber-500" />}
                        </div>
                      </div>
                      <Progress value={(nota / 5) * 100} className="h-2" />
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-background to-muted/30 p-6">
                      <div className="text-sm text-muted-foreground mb-2">Status do Atendimento</div>
                      <Badge className={`text-base px-4 py-2 ${getStatusColor(parsed?.status_atendimento)}`}>
                        {parsed?.status_atendimento?.toUpperCase() ?? 'N/A'}
                      </Badge>
                      {metricas && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <MessageSquare className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                            <div className="text-xl font-bold">{metricas.total_mensagens ?? 0}</div>
                            <div className="text-[10px] text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center">
                            <Bot className="w-4 h-4 mx-auto text-primary mb-1" />
                            <div className="text-xl font-bold">{metricas.mensagens_ia ?? 0}</div>
                            <div className="text-[10px] text-muted-foreground">IA</div>
                          </div>
                          <div className="text-center">
                            <UserIcon className="w-4 h-4 mx-auto text-green-500 mb-1" />
                            <div className="text-xl font-bold">{metricas.mensagens_human ?? 0}</div>
                            <div className="text-[10px] text-muted-foreground">Usuário</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumo */}
                  {resumo && (
                    <div className="relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">Resumo da Conversa</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{resumo}</p>
                    </div>
                  )}

                  {/* Qualidade */}
                  {qualidade && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-background to-muted/30 p-6">
                      <h3 className="font-semibold text-lg mb-4">Métricas de Qualidade</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(qualidade).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">{String(value)}</div>
                            <Progress value={(Number(value) / 5) * 100} className="h-1 mb-2" />
                            <div className="text-xs text-muted-foreground capitalize">{key}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Análise de Sentimento */}
                  {parsed?.sentimento && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-2xl border-2 bg-gradient-to-br from-pink-500/5 to-rose-500/5 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Heart className="w-5 h-5 text-pink-500" />
                          <h3 className="font-semibold">Sentimento Paciente</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {parsed.sentimento.paciente === 'Positivo' && <Smile className="w-6 h-6 text-green-500" />}
                          {parsed.sentimento.paciente === 'Neutro' && <Meh className="w-6 h-6 text-yellow-500" />}
                          {parsed.sentimento.paciente === 'Negativo' && <Frown className="w-6 h-6 text-red-500" />}
                          <span className="text-lg font-semibold">{parsed.sentimento.paciente}</span>
                        </div>
                      </div>
                      
                      <div className="rounded-2xl border-2 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="w-5 h-5 text-blue-500" />
                          <h3 className="font-semibold">Sentimento IA</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {parsed.sentimento.ia === 'Positivo' && <Smile className="w-6 h-6 text-green-500" />}
                          {parsed.sentimento.ia === 'Neutro' && <Meh className="w-6 h-6 text-yellow-500" />}
                          {parsed.sentimento.ia === 'Negativo' && <Frown className="w-6 h-6 text-red-500" />}
                          <span className="text-lg font-semibold">{parsed.sentimento.ia}</span>
                        </div>
                      </div>
                      
                      <div className="rounded-2xl border-2 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-5 h-5 text-purple-500" />
                          <h3 className="font-semibold">Satisfação</h3>
                        </div>
                        <div className="text-4xl font-bold text-purple-500">
                          {parsed.sentimento.score_satisfacao}<span className="text-xl text-muted-foreground">/10</span>
                        </div>
                        <Progress value={(parsed.sentimento.score_satisfacao / 10) * 100} className="h-2 mt-2" />
                      </div>
                    </div>
                  )}

                  {/* Evolução do Sentimento */}
                  {parsed?.sentimento?.evolucao && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-semibold text-lg">Evolução da Conversa</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{parsed.sentimento.evolucao}</p>
                    </div>
                  )}

                  {/* Tópicos Identificados */}
                  {Array.isArray(parsed?.topicos_identificados) && parsed.topicos_identificados.length > 0 && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-cyan-500" />
                        <h3 className="font-semibold text-lg">Tópicos Principais</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsed.topicos_identificados.map((topico: string, i: number) => (
                          <Badge key={i} variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-700">
                            {topico}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Momentos Críticos */}
                  {Array.isArray(parsed?.momentos_criticos) && parsed.momentos_criticos.length > 0 && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-orange-500" />
                        <h3 className="font-semibold text-lg">Momentos Críticos</h3>
                      </div>
                      <div className="space-y-3">
                        {parsed.momentos_criticos.map((momento, i: number) => (
                          <div key={i} className={`p-3 rounded-lg border-2 ${
                            momento.gravidade === 'Alta' ? 'bg-red-500/10 border-red-500/30' : 
                            momento.gravidade === 'Média' ? 'bg-orange-500/10 border-orange-500/30' : 
                            'bg-yellow-500/10 border-yellow-500/30'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">{momento.tipo}</span>
                              <Badge variant="outline" className={
                                momento.gravidade === 'Alta' ? 'bg-red-500/20 border-red-500/50 text-red-700' : 
                                momento.gravidade === 'Média' ? 'bg-orange-500/20 border-orange-500/50 text-orange-700' : 
                                'bg-yellow-500/20 border-yellow-500/50 text-yellow-700'
                              }>
                                {momento.gravidade}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{momento.descricao}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Análise SWOT */}
                  {parsed?.analise_detalhada && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pontos Fortes */}
                      {Array.isArray(parsed.analise_detalhada.pontos_fortes) && parsed.analise_detalhada.pontos_fortes.length > 0 && (
                        <div className="rounded-2xl border-2 bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <h3 className="font-semibold text-lg">Pontos Fortes</h3>
                          </div>
                          <ul className="space-y-2">
                            {parsed.analise_detalhada.pontos_fortes.map((ponto: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{ponto}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Pontos a Melhorar */}
                      {Array.isArray(parsed.analise_detalhada.pontos_melhorar) && parsed.analise_detalhada.pontos_melhorar.length > 0 && (
                        <div className="rounded-2xl border-2 bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold text-lg">Pontos a Melhorar</h3>
                          </div>
                          <ul className="space-y-2">
                            {parsed.analise_detalhada.pontos_melhorar.map((ponto: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span>{ponto}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Oportunidades */}
                      {Array.isArray(parsed.analise_detalhada.oportunidades) && parsed.analise_detalhada.oportunidades.length > 0 && (
                        <div className="rounded-2xl border-2 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-blue-500" />
                            <h3 className="font-semibold text-lg">Oportunidades</h3>
                          </div>
                          <ul className="space-y-2">
                            {parsed.analise_detalhada.oportunidades.map((oportunidade: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>{oportunidade}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Riscos */}
                      {Array.isArray(parsed.analise_detalhada.riscos) && parsed.analise_detalhada.riscos.length > 0 && (
                        <div className="rounded-2xl border-2 bg-gradient-to-br from-red-500/5 to-rose-500/5 p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h3 className="font-semibold text-lg">Riscos</h3>
                          </div>
                          <ul className="space-y-2">
                            {parsed.analise_detalhada.riscos.map((risco: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span>{risco}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comportamento do Paciente */}
                  {parsed?.comportamento_paciente && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-violet-500" />
                        <h3 className="font-semibold text-lg">Comportamento do Paciente</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <Badge variant="outline" className={`mb-2 ${
                            parsed.comportamento_paciente.engajamento === 'Alto' ? 'bg-green-500/20 border-green-500/50 text-green-700' :
                            parsed.comportamento_paciente.engajamento === 'Médio' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700' :
                            'bg-red-500/20 border-red-500/50 text-red-700'
                          }`}>
                            {parsed.comportamento_paciente.engajamento}
                          </Badge>
                          <div className="text-xs text-muted-foreground">Engajamento</div>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className={`mb-2 ${
                            parsed.comportamento_paciente.clareza_demanda === 'Clara' ? 'bg-green-500/20 border-green-500/50 text-green-700' :
                            parsed.comportamento_paciente.clareza_demanda === 'Moderada' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700' :
                            'bg-red-500/20 border-red-500/50 text-red-700'
                          }`}>
                            {parsed.comportamento_paciente.clareza_demanda}
                          </Badge>
                          <div className="text-xs text-muted-foreground">Clareza</div>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className={`mb-2 ${
                            parsed.comportamento_paciente.urgencia_percebida === 'Alta' ? 'bg-red-500/20 border-red-500/50 text-red-700' :
                            parsed.comportamento_paciente.urgencia_percebida === 'Média' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700' :
                            'bg-green-500/20 border-green-500/50 text-green-700'
                          }`}>
                            {parsed.comportamento_paciente.urgencia_percebida}
                          </Badge>
                          <div className="text-xs text-muted-foreground">Urgência</div>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className={`mb-2 ${
                            parsed.comportamento_paciente.satisfacao_aparente === 'Satisfeito' ? 'bg-green-500/20 border-green-500/50 text-green-700' :
                            parsed.comportamento_paciente.satisfacao_aparente === 'Neutro' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700' :
                            'bg-red-500/20 border-red-500/50 text-red-700'
                          }`}>
                            {parsed.comportamento_paciente.satisfacao_aparente}
                          </Badge>
                          <div className="text-xs text-muted-foreground">Satisfação</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compliance */}
                  {parsed?.compliance && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-indigo-500" />
                          <h3 className="font-semibold text-lg">Compliance de Atendimento</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-indigo-500">{parsed.compliance.score_compliance}</span>
                          <span className="text-sm text-muted-foreground">/10</span>
                        </div>
                      </div>
                      <Progress value={(parsed.compliance.score_compliance / 10) * 100} className="h-2 mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(parsed.compliance.informacoes_coletadas) && parsed.compliance.informacoes_coletadas.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold mb-2 text-green-600">✓ Informações Coletadas</div>
                            <ul className="space-y-1">
                              {parsed.compliance.informacoes_coletadas.map((info: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  {info}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {Array.isArray(parsed.compliance.informacoes_faltantes) && parsed.compliance.informacoes_faltantes.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold mb-2 text-amber-600">⚠ Informações Faltantes</div>
                            <ul className="space-y-1">
                              {parsed.compliance.informacoes_faltantes.map((info: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-500" />
                                  {info}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {Array.isArray(parsed?.timeline) && parsed.timeline.length > 0 && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-slate-500/5 to-gray-500/5 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <h3 className="font-semibold text-lg">Linha do Tempo</h3>
                      </div>
                      <div className="space-y-3">
                        {parsed.timeline.map((evento, i: number) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                              evento.tipo === 'success' ? 'bg-green-500' :
                              evento.tipo === 'warning' ? 'bg-yellow-500' :
                              evento.tipo === 'error' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold">{evento.momento}</div>
                              <div className="text-xs text-muted-foreground">{evento.evento}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recomendações Específicas */}
                  {Array.isArray(parsed?.recomendacoes_especificas) && parsed.recomendacoes_especificas.length > 0 && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-teal-500" />
                        <h3 className="font-semibold text-lg">Recomendações Específicas</h3>
                      </div>
                      <ul className="space-y-2">
                        {parsed.recomendacoes_especificas.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Target className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Próximas ações */}
                    {Array.isArray(parsed?.proximas_acoes) && parsed.proximas_acoes.length > 0 && (
                      <div className="rounded-2xl border-2 bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <h3 className="font-semibold text-lg">Próximas Ações</h3>
                        </div>
                        <ul className="space-y-2">
                          {parsed.proximas_acoes.map((acao: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                              <span>{acao}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pendências */}
                    {Array.isArray(parsed?.pendencias) && parsed.pendencias.length > 0 && (
                      <div className="rounded-2xl border-2 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="w-5 h-5 text-amber-500" />
                          <h3 className="font-semibold text-lg">Pendências</h3>
                        </div>
                        <ul className="space-y-2">
                          {parsed.pendencias.map((pend: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                              <span>{pend}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Flags */}
                  {flags && (
                    <div className="rounded-2xl border-2 bg-gradient-to-br from-background to-muted/30 p-6">
                      <h3 className="font-semibold text-lg mb-4">Alertas e Indicadores</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(flags).map(([key, value]) => {
                          const hasAlert = Boolean(value);
                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                hasAlert
                                  ? 'bg-red-500/10 border-red-500/30 animate-pulse'
                                  : 'bg-green-500/5 border-green-500/20'
                              }`}
                            >
                              <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                              {hasAlert ? (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-between gap-3 px-6 py-4 border-t bg-muted/30">
              <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparando impressao...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Salvar PDF
                  </>
                )}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setParsed(null)}>
                  Nova Análise
                </Button>
                <Button onClick={handleClose} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Concluir
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

