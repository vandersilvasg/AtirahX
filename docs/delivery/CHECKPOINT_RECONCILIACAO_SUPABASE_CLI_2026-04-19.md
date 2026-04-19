# Checkpoint de Reconciliacao do Supabase CLI

Data: 2026-04-19

## Objetivo

Fechar o bloqueio operacional entre o projeto local e o Supabase remoto, que impedia o uso normal de `supabase db push`.

## Problema encontrado

O projeto estava com SQL numerado em `migrations/`, mas sem trilha oficial em `supabase/migrations/`.

Consequencias observadas:

- `supabase db push` nao reconhecia as migrations locais como historico oficial
- o remoto tinha versoes orfas na tabela de migrations
- o CLI falhava por divergencia entre historico local e remoto

## Acoes executadas

### 1. Publicacao Git

- remoto Git corrigido para `https://github.com/vandersilvasg/AtirahX.git`
- branch publicada: `feat-premium-product-evolution-2026-04-19`

### 2. Autenticacao e vinculo Supabase

- `supabase login` executado
- `supabase link --project-ref epyreefmaeajfltltpwa` executado

### 3. Reparo do historico remoto

Versoes orfas marcadas como `reverted`:

- `20260307150353`
- `20260418220337`
- `20260418233916`

### 4. Auditoria de schema remoto

Foi confirmado no remoto que o conteudo estrutural de `60` e `61` ja existia:

- `public.financial_entries`
- indices `idx_financial_entries_type`, `idx_financial_entries_occurred_at`, `idx_financial_entries_clinic`
- colunas de crescimento em `public.pre_patients`
- views `public.vw_growth_funnel_metrics` e `public.vw_growth_channel_metrics`

### 5. Formalizacao da trilha oficial do Supabase CLI

Foram criadas migrations compatíveis com o historico do Supabase CLI em `supabase/migrations/`:

- `20260419193000_reapply_realtime_publication.sql`
- `20260419193100_create_financial_entries.sql`
- `20260419193200_expand_pre_patients_growth_fields.sql`

### 6. Ajuste defensivo na migration de realtime

A migration de reconciliacao de realtime foi ajustada para nao falhar quando tabelas historicamente citadas nao existirem no schema atual:

- `public.patient_records`
- `public.patient_documents`

O SQL passou a usar `to_regclass(...)` antes de reaplicar a publication.

### 7. Aplicacao remota concluida

`supabase db push` foi executado com sucesso e o historico remoto ficou alinhado com:

- `20260419193000`
- `20260419193100`
- `20260419193200`

## Estado final

### Resolvido

- autenticacao do Supabase CLI
- historico remoto inconsistente
- ausencia de trilha oficial em `supabase/migrations`
- registro oficial do bloco `59/60/61` no historico remoto

### Realtime validado

Realtime:

- a migration de reaplicacao foi executada e registrada
- um primeiro teste tecnico com subscriber nao autenticado como usuario de app nao recebeu evento
- a validacao definitiva foi refeita com um usuario temporario real do Supabase:
  - `auth.users` temporario criado
  - `profiles` temporario criado com role `owner`
  - login executado via `anon key`
  - subscriber realtime autenticado recebeu `INSERT` e `DELETE` em `pre_patients`
  - usuario e dados sinteticos foram removidos ao final

Conclusao:

- o fluxo de `postgres_changes` para `pre_patients` esta funcional no contexto real de usuario autenticado
- a publicacao reaplicada pela reconciliacao esta operacional para o caso validado

## Leitura pragmatica

O problema estrutural de banco ficou resolvido.

O que restou em aberto nao e mais versionamento ou migration, e sim validacao funcional do fluxo realtime no contexto real da aplicacao.

## Proxima validacao recomendada

1. Validar no app real os canais de:
   - `patients`
   - `medx_history`
2. Se algum modulo especifico ainda falhar, executar `VERIFICAR_REALTIME_TABELAS.sql` no SQL Editor para inspecao direta de `pg_publication`.
