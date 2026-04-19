-- Reconcile realtime publication for critical public tables.
-- This is the Supabase CLI tracked equivalent of legacy migration 59.

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
  'Reapplies a table in supabase_realtime with idempotent DROP/ADD handling.';

DO $$
BEGIN
  IF to_regclass('public.appointments') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.appointments');
  END IF;
  IF to_regclass('public.patients') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.patients');
  END IF;
  IF to_regclass('public.profiles') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.profiles');
  END IF;
  IF to_regclass('public.pre_patients') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.pre_patients');
  END IF;
  IF to_regclass('public.agent_consultations') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.agent_consultations');
  END IF;
  IF to_regclass('public.doctor_schedules') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.doctor_schedules');
  END IF;
  IF to_regclass('public.profile_calendars') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.profile_calendars');
  END IF;
  IF to_regclass('public.patient_records') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.patient_records');
  END IF;
  IF to_regclass('public.patient_documents') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.patient_documents');
  END IF;
  IF to_regclass('public.medx_history') IS NOT NULL THEN
    PERFORM public.reapply_table_to_supabase_realtime('public.medx_history');
  END IF;
END
$$;

DROP FUNCTION public.reapply_table_to_supabase_realtime(regclass);
