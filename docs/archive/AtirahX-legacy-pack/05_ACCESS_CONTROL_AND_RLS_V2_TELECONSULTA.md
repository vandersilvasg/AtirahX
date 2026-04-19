# 05_ACCESS_CONTROL_AND_RLS_V2_TELECONSULTA

## Objetivo
Definir o modelo de acesso (RBAC) e as regras de segurança (RLS) para o Growth OS Clínicas, incluindo o módulo de Teleconsulta (Google Calendar/Meet), consentimento de gravação para transcrição e geração de resumo.

---

## 1) Princípios
1. **Isolamento por tenant é absoluto** (multi-tenant).
2. **RBAC simples com enforcement forte**: `admin`, `gestor`, `recepcao`, `medico`.
3. **Dado sensível (LGPD)**: prontuário, transcrição, gravação e consentimento.
4. **Automação e IA não “furam” RLS**: operam via **Service Role** e/ou **RPCs** com validação + auditoria.
5. **Idempotência**: tentativas, lembretes, eventos, meetings e transcrições com chaves únicas.

---

## 2) Roles (RBAC)
- **admin**: controle total do tenant (configurações, usuários, integrações, relatórios). Acesso de leitura aos dados sensíveis (opcional) e auditado.
- **gestor**: visão operacional e relatórios. Sem acesso a prontuário/transcrição por padrão.
- **recepcao**: operação (leads, pacientes, agenda, confirmação, no-show, waitlist). Sem acesso a prontuário/transcrição/gravação.
- **medico**: agenda própria, prontuário do próprio atendimento, teleconsulta dos próprios appointments e acesso restrito às transcrições/resumos vinculados aos seus atendimentos.

---

## 3) Matriz de Permissões (alto nível)

Legenda: R=read, W=write, –=sem acesso, (own)=apenas próprios, (rel)=relacionados ao médico

| Recurso / Tabela | Admin | Gestor | Recepção | Médico |
|---|---:|---:|---:|---:|
| tenants | R/W | R | – | R (tenant) |
| profiles (usuários) | R/W | R | – | R/W (self limitado) |
| doctors | R/W | R | R | R (own/tenant) |
| patients | R/W | R | R/W | R (rel) |
| leads | R/W | R | R/W | R (rel opcional) |
| appointments | R/W | R | R/W | R/W (own) |
| confirmation_attempts | R/W | R | R/W | R (own) |
| notifications (D-0) | R/W | R | R/W | R (own) |
| attendance_logs | R/W | R | R/W | R (own) |
| medical_records | R (audit) / W opcional | – | – | R/W (own) |
| followups | R/W | R | R/W | R (rel opcional) |
| waitlists / entries / offers | R/W | R | R/W | R (own opcional) |
| **teleconsult_integrations** (Google OAuth) | R/W | – | – | R/W (own) |
| **teleconsult_meetings** (event/link) | R/W | R | R/W | R (own) |
| **teleconsult_consents** | R/W | R (limitado) | R/W (operacional) | R/W (own) |
| **appointment_transcripts** | R (audit) | – | – | R/W (summary own), R (transcript own) |
| system_events | – (via console/service role) | – | – | – |
| outbound_messages | – (via service role/RPC) | – | – | – |
| audit_logs | R | R (limitado) | – | – |

---

## 4) Teleconsulta — Regras de negócio (segurança)
### 4.1 Integração Google Calendar/Meet
- Token OAuth (refresh token) deve ser **armazenado criptografado** (KMS/Vault/Secrets Manager) ou ao menos protegido em tabela com RLS estrita.
- Um médico só consegue ver/editar a própria integração.
- A recepção não vê tokens nem configurações do provedor.

### 4.2 Link de teleconsulta
- O link é gravado no appointment/meeting e enviado ao paciente apenas em:
  - confirmação
  - lembretes D-0
- Se appointment for cancelado, o evento pode ser removido/atualizado via integração.

### 4.3 Consentimento (LGPD)
- Gravação **somente** para transcrição/resumo.
- Consentimento explícito e auditável:
  - data/hora
  - canal (whatsapp/email/app)
  - texto da justificativa
  - aceite/recusa
- Se recusado: não grava; sem transcrição.

### 4.4 Transcrição e resumo
- `transcript_text` é imutável (somente service role/worker escreve).
- Médico pode ajustar **apenas** `structured_summary` e `patient_summary` (ou criar versão revisada).
- Envio do resumo ao paciente via e-mail deve ser logado (audit).

---

## 5) Estratégia de Implementação (RLS + RPC)
- Mudanças críticas passam por RPCs:
  - `create_appointment`
  - `confirm_appointment`
  - `set_appointment_status`
  - `create_or_update_meeting`
  - `request_teleconsult_consent`
  - `record_teleconsult_consent_response`
- Worker/n8n usa Service Role para:
  - criar eventos no Google
  - persistir meeting link/event_id
  - processar transcrição
  - enviar resumo por e-mail

---

## 6) Checklist LGPD mínimo
- Consentimento explícito para gravação.
- Retenção configurável (ex.: 90 dias) para gravação/transcrição, com expiração.
- Auditoria para leitura de prontuário/transcrição (admin break-glass opcional).
- RLS para bloquear recepção/gestor do prontuário/transcrição.

---

## 7) Próximo passo técnico
1) Aplicar migrations 008 (teleconsulta) + RLS v2.
2) Implementar OAuth Google (backend) e salvar token com segurança.
3) Workflows n8n:
   - criar evento ao confirmar
   - lembretes com link
   - pipeline transcrição/resumo + envio e-mail
