-- Descrição: Reaplica tabelas críticas na publicação do realtime com tratamento idempotente
-- Data: 2026-04-18
-- Autor: Codex
-- Contexto: Extrai da edição histórica aberta em `19º_Migration_fix_realtime_appointments_patients.sql`
--           a lógica segura de reexecução para uma nova migration incremental.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.reapply_table_to_supabase_realtime(target_table regclass)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE %s', target_table);
  EXCEPTION
    WHEN undefined_object THEN
      NULL;
  END;

  BEGIN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', target_table);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END;
$$;

COMMENT ON FUNCTION public.reapply_table_to_supabase_realtime(regclass) IS
  'Reaplica uma tabela na publication supabase_realtime com tratamento idempotente de DROP/ADD.';

SELECT public.reapply_table_to_supabase_realtime('public.appointments');
SELECT public.reapply_table_to_supabase_realtime('public.patients');
SELECT public.reapply_table_to_supabase_realtime('public.profiles');
SELECT public.reapply_table_to_supabase_realtime('public.pre_patients');
SELECT public.reapply_table_to_supabase_realtime('public.agent_consultations');
SELECT public.reapply_table_to_supabase_realtime('public.doctor_schedules');
SELECT public.reapply_table_to_supabase_realtime('public.profile_calendars');
SELECT public.reapply_table_to_supabase_realtime('public.patient_records');
SELECT public.reapply_table_to_supabase_realtime('public.patient_documents');
SELECT public.reapply_table_to_supabase_realtime('public.medx_history');

DROP FUNCTION public.reapply_table_to_supabase_realtime(regclass);

-- Comentário: Esta migration preserva o histórico da `19º_*` e leva a versão
-- resiliente da reaplicação do realtime para uma migration incremental segura.
