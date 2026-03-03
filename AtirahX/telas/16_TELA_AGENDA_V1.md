# 16_TELA_AGENDA_V1

## 1) Objetivo
Operar agenda multi-medico com rapidez, evitando overbooking e reduzindo no-show.

## 2) Visoes de Calendario
- dia;
- semana;
- lista.

## 3) Layout V1
## 3.1 Header
- data atual e navegacao;
- filtro por medico/unidade/modalidade/status;
- acao `Novo agendamento`.

## 3.2 Grid de Agenda
- blocos de horario por medico;
- cores por status;
- icones para teleconsulta, consentimento e risco no-show.

## 3.3 Painel de Detalhe (drawer)
- dados da consulta;
- paciente;
- confirmacao;
- teleconsulta;
- acoes rapidas.

## 4) Acoes V1
- criar agendamento;
- confirmar/cancelar/reagendar;
- iniciar atendimento;
- concluir atendimento;
- solicitar criacao de link teleconsulta;
- solicitar consentimento.

## 5) Regras de Negocio
1. Sem overbooking em estados ativos.
2. Cancelamento tardio marcado para KPI de comparecimento.
3. Teleconsulta exige `mode=teleconsulta`.
4. Consulta concluida dispara fluxo de pos-consulta.

## 6) Permissoes
- recepcao/admin: gerencia operacao completa.
- gestor: leitura completa + acoes configuradas.
- medico: leitura propria + mudancas de atendimento propio.

## 7) APIs/RPCs Chave
- `create_appointment(...)`
- `confirm_appointment(appointment_id)`
- `set_appointment_status(appointment_id, new_status, notes)`
- `request_tele_meeting_create(appointment_id)`
- `request_teleconsult_consent(appointment_id, ...)`

## 8) Criterios de Aceite
1. Agendar consulta em ate 3 cliques.
2. Estado de consulta atualizado e auditado.
3. Overbooking bloqueado no banco.
4. Mudanca de status atualiza timeline e KPIs.
