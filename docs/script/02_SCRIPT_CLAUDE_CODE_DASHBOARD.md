# 02_SCRIPT_CLAUDE_CODE_DASHBOARD

## Uso
Cole no Claude Code/Claude Desktop com acesso ao repositorio local.

```text
Atue como arquiteto + implementador full-stack.
Implemente o dashboard completo do SaaS de clinicas com base nos arquivos abaixo:

- docs/dashboard/11_DASHBOARD_BLUEPRINT_V1_GESTAO_CLINICAS.md
- docs/dashboard/11_DASHBOARD_GRAFICOS_KPIS_V1.csv
- docs/telas/12_TELAS_V1_INDEX.md
- docs/telas/13_TELA_PACIENTES_V1.md ate docs/telas/21_TELA_ACESSO_RBAC_V1.md

Instrucoes:
1. Leia os docs primeiro e gere um plano de implementacao em etapas.
2. Priorize telas: Agenda -> Kanban CRM -> Pacientes -> Mensagens -> RBAC -> Dashboard -> Relatorios.
3. Mantenha componente reutilizavel para cards, filtros, tabelas, drawer e graficos.
4. Adote convencoes:
   - tipagem forte,
   - sem hardcode de tenant,
   - separacao UI x dados x regras.
5. Inclua fallback de dados mock para rodar sem backend completo.

Escopo minimo:
- Dashboard gestor V1 com KPIs e graficos prioritarios.
- Agenda V1 operacional.
- Kanban CRM V1 com movimentacao.
- Pacientes V1 com busca e detalhe.
- Mensagens V1 com inbox.
- Relatorios V1 com drill-down.
- Acesso RBAC V1 (matriz visual + auditoria UI).

Qualidade:
- loading/empty/error em todas telas.
- responsivo desktop/mobile.
- logs/telemetria basica de interacao por widget.
- sem quebrar regras de seguranca existentes.

Saida esperada:
- codigo implementado no repositorio,
- lista de arquivos alterados,
- checklist do que ficou pendente para backend real.
```
