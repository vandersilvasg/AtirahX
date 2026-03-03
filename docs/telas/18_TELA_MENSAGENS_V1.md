# 18_TELA_MENSAGENS_V1

## 1) Objetivo
Operar comunicacao omnichannel (WhatsApp + e-mail) para confirmacao, lembretes e follow-up.

## 2) Modos de Uso
- inbox operacional;
- campanhas automatizadas;
- templates.

## 3) Layout V1
## 3.1 Coluna esquerda
- caixas: pendentes, enviados, falhas, automacoes.
- filtros: canal, status entrega, medico, periodo.

## 3.2 Coluna central
- timeline de conversa por paciente.

## 3.3 Coluna direita
- dados do paciente;
- contexto de consulta;
- acoes rapidas.

## 4) Acoes V1
- enviar mensagem manual;
- usar template;
- agendar envio;
- reenviar falha;
- abrir ticket de erro de provedor.

## 5) Regras de Negocio
1. Mensagem automatica respeita idempotencia.
2. Fallback de canal quando entrega falha.
3. Consentimento de contato respeitado.

## 6) Permissoes
- recepcao/admin: operacao completa.
- gestor: leitura completa.
- medico: leitura e envio em casos relacionados.

## 7) Eventos
- `outbound_message_queued`
- `outbound_message_sent`
- `outbound_message_failed`
- `patient_replied`

## 8) Criterios de Aceite
1. Operador ve status de entrega em tempo util.
2. Falhas ficam rastreaveis com motivo tecnico.
3. Mensagens sensiveis seguem regras de permissao.
