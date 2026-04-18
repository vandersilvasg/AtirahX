# Integracao CRM Automation + ElevenLabs

## O que foi implementado

- Migracao de compatibilidade de schema/follow-up aplicada no projeto Supabase atual:
  - `phase0_schema_compatibility_followup`
- Edge Function criada:
  - `supabase/functions/appointment-automation-worker`
- Cliente frontend para acionar o worker:
  - `src/lib/automationWorkerClient.ts`

## O que o worker faz

- Busca jobs pendentes em `appointment_automation_jobs` (`status = pending` e `scheduled_for <= now`).
- Processa por canal:
  - `whatsapp`: envia para webhook configurado.
  - `phone`: envia para endpoint de chamada do ElevenLabs.
- Atualiza status do job (`sent`, `pending`, `failed`) com controle de tentativas.
- Registra mensagem em `messages` (com fallback para schema legado).

## Variaveis de ambiente da Edge Function

### Obrigatorias

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### WhatsApp

- `AUTOMATION_WHATSAPP_WEBHOOK_URL`
- `AUTOMATION_WHATSAPP_BEARER_TOKEN` (opcional)

### ElevenLabs

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_OUTBOUND_URL` (opcional, default no codigo)
- `ELEVENLABS_AGENT_ID` (opcional)

## Como chamar o worker

### Requisicao direta

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/appointment-automation-worker" \
  -H "Authorization: Bearer <jwt>" \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"limit":25}'
```

### Dry run

```json
{
  "limit": 25,
  "dryRun": true
}
```

### Filtro por canal

```json
{
  "onlyChannel": "phone"
}
```

## Status atual

- O MCP Supabase apresentou falhas intermitentes de autorizacao durante a aplicacao da migracao CRM principal.
- A SQL completa local continua em:
  - `migrations/58º_Migration_crm_journey_and_automation_foundation.sql`
- Se necessario, aplicar manualmente essa migration no SQL editor do projeto.
