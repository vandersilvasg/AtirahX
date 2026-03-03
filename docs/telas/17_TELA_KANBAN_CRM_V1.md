# 17_TELA_KANBAN_CRM_V1

## 1) Objetivo
Controlar funil comercial de leads ate comparecimento/conclusao, com foco em conversao e velocidade.

## 2) Colunas V1
- novos leads;
- contactados;
- qualificacao;
- agendados;
- confirmados;
- concluido;
- perdido.

## 3) Layout V1
## 3.1 Header
- busca por lead/paciente;
- filtros por canal, medico, score, periodo;
- botao `Novo lead`.

## 3.2 Board
- cards com nome, canal, score, ultima interacao, proxima acao.
- WIP limit opcional por coluna.

## 3.3 Drawer do Card
- historico de mensagens;
- observacoes;
- agenda vinculada;
- acoes sugeridas por IA.

## 4) Acoes V1
- mover etapa por drag-and-drop;
- converter lead em paciente;
- agendar consulta;
- marcar perdido com motivo;
- registrar tarefa de follow-up.

## 5) Regras de Negocio
1. Mover para `agendado` exige appointment vinculado.
2. Motivo e obrigatorio ao marcar `perdido`.
3. Lead inativo por SLA gera alerta.

## 6) Permissoes
- recepcao/admin: leitura/escrita completa.
- gestor: leitura completa e escrita configuravel.
- medico: leitura de leads relacionados ao seu atendimento.

## 7) Eventos
- `lead_created`
- `lead_status_changed`
- `lead_lost`
- `lead_converted_to_patient`

## 8) Criterios de Aceite
1. Drag-and-drop persiste status e gera evento.
2. Conversao lead->paciente preserva historico.
3. Funil por canal alimenta dashboard sem atraso relevante.
