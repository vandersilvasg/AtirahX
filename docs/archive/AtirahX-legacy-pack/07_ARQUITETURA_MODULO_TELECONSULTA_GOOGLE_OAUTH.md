# 07_ARQUITETURA_MODULO_TELECONSULTA_GOOGLE_OAUTH.md

## 1) Objetivo
Adicionar teleconsulta com Google Calendar/Meet, consentimento LGPD para gravação (apenas para transcrição), transcrição e resumo IA, mantendo multi-tenant, RLS e event-driven.

---

## 2) Componentes
- **App (Next.js)**: UI de agendamento, confirmação, teleconsulta, consentimento, prontuário.
- **Supabase**: Auth, Postgres, RLS, RPCs, Storage (opcional), Edge Functions (opcional).
- **n8n/Worker**: integrações externas e processamento assíncrono.
- **Google APIs**: OAuth 2.0, Calendar API (criação/atualização de eventos), Meet link.
- **Transcrição/IA**: Whisper/Gemini/Claude (via API) para transcrição e resumo.
- **E-mail**: SMTP/SendGrid/Mailgun (envio do resumo ao paciente).

---

## 3) Google OAuth por médico (modelo recomendado)
### 3.1 Fluxo
1. Médico clica “Conectar Google”.
2. Backend inicia OAuth com escopos mínimos:
   - Calendar: `https://www.googleapis.com/auth/calendar.events` (ideal)
3. Google retorna `code` → backend troca por `access_token` e `refresh_token`.
4. Salvar `refresh_token` (protegido) associado ao `doctor_id` e `tenant_id`.

### 3.2 Armazenamento seguro do token
Opções (em ordem):
1. Guardar token em **Vault/KMS** e só armazenar referência no DB.
2. Guardar token criptografado no DB (chave fora do DB).
3. (mínimo) guardar token no DB com RLS estrita e acesso via service role.

---

## 4) Criação do Meeting (quando CONFIRMAR)
### 4.1 Gatilho
- Evento `appointment_confirmed` → `tele_meeting_create_requested` (somente se appointment.mode=teleconsulta).

### 4.2 Worker/n8n
- Recupera integração do médico (refresh token).
- Cria evento no Calendar com:
  - summary: “Teleconsulta – {Paciente}”
  - start/end
  - attendees (opcional)
  - conferenceData (para gerar Meet link)
- Salva:
  - `google_event_id`
  - `meet_link`
  - `provider` = google_meet
- Emite evento `tele_meeting_created`.

---

## 5) Consentimento LGPD
### 5.1 Princípio
Gravar **somente** para gerar transcrição/resumo. Consentimento explícito.

### 5.2 Fluxo
- Médico aciona “Solicitar consentimento” (UI).
- Sistema envia ao paciente (WhatsApp/e-mail/app) uma mensagem com:
  - motivo
  - o que será feito
  - retenção (ex.: 90 dias)
  - CTA Aceitar/Recusar
- Registrar resposta em `teleconsult_consents` e emitir:
  - `tele_consent_accepted` ou `tele_consent_declined`

---

## 6) Transcrição + Resumo
### 6.1 Gatilho
- Appointment status -> `concluido`
- E consentimento aceito
- Emitir `transcription_requested`

### 6.2 Worker
- Obtém áudio (origem: upload, provider, drive, ou gravação do provedor)
- Processa transcrição (Whisper)
- Gera:
  - `transcript_text` (imutável)
  - `structured_summary` (JSON clínico)
  - `patient_summary` (linguagem simples)
- Salva em `appointment_transcripts`
- Emite `transcription_ready`
- Envia e-mail ao paciente com `patient_summary`
- Emite `patient_summary_sent`

### 6.3 Revisão pelo médico
- Médico vê transcrição e resumo, pode ajustar **apenas** summaries.
- Versão revisada pode ser salva em campos separados ou auditada (recomendado).

---

## 7) Observabilidade
- Todos os passos geram `system_events` com idempotência.
- `audit_logs` para ações sensíveis (consentimento, leitura de transcrição, envio de resumo).

---

## 8) Segurança
- RLS estrita em integrações e transcrições.
- Tokens protegidos.
- Bloquear update de `transcript_text` por usuários.
- Retenção configurável para transcrição/gravação.

---

## 9) Workflows mínimos (V1)
1. `tele_meeting_create_on_confirmed`
2. `tele_send_link_on_confirmed`
3. `tele_day0_reminders_with_link`
4. `tele_consent_request_and_capture`
5. `tele_transcription_and_patient_summary_email`
