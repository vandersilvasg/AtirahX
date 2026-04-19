# 01_SCRIPT_CURSOR_DASHBOARD

## Uso
Cole o prompt abaixo no Cursor Agent dentro do repositorio `Sistema OS`.

```text
Voce e um engenheiro senior e vai implementar o dashboard completo do SaaS de clinicas.

Contexto (arquivos obrigatorios):
- AtirahX/dashboard/11_DASHBOARD_BLUEPRINT_V1_GESTAO_CLINICAS.md
- AtirahX/dashboard/11_DASHBOARD_GRAFICOS_KPIS_V1.csv
- AtirahX/telas/12_TELAS_V1_INDEX.md
- AtirahX/telas/13_TELA_PACIENTES_V1.md
- AtirahX/telas/14_TELA_RELATORIOS_V1.md
- AtirahX/telas/15_TELA_CONFIGURACOES_V1.md
- AtirahX/telas/16_TELA_AGENDA_V1.md
- AtirahX/telas/17_TELA_KANBAN_CRM_V1.md
- AtirahX/telas/18_TELA_MENSAGENS_V1.md
- AtirahX/telas/19_TELA_EQUIPE_V1.md
- AtirahX/telas/20_TELA_FINANCEIRO_V1.md
- AtirahX/telas/21_TELA_ACESSO_RBAC_V1.md

Objetivo:
Implementar um dashboard e as telas operacionais V1 com foco em:
1) operacao diaria (agenda, confirmacao, no-show),
2) gestao (kpis, graficos, relatorios),
3) seguranca (RBAC e tenant isolation).

Requisitos tecnicos:
- Next.js + TypeScript.
- UI responsiva desktop/mobile.
- Camada de dados desacoplada com hooks/servicos.
- Filtros globais (periodo, medico, unidade, canal, modalidade).
- Drill-down de KPI para lista filtrada.
- Estados loading/empty/error em todas telas.
- Componentizacao forte: cards, tabelas, graficos, drawer, filtros.
- Nao quebrar RLS e politicas de backend.

Escopo minimo de entrega:
1) Dashboard gestor com KPIs + G01 G02 G04 G05 G06.
2) Tela Agenda V1.
3) Tela Kanban CRM V1.
4) Tela Pacientes V1.
5) Tela Mensagens V1.
6) Tela Relatorios V1.
7) Tela Acesso RBAC V1.

Entregaveis:
- codigo funcional.
- rotas de cada tela.
- componentes reutilizaveis.
- stubs de dados/servicos quando API ainda nao existir.
- TODOs claros para gaps de backend.

Criterios:
- sem erros de typecheck.
- sem regressao de navegacao.
- sem hardcode de tenant.
- estrutura pronta para evoluir para dados reais.

Agora:
1) leia os arquivos citados,
2) proponha plano curto,
3) implemente em lotes pequenos,
4) rode checks basicos,
5) entregue resumo com arquivos alterados.
```
