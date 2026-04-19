# 20_TELA_FINANCEIRO_V1

## 1) Objetivo
Dar previsibilidade financeira para a clinica com foco em receita futura, realizado e inadimplencia.

## 2) Blocos V1
- KPI header: previsto 30d, realizado mes, taxa de conversao financeira.
- fluxo diario: previsto x recebido.
- contas pendentes e atraso.
- ticket medio por medico/canal.

## 3) Layout V1
## 3.1 Filtros
- periodo;
- medico;
- unidade;
- canal;
- modalidade.

## 3.2 Graficos
- combo: previsto x realizado;
- barras: recebido por medico;
- barras empilhadas: status financeiro por dia.

## 3.3 Tabela
- paciente;
- consulta;
- valor previsto;
- valor recebido;
- status;
- vencimento;
- acao.

## 4) Acoes V1
- registrar recebimento;
- ajustar valor previsto;
- marcar isencao/desconto;
- exportar fechamento.

## 5) Regras de Negocio
1. Receita prevista deriva de appointments futuros validos.
2. Cancelamentos retiram valor da previsao conforme politica.
3. Alteracao manual de valor deve ser auditada.

## 6) Permissoes
- admin/gestor: visao completa.
- recepcao: leitura resumida + acoes operacionais permitidas.
- medico: sem visao financeira ampla em V1.

## 7) Criterios de Aceite
1. KPI de receita prevista bate com soma da tabela filtrada.
2. Historico de alteracao financeira auditado.
3. Relatorio exportado respeita filtros e tenant.
