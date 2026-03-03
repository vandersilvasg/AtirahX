# 23_BACKLOG_TECNICO_SPRINTS_EXECUCAO_V1

## Janela de Execucao
- Sprint 1: 03/03/2026 a 16/03/2026
- Sprint 2: 17/03/2026 a 30/03/2026
- Sprint 3: 31/03/2026 a 13/04/2026

## Premissa de Planejamento
- Backlog tecnico `TB-001` a `TB-036` foi fatiado para entrega MVP de operacao + gestao.
- Itens nao criticos ao MVP ficam em `Post-MVP`.

## Sprint 1 - Core Operacional + Seguranca Base (61 SP)

## Objetivo
Entregar operacao de agenda e pacientes com controle de acesso robusto.

| ID | Modulo | Layer | Task | SP | Depends On |
|---|---|---|---|---:|---|
| TB-031 | Cross | FE | Criar design system V1 compartilhado | 8 | None |
| TB-004 | Agenda | DATA | Modelar consultas de agenda por medico dia semana | 8 | None |
| TB-005 | Agenda | BE | Integrar RPCs de agendamento e status no backend | 8 | TB-004 |
| TB-006 | Agenda | FE | Implementar tela agenda com drawer operacional | 8 | TB-005 |
| TB-010 | Pacientes | DATA | Otimizar busca e deduplicacao de pacientes | 5 | None |
| TB-011 | Pacientes | BE | APIs de cadastro merge e timeline de paciente | 8 | TB-010 |
| TB-012 | Pacientes | FE | Implementar tela pacientes com filtros e drawer | 8 | TB-011 |
| TB-019 | Acesso RBAC | DATA | Consolidar matriz de permissao por recurso e role | 8 | None |
| TB-020 | Acesso RBAC | BE | Endpoints admin para roles politicas e sessao | 8 | TB-019 |

## Gate de Saida Sprint 1
1. Agenda e pacientes operando em staging.
2. RBAC base aplicado no backend.
3. Sem overbooking e sem acesso indevido entre roles.

## Sprint 2 - CRM + Mensagens + Controle de Acesso UI (69 SP)

## Objetivo
Concluir funil comercial ponta a ponta com comunicacao e governanca de acesso na interface.

| ID | Modulo | Layer | Task | SP | Depends On |
|---|---|---|---|---:|---|
| TB-007 | Kanban CRM | DATA | Criar visao de funil CRM com SLA de lead | 5 | None |
| TB-008 | Kanban CRM | BE | APIs de movimentacao de etapa e conversao lead paciente | 8 | TB-007 |
| TB-009 | Kanban CRM | FE | Implementar board kanban CRM com drag and drop | 8 | TB-008 |
| TB-013 | Mensagens | DATA | Estruturar fila de mensagens com idempotencia | 8 | None |
| TB-014 | Mensagens | BE | Servico omnichannel com fallback de canal | 8 | TB-013 |
| TB-015 | Mensagens | FE | Implementar inbox de mensagens e templates | 8 | TB-014 |
| TB-021 | Acesso RBAC | FE | Implementar tela de acesso RBAC e auditoria | 8 | TB-020 |
| TB-035 | Cross | QA | Testes de permissao por role e tenant | 8 | TB-021 |

## Gate de Saida Sprint 2
1. CRM e mensagens funcionando com eventos e auditoria.
2. Matriz de acesso visivel e coerente com backend.
3. Testes de permissao automatizados ativos.

## Sprint 3 - Gestao e Observabilidade (63 SP)

## Objetivo
Entregar dashboard e relatorios de gestao com qualidade de dados e performance inicial.

| ID | Modulo | Layer | Task | SP | Depends On |
|---|---|---|---|---:|---|
| TB-001 | Dashboard | DATA | Criar views vw_dash para KPIs e graficos V1 | 8 | None |
| TB-002 | Dashboard | BE | Implementar endpoints agregados de dashboard com cache | 8 | TB-001 |
| TB-003 | Dashboard | FE | Construir tela dashboard gestor V1 | 8 | TB-002 |
| TB-022 | Relatorios | DATA | Criar views de relatorios operacionais e comerciais | 8 | TB-001 |
| TB-023 | Relatorios | BE | Endpoints de relatorios com exportacao | 5 | TB-022 |
| TB-024 | Relatorios | FE | Implementar tela relatorios com drill down | 8 | TB-023 |
| TB-033 | Cross | DATA | Adicionar auditoria de exportacoes e acoes sensiveis | 5 | None |
| TB-034 | Cross | QA | Suite e2e de fluxos criticos operacionais | 8 | TB-006;TB-009;TB-015 |
| TB-036 | Cross | QA | Teste de performance inicial dashboard e agenda | 5 | TB-003;TB-006 |

## Gate de Saida Sprint 3
1. Gestor acompanha KPIs e graficos com drill-down.
2. Relatorios exportaveis com auditoria.
3. Performance inicial validada e suite e2e rodando.

## Post-MVP (56 SP)

## Itens Planejados para Ciclo Seguinte
| ID | Modulo | Layer | Task | SP |
|---|---|---|---|---:|
| TB-016 | Equipe | DATA | Ajustar entidades de equipe e vinculo profile doctor | 5 |
| TB-017 | Equipe | BE | APIs de convite ativacao e capacidade operacional | 5 |
| TB-018 | Equipe | FE | Implementar tela equipe com filtros por role | 5 |
| TB-025 | Financeiro | DATA | Modelar receita prevista realizada e inadimplencia | 8 |
| TB-026 | Financeiro | BE | APIs de fechamento ajustes e recebimento | 5 |
| TB-027 | Financeiro | FE | Implementar tela financeiro V1 | 8 |
| TB-028 | Configuracoes | DATA | Parametrizar regras de agenda LGPD e templates | 5 |
| TB-029 | Configuracoes | BE | Endpoints de configuracao versionada por tenant | 5 |
| TB-030 | Configuracoes | FE | Implementar tela configuracoes por secao | 5 |
| TB-032 | Cross | BE | Instrumentar telemetria de uso por widget e tela | 5 |

## Checklist de Kickoff por Sprint
1. Confirmar responsavel por task (`owner`).
2. Quebrar task em subtarefas tecnicas de ate 1 dia.
3. Definir criterio de pronto testavel por item.
4. Validar dependencias bloqueadoras antes do inicio.
