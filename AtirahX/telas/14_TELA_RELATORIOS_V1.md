# 14_TELA_RELATORIOS_V1

## 1) Objetivo
Oferecer visao analitica para tomada de decisao semanal e mensal por gestor e admin.

## 2) Modulos de Relatorio V1
- comparecimento e no-show;
- ocupacao e agenda;
- conversao comercial por canal;
- receita prevista vs realizada;
- performance por medico.

## 3) Layout V1
## 3.1 Filtros Globais
- periodo;
- unidade;
- medico;
- canal;
- modalidade (presencial/teleconsulta).

## 3.2 Area de Graficos
- grade responsiva com 2 colunas desktop e 1 coluna mobile.

## 3.3 Tabela de Detalhe
- lista vinculada ao grafico selecionado (drill-down).

## 4) Graficos Minimos
- linha: comparecimento diario;
- linha: no-show diario;
- barras: no-show por medico;
- barras: ocupacao por medico;
- combo: receita prevista vs realizada;
- funil: lead -> agendado -> confirmado -> concluido.

## 5) Exportacao
- CSV e PDF com filtros aplicados.
- log em `audit_logs` com usuario, horario e filtros.

## 6) Permissoes
- gestor/admin: acesso total.
- recepcao: versao resumida sem dados financeiros sensiveis.
- medico: visao propria (somente seus indicadores).

## 7) APIs/Vistas Sugeridas
- `vw_dash_kpi_header_daily`
- `vw_dash_attendance_trend_daily`
- `vw_dash_no_show_by_doctor`
- `vw_dash_revenue_forecast_vs_realized`
- `vw_dash_funnel_by_channel`

## 8) Criterios de Aceite
1. Todos os graficos possuem drill-down.
2. Filtros globais afetam 100% dos widgets.
3. Exportacao respeita RLS.
4. Valores batem com consultas SQL de validacao.
