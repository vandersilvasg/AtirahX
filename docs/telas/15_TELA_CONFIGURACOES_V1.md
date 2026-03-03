# 15_TELA_CONFIGURACOES_V1

## 1) Objetivo
Centralizar configuracoes operacionais e de negocio por tenant.

## 2) Secoes V1
- perfil da clinica;
- horarios e regras de agenda;
- templates de mensagens;
- canais e integracoes;
- teleconsulta;
- politicas LGPD;
- metas e alertas.

## 3) Layout V1
## 3.1 Navegacao lateral por secao
- Perfil
- Agenda
- Mensagens
- Integracoes
- Teleconsulta
- LGPD
- Metas

## 3.2 Painel de formulario por secao
- campos agrupados;
- validacao inline;
- historico de alteracoes relevantes.

## 4) Regras de Negocio
1. Mudancas em templates nao afetam mensagens ja enfileiradas.
2. Regras de tolerancia no-show impactam somente novos agendamentos.
3. Retencao LGPD deve ter limites minimos e maximos definidos.

## 5) Permissoes
- admin: leitura/escrita total.
- gestor: leitura total; escrita parcial configuravel.
- recepcao/medico: leitura limitada.

## 6) Integracoes V1
- Google Calendar/Meet por medico.
- provedores de WhatsApp e e-mail.
- webhooks de eventos.

## 7) Eventos
- `settings_updated`
- `message_template_updated`
- `tele_integration_updated`
- `lgpd_policy_updated`

## 8) Criterios de Aceite
1. Configuracao salva com validacao e feedback claro.
2. Todas alteracoes relevantes possuem trilha de auditoria.
3. Sem acesso indevido por perfil.
