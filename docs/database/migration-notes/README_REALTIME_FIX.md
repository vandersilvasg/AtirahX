# Correcao do Realtime (CHANNEL_ERROR)

## Problema

Durante testes de navegacao, foi identificado que tabelas criticas como `appointments` e `patients` podiam ficar fora da publication `supabase_realtime`, causando `CHANNEL_ERROR`.

## Estado atual da trilha

- `migrations/19º_Migration_fix_realtime_appointments_patients.sql`
  Registro historico da correcao original.
- `migrations/59º_Migration_harden_realtime_publication_reapply.sql`
  Migration incremental preferencial para novas execucoes e reaplicacoes seguras.

## O que a `59º_*` faz

- garante que a publication `supabase_realtime` exista
- reaplica tabelas criticas com tratamento resiliente de `DROP/ADD`
- preserva o historico da `19º_*` sem reescrever migration antiga

## Tabelas cobertas

1. `appointments`
2. `patients`
3. `profiles`
4. `pre_patients`
5. `agent_consultations`
6. `doctor_schedules`
7. `profile_calendars`
8. `patient_records`
9. `patient_documents`
10. `medx_history`

## Como executar

1. Acesse o `SQL Editor` no Supabase.
2. Copie o conteudo de `migrations/59º_Migration_harden_realtime_publication_reapply.sql`.
3. Execute a migration.
4. Rode `VERIFICAR_REALTIME_TABELAS.sql` para confirmar o estado final.

## Resultado esperado

- canais realtime com status `SUBSCRIBED`
- navegacao sem necessidade de `F5`
- alteracoes no banco refletidas automaticamente na interface

## Notas

1. A `19º_*` deve ser mantida apenas como referencia historica.
2. A `59º_*` e a migration operacional recomendada.
3. Se novas tabelas entrarem no fluxo realtime, elas devem ser adicionadas na trilha incremental atual.
