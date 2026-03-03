# 22_BACKLOG_TECNICO_TELAS_V1

## Objetivo
Transformar os blueprints de telas em backlog tecnico executavel, com separacao por camada:
- `DATA`: SQL, views, indices, funcoes;
- `BE`: APIs, RPCs, servicos, regras;
- `FE`: tela, componentes, estados e interacoes;
- `QA`: testes funcionais, permissao, performance.

## Modulos Cobertos
- Dashboard
- Agenda
- Kanban CRM
- Pacientes
- Mensagens
- Equipe
- Acesso RBAC
- Relatorios
- Financeiro
- Configuracoes

## Fases Sugeridas
1. Fase 1 (Core Operacional): Agenda, Kanban, Pacientes, Mensagens
2. Fase 2 (Governanca): Equipe, Acesso RBAC, Configuracoes
3. Fase 3 (Inteligencia): Dashboard, Relatorios, Financeiro

## Tabela Mestre (Resumo)

| ID | Modulo | Layer | Task | Priority | SP | Depends On |
|---|---|---|---|---|---:|---|
| TB-001 | Dashboard | DATA | Criar views `vw_dash_*` para KPIs e graficos V1 | High | 8 | None |
| TB-002 | Dashboard | BE | Implementar endpoints agregados com cache e filtros globais | High | 8 | TB-001 |
| TB-003 | Dashboard | FE | Construir tela gestor com filtros, cards e graficos prioritarios | High | 8 | TB-002 |
| TB-004 | Agenda | DATA | Modelar consultas de calendario por medico/dia/semana com indices | Highest | 8 | None |
| TB-005 | Agenda | BE | Integrar RPCs de agendamento e status com regras de transicao | Highest | 8 | TB-004 |
| TB-006 | Agenda | FE | Implementar calendario com drawer de atendimento e acoes rapidas | Highest | 8 | TB-005 |
| TB-007 | Kanban CRM | DATA | Criar visao de funil por etapa/canal com SLA de lead | High | 5 | None |
| TB-008 | Kanban CRM | BE | APIs de movimentacao de etapa e conversao lead->paciente | High | 8 | TB-007 |
| TB-009 | Kanban CRM | FE | Board drag-and-drop com score e proxima acao | High | 8 | TB-008 |
| TB-010 | Pacientes | DATA | Otimizar busca por nome/telefone/documento e evitar duplicidade | High | 5 | None |
| TB-011 | Pacientes | BE | APIs de cadastro, merge e timeline de paciente | High | 8 | TB-010 |
| TB-012 | Pacientes | FE | Lista de pacientes com filtros e drawer contextual | High | 8 | TB-011 |
| TB-013 | Mensagens | DATA | Estruturar fila e status de mensagens com idempotencia | High | 8 | None |
| TB-014 | Mensagens | BE | Servico de envio omnichannel com fallback e retry | High | 8 | TB-013 |
| TB-015 | Mensagens | FE | Inbox operacional com timeline e templates | High | 8 | TB-014 |
| TB-016 | Equipe | DATA | Ajustar entidades de equipe e vinculo `profile` x `doctor` | Medium | 5 | None |
| TB-017 | Equipe | BE | APIs de convite, ativacao e capacidade operacional | Medium | 5 | TB-016 |
| TB-018 | Equipe | FE | Tela de equipe com filtros por role/status/unidade | Medium | 5 | TB-017 |
| TB-019 | Acesso RBAC | DATA | Consolidar matriz de permissao por recurso e role | Highest | 8 | None |
| TB-020 | Acesso RBAC | BE | Endpoints admin para role/politica/sessao com auditoria | Highest | 8 | TB-019 |
| TB-021 | Acesso RBAC | FE | Tela de matriz RBAC e auditoria de acesso | High | 8 | TB-020 |
| TB-022 | Relatorios | DATA | Views de comparecimento, no-show, ocupacao e conversao | High | 8 | TB-001 |
| TB-023 | Relatorios | BE | Endpoints de relatorio com exportacao CSV/PDF | High | 5 | TB-022 |
| TB-024 | Relatorios | FE | Tela de relatorios com drill-down por grafico | High | 8 | TB-023 |
| TB-025 | Financeiro | DATA | Modelo de receita prevista vs realizada e inadimplencia | High | 8 | None |
| TB-026 | Financeiro | BE | APIs de fechamento, ajustes e recebimento | High | 5 | TB-025 |
| TB-027 | Financeiro | FE | Tela financeiro com KPIs, grafico e tabela detalhada | High | 8 | TB-026 |
| TB-028 | Configuracoes | DATA | Parametrizar regras de agenda, LGPD e templates | Medium | 5 | None |
| TB-029 | Configuracoes | BE | Endpoints de configuracao versionada por tenant | Medium | 5 | TB-028 |
| TB-030 | Configuracoes | FE | Tela de configuracoes por secao com validacao inline | Medium | 5 | TB-029 |
| TB-031 | Cross | FE | Criar design system V1 (cards, tabelas, filtros, drawer) | High | 8 | None |
| TB-032 | Cross | BE | Implementar telemetria de uso por widget/tela | Medium | 5 | None |
| TB-033 | Cross | DATA | Adicionar logs/auditoria de exportacao e acoes sensiveis | High | 5 | None |
| TB-034 | Cross | QA | Suite e2e de fluxos criticos (agenda, CRM, mensagens) | High | 8 | TB-006;TB-009;TB-015 |
| TB-035 | Cross | QA | Testes de permissao por role e tenant (RLS + API) | Highest | 8 | TB-021 |
| TB-036 | Cross | QA | Teste de performance inicial (dashboard e agenda) | Medium | 5 | TB-003;TB-006 |

## Definicao de Pronto (DoD) Tecnica
1. Feature protegida por permissao backend.
2. Logs e auditoria em acoes sensiveis.
3. Teste automatizado cobrindo caso feliz e bloqueio.
4. Observabilidade minima com erros e latencia.
5. Documentacao curta de uso/manutencao.
