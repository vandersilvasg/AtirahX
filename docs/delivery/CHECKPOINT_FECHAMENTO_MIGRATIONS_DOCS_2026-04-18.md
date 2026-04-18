# Checkpoint de Fechamento - Migrations e Docs de Banco

Data: 2026-04-18

Projeto: `Atirah-IA-OS`

## Objetivo

Delimitar o bloco `migrations + docs de banco` como unidade pronta para revisao e versionamento.

## Escopo do bloco

### Migrations

- `migrations/57º_Migration_phase0_schema_compatibility.sql`
- `migrations/58º_Migration_crm_journey_and_automation_foundation.sql`
- `migrations/59º_Migration_harden_realtime_publication_reapply.sql`

### Higiene da pasta `migrations/`

- remocao dos `README_*.md` de apoio de dentro de `migrations/`
- preservacao da `19º_Migration_fix_realtime_appointments_patients.sql` como historica
- documentacao da duplicidade `46º_*`

### Documentacao de banco

- `docs/database/CHECKPOINT_MIGRATIONS_2026-04-18.md`
- `docs/database/MIGRATION_NUMERACAO_EXCECOES.md`
- `docs/database/migration-notes/README_REALTIME_FIX.md`
- `docs/database/migration-notes/README_AGENT_CONSULTATIONS.md`
- `docs/database/migration-notes/README_AGENT_EXAMS.md`
- `docs/database/migration-notes/README_FUNCAO_LOGIN.md`
- `docs/database/migration-notes/README_MEDICATION_FIELDS.md`
- `docs/database/migration-notes/README_REESTRUTURACAO_HORARIOS.md`
- `docs/database/migration-notes/README_SYSTEM_SETTINGS.md`
- `docs/database/manual-sql/fix_missing_profile_vander.sql`
- `docs/database/manual-sql/fix_missing_profile_vander_hotmail.sql`
- `docs/database/manual-sql/fix_profile_force_id.sql`

### Guias operacionais atualizados

- `docs/troubleshooting/CORRECAO_REALTIME_CHANNEL_ERROR.md`
- `docs/troubleshooting/URGENTE_CORRECAO_REALTIME.md`
- `docs/delivery/RESUMO_DEBUG_E_CORRECAO_COMPLETA.md`
- `docs/delivery/PROCESSO_AJUSTES_E_WORKLOG_2026-03-24.md`

## Leitura pragmatica

- a trilha historica deixou de ser reescrita
- a `59º_*` virou a migration incremental preferencial para reaplicacao segura do realtime
- os scripts corretivos e os READMEs auxiliares sairam do fluxo oficial de schema
- a duplicidade `46º_*` ficou documentada, sem renumeracao retroativa

## Pendencia real

1. Executar a `59º_*` no ambiente Supabase.
2. Validar o resultado com `VERIFICAR_REALTIME_TABELAS.sql`.

## Fechamento recomendado

Este bloco pode ser revisado e versionado como uma unidade logica unica:

- `migrations/banco`
- `docs/database`
- `docs/troubleshooting` ligados a realtime
- worklog/checkpoints desta rodada
