# 09_PLANO_EXECUCAO_6_SEMANAS_SAAS_CLINICAS

## Janela de Execucao
- Inicio: 03/03/2026
- Fim: 13/04/2026
- Estrutura: 3 sprints de 2 semanas

## Objetivo do Ciclo
Sair de arquitetura/documentacao para operacao validada com clinica piloto, com base segura (RBAC/RLS/LGPD), automacoes confiaveis e primeiros motores de crescimento.

## Resultado Esperado em 6 Semanas
- Banco e seguranca endurecidos para producao inicial.
- Fluxo principal operando ponta a ponta: lead -> agendamento -> confirmacao -> atendimento -> pos-consulta.
- Teleconsulta funcionando com consentimento auditavel e trilha de eventos.
- Entitlements por plano (Core/Growth/Premium) aplicados no backend.
- Observabilidade minima com alertas de falha operacional.
- 1 clinica piloto ativa com playbook de onboarding.

## Premissas
- Stack: Next.js + Supabase + n8n/worker.
- Time minimo: 1 dev full-stack + 1 suporte operacional (part-time) + founder.
- Escopo comercial inicial: 1 a 3 clinicas piloto.

## Sprint 1 (03/03/2026 a 16/03/2026) - Fundacao e Risco Zero

## Prioridade
P0 tecnico e seguranca.

## Entregaveis
1. Aplicar e validar `010_security_hardening_v2_teleconsulta.sql`.
2. Entitlements por plano no backend:
`core_features`, `growth_features`, `premium_features`.
3. Pipeline assincrono robusto:
`system_events` com processamento, retry, idempotencia e status claro.
4. Estrutura de ambientes:
`dev`, `staging`, `prod` com migracoes versionadas.
5. CI minimo:
lint + migracoes + testes de permissao SQL.
6. Observabilidade base:
logs estruturados, dashboard de erro por workflow, alertas por falha critica.

## Criterios de Aceite
1. Nenhum usuario sem permissao consegue alterar consentimento de outro atendimento.
2. Sem overbooking concorrente em carga simulada.
3. Feature bloqueada quando plano nao permite, inclusive via API.
4. Falhas de automacao entram em retry e ficam rastreaveis.
5. Deploy em `staging` reproduzivel com 1 comando/documento.

## Sprint 2 (17/03/2026 a 30/03/2026) - Operacao de Clinica e Conversao

## Prioridade
P1 produto com impacto em comparecimento/receita.

## Entregaveis
1. Portal do paciente V1:
confirmar, reagendar, receber link teleconsulta, consentir gravacao.
2. Motor de no-show:
lembretes D-0 por canal e janela, com fallback automatico.
3. Reengajamento automatico:
fluxo de pacientes no-show e inativos.
4. Funil comercial operacional:
leads por canal, taxa de agendamento, taxa de comparecimento.
5. LGPD operacional:
job de expiracao/retencao para consentimentos, transcricoes e anexos conforme regra.

## Criterios de Aceite
1. Paciente confirma ou reage agenda sem acao manual da recepcao.
2. Dashboard mostra conversao por canal (lead -> agendamento -> comparecimento).
3. Campanha automatica de reengajamento roda com idempotencia.
4. Dados vencidos sao marcados para expurgo automaticamente.

## Sprint 3 (31/03/2026 a 13/04/2026) - Go-Live Controlado e Escala Inicial

## Prioridade
P1/P2 de go-to-market com confiabilidade.

## Entregaveis
1. Onboarding de clinica piloto:
playbook de implantacao em 5 dias.
2. Monitoramento de negocio:
North Star, no-show, ocupacao, receita prevista 30 dias.
3. Gestao de incidentes:
runbook de falhas (OAuth, mensagens, transcricao, consentimento).
4. Base de billing e cobranca:
assinatura, falha de pagamento, notificacao e grace period.
5. Governance de IA V1:
versionar prompt de resumo, registrar custo por consulta e taxa de revisao medica.

## Criterios de Aceite
1. 1 clinica piloto operando o fluxo completo por 7 dias sem bloqueio severo.
2. SLA interno de automacoes criticas >= 99% no periodo.
3. Fechamento semanal com metricas de negocio e plano de melhoria.
4. Processo de suporte documentado para primeiro atendimento (N1).

## Backlog Priorizado por Impacto

## P0 (fazer no ciclo de 6 semanas)
1. Hardening SQL/RLS/RPC.
2. Entitlements por plano no backend.
3. Pipeline assincrono resiliente.
4. Observabilidade + alertas.
5. LGPD operacional (retencao/expurgo).

## P1 (entrar no Sprint 2 e 3)
1. Portal do paciente V1.
2. Motor de no-show e lembretes inteligentes.
3. Reengajamento automatico.
4. Funil de conversao com dashboards.
5. Onboarding piloto padronizado.

## P2 (proximo ciclo)
1. Multiunidade com permissao por unidade.
2. Governanca avancada de IA (A/B de prompt e qualidade clinica).
3. Conectores ERP/TISS/financeiro.
4. BI avancado de cohort/LTV.

## KPIs do Ciclo (acompanhar semanalmente)
1. Taxa de comparecimento (%).
2. No-show (%).
3. Confirmados/agendados (%).
4. Lead -> agendamento (%).
5. Tempo medio de resposta ao lead.
6. Receita prevista 30 dias.
7. Erro de workflow critico (%).
8. Tempo medio de recuperacao de falha (MTTR).

## Riscos e Mitigacoes
1. Dependencia de integracoes externas (Google, WhatsApp, e-mail).
Mitigacao: retries, fallback de canal, alertas proativos.
2. Complexidade de permissao multi-tenant.
Mitigacao: testes automatizados de RLS por role em CI.
3. Custo de IA por consulta.
Mitigacao: teto por tenant, logs de custo, resumo apenas quando elegivel por plano.
4. Atraso na adocao da clinica.
Mitigacao: onboarding guiado + material operacional objetivo.

## Plano de Execucao Semanal (Resumo)
1. Semana 1: seguranca e migracoes finais.
2. Semana 2: entitlements + pipeline assincrono + CI.
3. Semana 3: portal paciente V1 e fluxos de confirmacao/reagendamento.
4. Semana 4: reengajamento + dashboard de funil + LGPD jobs.
5. Semana 5: onboarding piloto + billing base + runbooks.
6. Semana 6: operacao assistida da clinica piloto + ajustes finais + handoff.

## Definicao de Pronto (DoD)
1. Feature com validacao de permissao em backend.
2. Evento auditavel em operacoes sensiveis.
3. Logs estruturados e monitoramento minimo ativo.
4. Teste automatizado cobrindo caso feliz e caso de bloqueio.
5. Documentacao operacional curta para suporte/implantacao.
