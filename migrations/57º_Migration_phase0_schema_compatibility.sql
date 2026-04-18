-- Descricao: Fase 0 - compatibilidade de schema entre frontend e banco atual
-- Data: 2026-03-06
-- Autor: Codex GPT-5

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- appointments: garantir colunas usadas no frontend
-- ============================================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

UPDATE public.appointments
SET duration_minutes = 30
WHERE duration_minutes IS NULL;

ALTER TABLE public.appointments
  ALTER COLUMN duration_minutes SET DEFAULT 30;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS type TEXT;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================================
-- teleconsultations: garantir colunas usadas na tela de Teleconsulta
-- ============================================================================
ALTER TABLE public.teleconsultations
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;

ALTER TABLE public.teleconsultations
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- ============================================================================
-- messages: alinhar timestamps/canal para dashboard e metricas
-- ============================================================================
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS channel TEXT;

UPDATE public.messages
SET channel = 'whatsapp'
WHERE channel IS NULL OR btrim(channel) = '';

ALTER TABLE public.messages
  ALTER COLUMN channel SET DEFAULT 'whatsapp';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

UPDATE public.messages
SET sent_at = NOW()
WHERE sent_at IS NULL;

ALTER TABLE public.messages
  ALTER COLUMN sent_at SET DEFAULT NOW();

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.messages
SET created_at = COALESCE(sent_at, NOW())
WHERE created_at IS NULL;

ALTER TABLE public.messages
  ALTER COLUMN created_at SET DEFAULT NOW();

-- ============================================================================
-- medx_history: garantir coluna media usada pelo WhatsApp
-- ============================================================================
ALTER TABLE public.medx_history
  ADD COLUMN IF NOT EXISTS media TEXT;

-- ============================================================================
-- clientes_followup (legado): alinhar estrutura esperada no frontend atual
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clientes_followup (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  numero TEXT,
  ultima_atividade TEXT,
  sessionid TEXT,
  "follow-up1" TEXT,
  data_envio1 TEXT,
  mensagem1 TEXT,
  "follow-up2" TEXT,
  data_envio2 TEXT,
  mensagem2 TEXT,
  "follow-up3" TEXT,
  data_envio3 TEXT,
  mensagem3 TEXT,
  situacao TEXT,
  followup TEXT
);

ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS ultima_atividade TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS sessionid TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS "follow-up1" TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS data_envio1 TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS mensagem1 TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS "follow-up2" TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS data_envio2 TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS mensagem2 TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS "follow-up3" TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS data_envio3 TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS mensagem3 TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS situacao TEXT;
ALTER TABLE public.clientes_followup ADD COLUMN IF NOT EXISTS followup TEXT;

-- ============================================================================
-- followup_config: reconciliar modelo em minutos + PK/created_at
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.followup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NULL REFERENCES public.clinic_info(id) ON DELETE CASCADE,
  followup1_days INTEGER NOT NULL DEFAULT 7,
  followup2_days INTEGER NOT NULL DEFAULT 15,
  followup3_days INTEGER NOT NULL DEFAULT 30,
  followup1_minutes INTEGER NOT NULL DEFAULT 10080,
  followup2_minutes INTEGER NOT NULL DEFAULT 21600,
  followup3_minutes INTEGER NOT NULL DEFAULT 43200,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS id UUID;

UPDATE public.followup_config
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE public.followup_config
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.followup_config'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.followup_config
      ADD CONSTRAINT followup_config_pkey PRIMARY KEY (id);
  END IF;
END $$;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS clinic_id UUID NULL REFERENCES public.clinic_info(id) ON DELETE CASCADE;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS followup1_days INTEGER;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS followup2_days INTEGER;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS followup3_days INTEGER;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS followup1_minutes INTEGER;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS followup2_minutes INTEGER;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS followup3_minutes INTEGER;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

ALTER TABLE public.followup_config
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.followup_config
SET created_at = NOW()
WHERE created_at IS NULL;

UPDATE public.followup_config
SET updated_at = NOW()
WHERE updated_at IS NULL;

UPDATE public.followup_config
SET followup1_days = 7
WHERE followup1_days IS NULL;

UPDATE public.followup_config
SET followup2_days = 15
WHERE followup2_days IS NULL;

UPDATE public.followup_config
SET followup3_days = 30
WHERE followup3_days IS NULL;

UPDATE public.followup_config
SET followup1_minutes = COALESCE(followup1_minutes, followup1_days * 1440, 10080)
WHERE followup1_minutes IS NULL OR followup1_minutes <= 0;

UPDATE public.followup_config
SET followup2_minutes = COALESCE(followup2_minutes, followup2_days * 1440, 21600)
WHERE followup2_minutes IS NULL OR followup2_minutes <= 0;

UPDATE public.followup_config
SET followup3_minutes = COALESCE(followup3_minutes, followup3_days * 1440, 43200)
WHERE followup3_minutes IS NULL OR followup3_minutes <= 0;

ALTER TABLE public.followup_config
  ALTER COLUMN followup1_days SET DEFAULT 7;

ALTER TABLE public.followup_config
  ALTER COLUMN followup2_days SET DEFAULT 15;

ALTER TABLE public.followup_config
  ALTER COLUMN followup3_days SET DEFAULT 30;

ALTER TABLE public.followup_config
  ALTER COLUMN followup1_minutes SET DEFAULT 10080;

ALTER TABLE public.followup_config
  ALTER COLUMN followup2_minutes SET DEFAULT 21600;

ALTER TABLE public.followup_config
  ALTER COLUMN followup3_minutes SET DEFAULT 43200;

ALTER TABLE public.followup_config
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.followup_config
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- garante uma linha baseline para evitar erro de .single() na UI
INSERT INTO public.followup_config (
  clinic_id,
  followup1_days,
  followup2_days,
  followup3_days,
  followup1_minutes,
  followup2_minutes,
  followup3_minutes
)
SELECT
  NULL,
  7,
  15,
  30,
  10080,
  21600,
  43200
WHERE NOT EXISTS (
  SELECT 1 FROM public.followup_config
);

-- ============================================================================
-- dashboard metrics: reduzir risco de quebra por coluna/timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE (
  consultas_hoje BIGINT,
  consultas_mes_atual BIGINT,
  consultas_mes_anterior BIGINT,
  total_pacientes_crm BIGINT,
  pacientes_mes_atual BIGINT,
  pacientes_mes_anterior BIGINT,
  total_pre_pacientes BIGINT,
  total_medicos BIGINT,
  total_secretarias BIGINT,
  mensagens_hoje BIGINT,
  mensagens_mes_atual BIGINT,
  followups_pendentes BIGINT,
  prontuarios_criados BIGINT,
  consultas_ia BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  hoje DATE := CURRENT_DATE;
  primeiro_dia_mes_atual TIMESTAMPTZ := DATE_TRUNC('month', CURRENT_DATE);
  primeiro_dia_mes_anterior TIMESTAMPTZ := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  ultimo_dia_mes_anterior TIMESTAMPTZ := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
BEGIN
  RETURN QUERY
  WITH appointments_base AS (
    SELECT COALESCE(a.scheduled_at, a.appointment_date) AS dt
    FROM public.appointments a
  ),
  messages_base AS (
    SELECT COALESCE(m.created_at, m.sent_at) AS dt
    FROM public.messages m
  )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM appointments_base WHERE DATE(dt) = hoje),
    (SELECT COUNT(*)::BIGINT FROM appointments_base WHERE dt >= primeiro_dia_mes_atual),
    (SELECT COUNT(*)::BIGINT
     FROM appointments_base
     WHERE dt >= primeiro_dia_mes_anterior
       AND dt <= ultimo_dia_mes_anterior),
    (SELECT COUNT(*)::BIGINT FROM public.patients),
    (SELECT COUNT(*)::BIGINT FROM public.patients WHERE created_at >= primeiro_dia_mes_atual),
    (SELECT COUNT(*)::BIGINT
     FROM public.patients
     WHERE created_at >= primeiro_dia_mes_anterior
       AND created_at <= ultimo_dia_mes_anterior),
    (SELECT COUNT(*)::BIGINT FROM public.pre_patients),
    (SELECT COUNT(*)::BIGINT FROM public.profiles WHERE role = 'doctor'),
    (SELECT COUNT(*)::BIGINT FROM public.profiles WHERE role = 'secretary'),
    (SELECT COUNT(*)::BIGINT FROM messages_base WHERE DATE(dt) = hoje),
    (SELECT COUNT(*)::BIGINT FROM messages_base WHERE dt >= primeiro_dia_mes_atual),
    (SELECT COUNT(*)::BIGINT FROM public.follow_ups WHERE status = 'pending'),
    (SELECT COUNT(*)::BIGINT FROM public.medical_records),
    (SELECT COUNT(*)::BIGINT FROM public.agent_consultations);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;

COMMIT;
