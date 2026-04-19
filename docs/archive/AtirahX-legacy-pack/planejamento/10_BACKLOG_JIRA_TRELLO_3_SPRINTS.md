# 10_BACKLOG_JIRA_TRELLO_3_SPRINTS

## Uso Rapido
1. Use este arquivo para priorizacao e planejamento semanal.
2. Use o CSV correspondente para importar no Jira ou Trello.
3. IDs `BK-xxx` devem ser mantidos para rastreabilidade.

## Sprint 1 (03/03/2026 a 16/03/2026) - Foundation and Security

| ID | Card Title | Type | Priority | Story Points | Dependencies | Labels | Definition of Done |
|---|---|---|---|---:|---|---|---|
| BK-001 | Apply migration 010 in staging and validate hardening | Task | Highest | 5 | None | sprint1,security,supabase | Migration applied, smoke checks green, rollback script documented |
| BK-002 | Create automated RLS matrix tests by role | Story | Highest | 8 | BK-001 | sprint1,security,tests,rls | Tests cover admin/gestor/recepcao/medico and block unauthorized paths |
| BK-003 | Implement entitlements schema for Core Growth Premium | Story | Highest | 8 | None | sprint1,billing,entitlements,backend | Tables/config exist and each tenant resolves active entitlements |
| BK-004 | Enforce feature gates in backend APIs and RPCs | Story | Highest | 8 | BK-003 | sprint1,backend,entitlements,api | Blocked features return deterministic error and are audited |
| BK-005 | Build resilient event processor with retry and DLQ | Epic | Highest | 13 | BK-001 | sprint1,events,reliability,n8n | Failed events retry with backoff and dead-letter queue stores terminal failures |
| BK-006 | Standardize idempotency keys across workflows | Task | High | 5 | BK-005 | sprint1,events,idempotency | Duplicate events do not create duplicated side effects |
| BK-007 | Configure dev staging prod with migration pipeline | Story | High | 8 | None | sprint1,devops,environments | Same migration set runs in all environments with documented promote flow |
| BK-008 | Create CI pipeline for SQL tests and policy regression | Story | High | 8 | BK-002,BK-007 | sprint1,ci,sql,quality | CI runs migrations and security tests on each pull request |

## Sprint 2 (17/03/2026 a 30/03/2026) - Product and Conversion

| ID | Card Title | Type | Priority | Story Points | Dependencies | Labels | Definition of Done |
|---|---|---|---|---:|---|---|---|
| BK-009 | Build patient portal V1 with secure access links | Story | Highest | 8 | BK-004 | sprint2,portal,patient,frontend | Patient can open appointment details with secure signed access |
| BK-010 | Implement confirm and reschedule APIs + UI flow | Story | Highest | 8 | BK-009 | sprint2,appointments,portal,api | Patient confirms or reschedules and status/event trail is consistent |
| BK-011 | Add teleconsult consent request and capture UI flow | Story | Highest | 8 | BK-009 | sprint2,teleconsult,consent,lgpd | Consent status transitions are auditable end to end |
| BK-012 | Implement D-0 reminder engine with channel fallback | Epic | High | 13 | BK-005,BK-010 | sprint2,notifications,automation | Reminders send on schedule and fallback channel triggers on provider failure |
| BK-013 | Create no-show score v1 and assisted action rules | Story | High | 8 | BK-012 | sprint2,noshow,ops,analytics | Risk score appears before appointment and action suggestions are logged |
| BK-014 | Launch reengagement automations for no-show and inactive | Story | High | 8 | BK-013 | sprint2,retention,campaigns | Campaign runs idempotently and updates journey status |
| BK-015 | Deliver funnel dashboard by acquisition channel | Story | High | 8 | BK-010 | sprint2,metrics,funnel,bi | Dashboard shows lead->booking->attendance conversion by channel |
| BK-016 | Implement LGPD retention jobs for consent and transcripts | Story | Highest | 8 | BK-011 | sprint2,lgpd,data-retention,compliance | Expired sensitive data is marked and processed per retention policy |

## Sprint 3 (31/03/2026 a 13/04/2026) - Go Live and Initial Scale

| ID | Card Title | Type | Priority | Story Points | Dependencies | Labels | Definition of Done |
|---|---|---|---|---:|---|---|---|
| BK-017 | Build pilot clinic onboarding playbook and checklist | Story | Highest | 8 | BK-010,BK-015 | sprint3,onboarding,operations | New clinic can be onboarded in 5 business days with repeatable checklist |
| BK-018 | Create incident runbooks for OAuth messaging transcription | Story | High | 5 | BK-005 | sprint3,reliability,runbook,support | Each critical incident has steps, owner, SLA and escalation path |
| BK-019 | Add recurring billing and dunning flow baseline | Epic | High | 13 | BK-003 | sprint3,billing,subscriptions,revenue | Subscription lifecycle works and failed payment triggers dunning stages |
| BK-020 | Add AI governance logs prompt version and per-visit cost | Story | High | 8 | BK-016 | sprint3,ai,governance,cost | Each transcript summary stores model, prompt version and token cost |
| BK-021 | Build KPI cockpit for North Star and operations | Story | High | 8 | BK-015 | sprint3,metrics,executive,dashboard | Weekly cockpit shows attendance, no-show, forecast and workflow SLA |
| BK-022 | Execute pilot hardening bug bash and fix criticals | Task | Highest | 8 | BK-017,BK-021 | sprint3,qa,hardening,pilot | All P0/P1 bugs found in pilot are fixed or waived with explicit owner/date |
| BK-023 | Define support N1 process and handoff artifacts | Task | Medium | 5 | BK-018 | sprint3,support,process | N1 support script, triage flow and escalation templates are documented |
| BK-024 | Run 7-day assisted pilot and close go-live report | Task | Highest | 8 | BK-022,BK-023 | sprint3,go-live,pilot,report | Pilot runs 7 days without severe blocker and final report approved |

## Recommended Jira Mapping
1. `Card Title` -> `Summary`
2. `Type` -> `Issue Type`
3. `Priority` -> `Priority`
4. `Story Points` -> `Story Points`
5. `Labels` -> `Labels`
6. `Dependencies` -> `Linked Issues`
7. `Definition of Done` -> `Acceptance Criteria`

## Recommended Trello Mapping
1. `Sprint` -> `List`
2. `Card Title` -> `Card Name`
3. `Definition of Done` -> `Description`
4. `Labels` -> `Labels`
5. `Story Points` -> custom field `SP`
