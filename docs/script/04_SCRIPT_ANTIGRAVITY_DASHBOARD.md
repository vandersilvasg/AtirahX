# 04_SCRIPT_ANTIGRAVITY_DASHBOARD

## Uso
Use como prompt de execucao no fluxo agentic do Antigravity.

```text
Objetivo: construir dashboard V1 completo para SaaS de clinicas, com foco em operacao e gestao.

Leia e aplique como especificacao:
- docs/dashboard/11_DASHBOARD_BLUEPRINT_V1_GESTAO_CLINICAS.md
- docs/dashboard/11_DASHBOARD_GRAFICOS_KPIS_V1.csv
- docs/telas/12_TELAS_V1_INDEX.md
- docs/telas/13_TELA_PACIENTES_V1.md ate docs/telas/21_TELA_ACESSO_RBAC_V1.md
- docs/planejamento/23_BACKLOG_TECNICO_SPRINTS_EXECUCAO_V1.md

Plano de execucao:
Fase A) Foundation UI
- criar design system de cards/tabelas/filtros/drawer/graficos.

Fase B) Operacao
- Agenda V1
- Kanban CRM V1
- Pacientes V1
- Mensagens V1

Fase C) Governanca e Gestao
- RBAC V1
- Dashboard Gestor V1
- Relatorios V1

Padrao obrigatorio:
- camadas separadas: ui, domain, data.
- componentes reutilizaveis.
- filtros globais no dashboard.
- drill-down por KPI.
- estados loading/empty/error.
- sem hardcode de tenant.

Entregaveis:
1) codigo implementado.
2) mapa de rotas.
3) lista de contratos API esperados.
4) lista de gaps para backend.
```
