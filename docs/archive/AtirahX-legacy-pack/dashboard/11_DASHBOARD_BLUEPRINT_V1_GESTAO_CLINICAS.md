# 11_DASHBOARD_BLUEPRINT_V1_GESTAO_CLINICAS

## 1) Objetivo do Dashboard V1
Entregar um dashboard de gestao para clinicas com foco em decisao diaria e acao rapida:
- reduzir no-show;
- aumentar comparecimento e ocupacao;
- melhorar conversao de leads;
- elevar previsibilidade de receita em 30 dias.

## 2) Principios de Produto
1. Operacao primeiro: mostrar o que precisa de acao hoje.
2. Um clique ate a acao: todo KPI deve abrir lista filtrada.
3. Contexto antes de numero: sempre exibir tendencia, meta e variacao.
4. Papel define visao: recepcao, medico e gestor veem dashboards diferentes.
5. Dados confiaveis: calculo padronizado e auditavel por tenant.

## 3) Escopo V1 (Gestor)

## 3.1 Filtros Globais (fixos no topo)
- periodo (hoje, 7d, 30d, 90d, custom);
- medico;
- unidade;
- canal de aquisicao;
- modalidade (presencial, teleconsulta).

## 3.2 Bloco A: Operacao de Hoje (cards)
- consultas hoje;
- confirmadas;
- pendentes de confirmacao;
- risco no-show alto;
- teleconsultas sem link;
- teleconsultas sem consentimento.

## 3.3 Bloco B: Performance e Receita (graficos)
- comparecimento por dia (linha);
- no-show por dia e por medico (linha + barras);
- ocupacao de agenda por medico (barras horizontais);
- receita prevista vs realizada (coluna + linha);
- funil por canal (funnel ou barras empilhadas).

## 3.4 Bloco C: Pipeline Comercial (kanban resumido)
- novos leads;
- contactados;
- agendados;
- confirmados;
- concluidos;
- perdidos.

## 3.5 Bloco D: Painel Contextual (drawer lateral)
- abre ao clicar em paciente, medico ou KPI;
- mostra timeline, proxima acao e atalhos:
`agendar`, `enviar mensagem`, `abrir prontuario`, `registrar follow-up`.

## 4) Catalogo de Graficos Prioritarios (Gestor)

| ID | Grafico | Tipo | Pergunta que responde | Formula base | Drill-down |
|---|---|---|---|---|---|
| G01 | Comparecimento diario | Linha | Estamos melhorando presenca? | concluidos / (concluidos + no_show + cancelados tardios) | lista de consultas por dia |
| G02 | No-show diario | Linha | O risco esta aumentando? | no_show / consultas agendadas | por medico e horario |
| G03 | No-show por medico | Barras | Quem precisa de suporte? | no_show_rate por doctor_id | detalhe por faixa de horario |
| G04 | Ocupacao por medico | Barras horizontais | Agenda esta subutilizada? | minutos ocupados / minutos disponiveis | slots livres por dia |
| G05 | Receita prevista vs realizada | Combo (barra+linha) | Vamos bater a meta? | soma(valor_previsto) vs soma(valor_recebido) | consulta por convenio/procedimento |
| G06 | Funil de conversao por canal | Funnel ou empilhado | Qual canal converte melhor? | lead->agendado->confirmado->concluido | lista de leads por etapa |
| G07 | Tempo medio de resposta ao lead | Linha | Atendimento comercial esta rapido? | avg(primeiro_contato - lead_created_at) | leads fora de SLA |
| G08 | Reagendamento e motivo | Barras empilhadas | O que esta gerando atrito? | count(reagendamentos) por motivo | pacientes recorrentes |
| G09 | Teleconsulta: link e consentimento | Donut + tabela | Fluxo remoto esta completo? | % com link + % consentido | pendencias por consulta |
| G10 | Receita prevista 30 dias | Area | Qual a previsao de caixa? | soma(consultas futuras * ticket) | visao por medico/canal |

## 5) KPIs Minimos do Header (com meta e variacao)
- taxa de comparecimento (%);
- taxa de no-show (%);
- confirmados/agendados (%);
- ocupacao media (%);
- receita prevista 30 dias (R$);
- tempo medio de resposta ao lead (min).

Cada KPI deve exibir:
- valor atual;
- variacao vs periodo anterior;
- meta configurada;
- status (ok, atencao, critico).

## 6) Mapa de Dados (Views SQL sugeridas)
- `vw_dash_kpi_header_daily`
- `vw_dash_attendance_trend_daily`
- `vw_dash_no_show_by_doctor`
- `vw_dash_occupancy_by_doctor_day`
- `vw_dash_revenue_forecast_vs_realized`
- `vw_dash_funnel_by_channel`
- `vw_dash_lead_response_sla`
- `vw_dash_teleconsult_compliance`

Campos base obrigatorios:
- `tenant_id`
- `unit_id` (se existir)
- `doctor_id`
- `appointment_id`
- `patient_id`
- `scheduled_start_at`
- `status`
- `mode`
- `channel`
- `amount_expected`
- `amount_paid`

## 7) Regras de Calculo (padrao unico)
1. Comparecimento:
`concluido / (concluido + no_show + cancelado_tardio)`
2. No-show:
`no_show / consultas_agendadas_validas`
3. Ocupacao:
`minutos_ocupados / minutos_disponiveis`
4. Conversao funil:
`etapa_n / etapa_n-1`
5. Receita prevista:
`sum(valor_previsto_consultas_futuras_no_periodo)`

## 8) UX e Layout (ajustes sobre o mock atual)
1. Adicionar barra de filtros globais acima dos KPIs.
2. Trocar painel lateral fixo por drawer contextual.
3. Reduzir cards de paciente na home do gestor; priorizar graficos e alertas.
4. Exibir alertas acionaveis no topo:
`N consultas sem confirmacao`, `N teleconsultas sem consentimento`.
5. Padronizar semaforo visual para KPI:
verde (ok), amarelo (atencao), vermelho (critico).

## 9) Otimizacoes Tecnicas
1. Pre-agregacao diaria por tenant para KPI e graficos historicos.
2. Cache de 5 min para graficos pesados; cards criticos em quase tempo real.
3. Virtualizacao no kanban e lazy loading no drawer lateral.
4. Indices:
`(tenant_id, scheduled_start_at)`, `(tenant_id, doctor_id, status, scheduled_start_at)`, `(tenant_id, channel, created_at)`.
5. Telemetria de uso:
evento de clique por KPI e widget para medir utilidade real.

## 10) Seguranca e LGPD no Dashboard
1. RLS em todas as consultas agregadas por `tenant_id`.
2. Gestor nao ve texto de prontuario/transcricao sensivel por default.
3. PII mascarada em telas executivas quando possivel.
4. Exportacao de dados com auditoria (`who`, `when`, `filters`).

## 11) Roadmap de Entrega

## V1.0 (1 a 2 semanas)
- filtros globais;
- 6 KPIs do header;
- G01, G02, G04, G05, G06;
- drill-down para lista filtrada.

## V1.1 (semana 3)
- G03, G07, G09;
- alertas de operacao no topo;
- drawer contextual completo.

## V1.2 (semana 4)
- G08, G10;
- metas por tenant;
- benchmarking por medico/unidade.

## 12) Criterios de Aceite
1. Gestor consegue identificar gargalo do dia em menos de 60 segundos.
2. Todos os KPIs batem com consulta SQL de validacao.
3. Cada grafico abre lista filtrada com acao operacional.
4. Tempo medio de carregamento inicial menor que 2.5s (dados cacheados).
5. Sem vazamento de dados entre tenants.
