# 02_PRD_GROWTH_OS_V1_COM_TELECONSULTA

## 1) Visão
Construir o **Growth OS para Clínicas**: um SaaS multi-tenant que estrutura a jornada do paciente (Aquisição → Conversão → Comparecimento → Retenção), reduz no-show e cria previsibilidade operacional e de receita.

## 2) ICP
Clínicas com faturamento **R$100k+/mês**, com tráfego pago, operação com secretária e dores de previsibilidade/no-show.

## 3) North Star
**Taxa de comparecimento (%)** + **Receita prevista 30 dias**.

## 4) Problemas (top)
- 40–60% leads não respondidos
- 70% fora do horário comercial
- No-show 30–40%
- CAC desperdiçado (baixa conversão/confirm)
- Agenda imprevisível
- Sem CRM/Follow-up/Métricas

## 5) Escopo V1 (MVP escalável)
### Core
- Multi-tenant + RBAC (admin/gestor/recepcao/medico)
- CRM Kanban (LEADS → … → RETENÇÃO)
- Agenda multi-médico
- Agendamento + confirmação (até 3 tentativas)
- Cancelamento por não confirmação
- Lista de espera (hold + expiração + repasse)
- Lembretes D-0 (manhã/1h/na hora)
- No-show: tolerância + ação assistida
- Prontuário V1 (médico)
- Follow-up pós consulta + retenção (templates)
- Relatórios essenciais (comparecimento, no-show, ocupação, receita prevista)

### Teleconsulta (módulo ativável por plano)
- Seleção de modalidade: **presencial** ou **teleconsulta**
- Integração com **Google Calendar** por médico
- Criação automática de evento + **Google Meet link**
- Envio do link na confirmação e lembretes
- **Consentimento** para gravação (apenas para transcrição/resumo)
- Transcrição + resumo IA (pipeline) e envio de resumo ao paciente por e-mail

### Ads (opcional por plano)
- Conectar Meta/Google (fase posterior)
- Trazer métricas e sugestões IA (somente sugestão)

## 6) Fora de escopo (V1)
- Sala própria WebRTC (white-label)
- Cobrança/assinaturas dentro do produto (pode integrar depois)
- BI avançado (coorte, LTV detalhado)
- Integração profunda com ERPs legados (somente via API genérica V1)
- White-label completo

## 7) Fluxos principais
### 7.1 Lead → Agendamento
- Lead entra via WhatsApp/LeadAds/Landing/Manual
- Qualifica
- Agenda
- Envia confirmação
- Confirma ou cancela + waitlist

### 7.2 Teleconsulta
- Agendamento com `mode=teleconsulta`
- Ao confirmar: criar evento Google + salvar link
- Consentimento: aceitar/recusar gravação para transcrição
- Pós: transcrição + resumo → médico revisa → paciente recebe resumo por e-mail

## 8) Requisitos não-funcionais
- LGPD: consentimento, auditoria, retenção
- Segurança: RLS em todas tabelas; tokens protegidos
- Performance: índices por tenant/doctor/status/time
- Observabilidade: logs + event bus + idempotência
- Internacionalização futura: locale/timezone por tenant

## 9) Eventos canônicos (Event Bus)
- `lead_created`
- `lead_qualified`
- `appointment_created`
- `appointment_confirmed`
- `appointment_status_changed`
- `appointment_cancelled_no_confirmation`
- `waitlist_slot_opened`
- `waitlist_slot_offered`
- `tele_meeting_create_requested`
- `tele_meeting_created`
- `tele_consent_requested`
- `tele_consent_accepted`
- `tele_consent_declined`
- `transcription_requested`
- `transcription_ready`
- `patient_summary_sent`

## 10) Telas V1
- Dashboard (widgets)
- CRM Kanban
- Agendamentos (calendário + lista)
- Detalhe do Paciente
- Waitlist
- No-show
- Prontuário
- Relatórios
- Configurações (regras, templates, usuários)
- Teleconsulta (status + link + consent + transcrição/resumo)

## 11) Métricas
- Comparecimento % (por médico/canal)
- No-show %
- Confirmados/Agendados
- Tempo médio de resposta lead
- Ocupação agenda
- Receita prevista 30 dias
- Taxa de reaproveitamento de waitlist
- Taxa de reagendamento pós no-show
