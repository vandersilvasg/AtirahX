# 04_SCRIPT_ANTIGRAVITY_DASHBOARD_SHORT

```text
Objetivo: implementar dashboard e telas V1 para SaaS de clinicas.

Entrada obrigatoria:
- AtirahX/dashboard/11_DASHBOARD_BLUEPRINT_V1_GESTAO_CLINICAS.md
- AtirahX/dashboard/11_DASHBOARD_GRAFICOS_KPIS_V1.csv
- AtirahX/telas/13_TELA_PACIENTES_V1.md ate AtirahX/telas/21_TELA_ACESSO_RBAC_V1.md

Plano:
1. Foundation UI (design system base).
2. Operacao (Agenda, Kanban, Pacientes, Mensagens).
3. Governanca e gestao (RBAC, Dashboard, Relatorios).

Regras:
- separar camadas ui/domain/data.
- filtros globais no dashboard.
- drill-down por KPI.
- sem hardcode de tenant.

Saida:
- codigo funcional,
- mapa de rotas,
- lista de dependencias de backend.
```
