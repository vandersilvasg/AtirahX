supabase/tests/rls_smoke_tests.sql

-- rls_smoke_tests.sql
-- Roteiro: use psql com usuários JWT diferentes, ou rode via SQL editor simulando claims (em ambiente de testes).

-- O teste real de RLS exige autenticar como cada role.
-- Aqui vai o checklist do que validar manualmente:

-- 1) medico não consegue SELECT medical_records de outro medico
-- 2) recepcao não consegue SELECT medical_records
-- 3) medico só vê appointments do próprio doctor_id
-- 4) medico só vê patients relacionados aos próprios appointments
-- 5) recepcao vê patients do tenant e consegue criar lead/appointment
-- 6) system_events está bloqueado para usuários comuns


-- === TELECONSULTA (ADD) smoke tests (best-effort) ===
-- NOTE: ajuste os roles/fixtures conforme seu suite atual.
-- Expectation: inserção em teleconsult tables deve respeitar tenant_id e roles.

-- Exemplo: garantir que RLS está habilitado (tabelas existem)
select relrowsecurity from pg_class where relname in ('teleconsult_integrations','teleconsult_meetings','teleconsult_consents','appointment_transcripts');
