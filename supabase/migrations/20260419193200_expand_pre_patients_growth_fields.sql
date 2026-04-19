-- Reconcile growth funnel fields in Supabase CLI history.
-- This is the Supabase CLI tracked equivalent of legacy migration 61.

BEGIN;

ALTER TABLE public.pre_patients
  ADD COLUMN IF NOT EXISTS source_channel TEXT,
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS temperature TEXT,
  ADD COLUMN IF NOT EXISTS compareceu BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fechou BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_show BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS procedure_interest TEXT;

UPDATE public.pre_patients
SET source_channel = 'nao_informado'
WHERE source_channel IS NULL;

UPDATE public.pre_patients
SET estimated_value = 0
WHERE estimated_value IS NULL;

UPDATE public.pre_patients
SET temperature = 'morno'
WHERE temperature IS NULL;

UPDATE public.pre_patients
SET stage = CASE
  WHEN stage IS NULL OR btrim(stage) = '' OR stage = 'pre' THEN 'lead_novo'
  ELSE stage
END;

ALTER TABLE public.pre_patients
  ALTER COLUMN source_channel SET DEFAULT 'nao_informado',
  ALTER COLUMN source_channel SET NOT NULL,
  ALTER COLUMN estimated_value SET DEFAULT 0,
  ALTER COLUMN estimated_value SET NOT NULL,
  ALTER COLUMN temperature SET DEFAULT 'morno',
  ALTER COLUMN temperature SET NOT NULL,
  ALTER COLUMN stage SET DEFAULT 'lead_novo',
  ALTER COLUMN stage SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pre_patients_stage_growth_check'
      AND conrelid = 'public.pre_patients'::regclass
  ) THEN
    ALTER TABLE public.pre_patients
      ADD CONSTRAINT pre_patients_stage_growth_check
      CHECK (
        stage IN (
          'lead_novo',
          'contato_iniciado',
          'qualificado',
          'agendado',
          'compareceu',
          'fechou',
          'perdido'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pre_patients_temperature_check'
      AND conrelid = 'public.pre_patients'::regclass
  ) THEN
    ALTER TABLE public.pre_patients
      ADD CONSTRAINT pre_patients_temperature_check
      CHECK (temperature IN ('frio', 'morno', 'quente'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pre_patients_response_time_non_negative'
      AND conrelid = 'public.pre_patients'::regclass
  ) THEN
    ALTER TABLE public.pre_patients
      ADD CONSTRAINT pre_patients_response_time_non_negative
      CHECK (response_time_seconds IS NULL OR response_time_seconds >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pre_patients_stage ON public.pre_patients(stage);
CREATE INDEX IF NOT EXISTS idx_pre_patients_source_channel ON public.pre_patients(source_channel);
CREATE INDEX IF NOT EXISTS idx_pre_patients_temperature ON public.pre_patients(temperature);
CREATE INDEX IF NOT EXISTS idx_pre_patients_last_contact_at ON public.pre_patients(last_contact_at DESC);

CREATE OR REPLACE VIEW public.vw_growth_funnel_metrics AS
SELECT
  COUNT(*) FILTER (WHERE stage = 'lead_novo') AS leads_novos,
  COUNT(*) FILTER (WHERE stage = 'contato_iniciado') AS respondidos,
  COUNT(*) FILTER (WHERE stage = 'qualificado') AS qualificados,
  COUNT(*) FILTER (WHERE stage = 'agendado') AS agendados,
  COUNT(*) FILTER (WHERE compareceu = true OR stage = 'compareceu') AS compareceram,
  COUNT(*) FILTER (WHERE fechou = true OR stage = 'fechou') AS fechados,
  COUNT(*) FILTER (WHERE no_show = true) AS no_show_count,
  COUNT(*) FILTER (WHERE stage = 'perdido') AS perdidos,
  COALESCE(SUM(estimated_value) FILTER (WHERE stage = 'perdido'), 0) AS perda_receita_estimada,
  COALESCE(AVG(response_time_seconds), 0)::NUMERIC(12, 2) AS resposta_media_segundos
FROM public.pre_patients;

COMMENT ON VIEW public.vw_growth_funnel_metrics IS 'Growth funnel metrics consolidated from pre_patients.';

CREATE OR REPLACE VIEW public.vw_growth_channel_metrics AS
SELECT
  source_channel,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE fechou = true OR stage = 'fechou') AS total_fechados,
  COALESCE(SUM(estimated_value), 0) AS valor_pipeline,
  COALESCE(SUM(estimated_value) FILTER (WHERE fechou = true OR stage = 'fechou'), 0) AS valor_fechado,
  COALESCE(SUM(estimated_value) FILTER (WHERE stage = 'perdido'), 0) AS valor_perdido
FROM public.pre_patients
GROUP BY source_channel;

COMMENT ON VIEW public.vw_growth_channel_metrics IS 'Channel metrics for conversion and estimated ROI analysis.';

COMMIT;
