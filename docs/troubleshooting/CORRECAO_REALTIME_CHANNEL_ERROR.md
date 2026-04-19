# Correcao do CHANNEL_ERROR no Realtime

## Problema identificado

Algumas tabelas podiam aparecer com `CHANNEL_ERROR` no realtime, principalmente `appointments` e `patients`, impedindo atualizacao automatica ao navegar.

## Causa

O erro ocorre quando a tabela nao esta corretamente reaplicada na publication `supabase_realtime`.

## Solucao atual

### Registro historico

- `migrations/19º_Migration_fix_realtime_appointments_patients.sql`

### Migration preferencial para execucao

- `migrations/59º_Migration_harden_realtime_publication_reapply.sql`

## Como aplicar

1. Abra o `SQL Editor` no Supabase.
2. Execute `VERIFICAR_REALTIME_TABELAS.sql` para ver o estado atual.
3. Abra `migrations/59º_Migration_harden_realtime_publication_reapply.sql`.
4. Execute a migration.
5. Rode `VERIFICAR_REALTIME_TABELAS.sql` novamente para confirmar.

## Resultado esperado

- `appointments` com `SUBSCRIBED`
- `patients` com `SUBSCRIBED`
- demais tabelas criticas tambem presentes na publication

## Arquivos relacionados

1. `migrations/59º_Migration_harden_realtime_publication_reapply.sql`
2. `migrations/19º_Migration_fix_realtime_appointments_patients.sql`
3. `VERIFICAR_REALTIME_TABELAS.sql`
4. `docs/database/migration-notes/README_REALTIME_FIX.md`

## Observacao

Nao use a `19º_*` como primeira opcao operacional. Ela deve ser tratada como parte do historico; a `59º_*` e a trilha incremental segura.
