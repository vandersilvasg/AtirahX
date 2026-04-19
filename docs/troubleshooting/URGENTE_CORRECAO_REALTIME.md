# Urgente - Correcao do Realtime

## Passo a passo rapido

1. Abra o `Supabase Dashboard`.
2. Entre em `SQL Editor`.
3. Execute `VERIFICAR_REALTIME_TABELAS.sql`.
4. Execute `migrations/59º_Migration_harden_realtime_publication_reapply.sql`.
5. Execute `VERIFICAR_REALTIME_TABELAS.sql` novamente.
6. Recarregue a aplicacao e valide os canais realtime.

## Logs esperados

Antes:

```txt
[useRealtimeList] Status do canal appointments: CHANNEL_ERROR
[useRealtimeList] Status do canal patients: CHANNEL_ERROR
```

Depois:

```txt
[useRealtimeList] Status do canal appointments: SUBSCRIBED
[useRealtimeList] Status do canal patients: SUBSCRIBED
```

## Arquivos importantes

1. `VERIFICAR_REALTIME_TABELAS.sql`
2. `migrations/59º_Migration_harden_realtime_publication_reapply.sql`
3. `docs/database/migration-notes/README_REALTIME_FIX.md`
4. `docs/troubleshooting/CORRECAO_REALTIME_CHANNEL_ERROR.md`

## Nota

`migrations/19º_Migration_fix_realtime_appointments_patients.sql` fica como registro historico. A migration operacional recomendada agora e a `59º_*`.
