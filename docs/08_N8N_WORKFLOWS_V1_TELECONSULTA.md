# 08_N8N_WORKFLOWS_V1_TELECONSULTA.md

> Formato: descrição + idempotência + nós sugeridos (para você montar no n8n).

---

## WF1 — tele_meeting_create_on_confirmed
**Objetivo:** Ao confirmar uma consulta `mode=teleconsulta`, criar evento no Google Calendar e salvar link Meet.

**Trigger**
- Poll/Trigger no DB: `system_events` onde `event_type = appointment_confirmed` (ou webhook do Supabase)

**Passos**
1. Buscar appointment + doctor_id + paciente + horários
2. Checar `mode = teleconsulta`
3. Buscar integração do médico (refresh token)
4. Criar evento no Google Calendar (Calendar API)
5. Extrair `google_event_id` e `meet_link`
6. Upsert em `teleconsult_meetings`
7. Atualizar `appointments.teleconsultation_link` (opcional)
8. Emitir `system_events`: `tele_meeting_created` com idempotency_key `tele_meet:{appointment_id}`

**Idempotência**
- `teleconsult_meetings` unique(tenant_id, appointment_id)
- `system_events` unique(tenant_id, idempotency_key)

---

## WF2 — tele_send_link_on_confirmed
**Objetivo:** enviar mensagem (WhatsApp/email) com link da teleconsulta após meeting criado.

**Trigger**
- `system_events` onde `event_type = tele_meeting_created`

**Passos**
1. Buscar appointment + paciente + meet_link
2. Montar template (confirm + link + instruções)
3. Enviar WhatsApp (provider) + e-mail (opcional)
4. Registrar `outbound_message` (se existir) e/ou log
5. Emitir `appointment_notification` type `on_time`? (opcional)

---

## WF3 — tele_day0_reminders_with_link
**Objetivo:** D-0 lembretes com link (manhã/1h/na hora) para teleconsulta confirmada.

**Trigger**
- Agendador (cron) a cada 5 min consultando `appointment_notifications` pendentes

**Passos**
1. Buscar notification pendente
2. Buscar appointment + meet_link
3. Se appointment cancelado/concluido: marcar notification como cancelada/skip
4. Enviar lembrete
5. Atualizar status `sent/delivered/failed`

**Idempotência**
- `appointment_notifications` unique(appointment_id, type)

---

## WF4 — tele_consent_request_and_capture
**Objetivo:** Solicitar consentimento de gravação e registrar resposta.

**Trigger**
- `system_events` `tele_consent_requested` OU ação do usuário (botão) chamando RPC que insere evento

**Passos**
1. Criar registro em `teleconsult_consents` com status `pending`
2. Enviar mensagem ao paciente:
   - motivo, uso, retenção, CTA Aceitar/Recusar
3. Receber resposta (webhook provider)
4. Atualizar consent: `accepted/declined`
5. Emitir `tele_consent_accepted` ou `tele_consent_declined`

---

## WF5 — tele_transcription_and_patient_summary_email
**Objetivo:** Após consulta concluída e consentimento aceito, processar transcrição, gerar resumo e enviar e-mail.

**Trigger**
- `system_events` `appointment_status_changed` com `to=concluido`

**Pré-condições**
- appointment.mode=teleconsulta
- consent = accepted

**Passos**
1. Obter áudio (upload/provider) — V1 pode ser upload manual do áudio no Storage
2. Transcrever (Whisper/Gemini)
3. Gerar `structured_summary` e `patient_summary`
4. Inserir em `appointment_transcripts`
5. Enviar e-mail ao paciente com `patient_summary`
6. Emitir `transcription_ready` e `patient_summary_sent`

**Idempotência**
- unique(tenant_id, appointment_id) em `appointment_transcripts`
- idempotency_key `transcript:{appointment_id}`
