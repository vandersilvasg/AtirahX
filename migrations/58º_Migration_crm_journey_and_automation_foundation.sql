-- Descricao: Fase 1 - Fundacao de CRM de jornada, automacao de agendamentos e lista de espera
-- Data: 2026-03-06
-- Autor: Codex GPT-5

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- appointments: campos de jornada CRM e controle operacional
-- ============================================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

UPDATE public.appointments
SET scheduled_at = appointment_date
WHERE scheduled_at IS NULL
  AND appointment_date IS NOT NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS journey_stage TEXT;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMPTZ;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS no_show_reason TEXT;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS attendance_margin_minutes INTEGER;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS rescheduled_from_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS rescheduled_to_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

UPDATE public.appointments
SET attendance_margin_minutes = 15
WHERE attendance_margin_minutes IS NULL OR attendance_margin_minutes < 0;

ALTER TABLE public.appointments
  ALTER COLUMN attendance_margin_minutes SET DEFAULT 15;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_attendance_margin_minutes_check'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_attendance_margin_minutes_check
      CHECK (attendance_margin_minutes >= 0);
  END IF;
END $$;

UPDATE public.appointments
SET journey_stage = CASE
  WHEN status = 'cancelled' THEN 'cancelado'
  WHEN status = 'completed' THEN 'finalizado'
  WHEN status = 'no_show' THEN 'aguardando'
  ELSE 'agendado'
END
WHERE journey_stage IS NULL
   OR btrim(journey_stage) = ''
   OR journey_stage NOT IN ('agendado', 'cancelado', 'aguardando', 'em_atendimento', 'finalizado');

ALTER TABLE public.appointments
  ALTER COLUMN journey_stage SET DEFAULT 'agendado';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_journey_stage_check'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_journey_stage_check
      CHECK (journey_stage IN ('agendado', 'cancelado', 'aguardando', 'em_atendimento', 'finalizado'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_journey_stage ON public.appointments(journey_stage);
CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled_at ON public.appointments(status, scheduled_at);

-- ============================================================================
-- Historico de transicoes da jornada da consulta
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_journey_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  reason_code TEXT,
  reason_details TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_appointment_journey_history_appointment
  ON public.appointment_journey_history(appointment_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointment_journey_history_to_stage
  ON public.appointment_journey_history(to_stage);

-- ============================================================================
-- Configuracao de automacoes por clinica
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_automation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NULL REFERENCES public.clinic_info(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  primary_channel TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (primary_channel IN ('whatsapp', 'phone')),
  send_confirmation_on_booking BOOLEAN NOT NULL DEFAULT true,
  send_same_day_followup BOOLEAN NOT NULL DEFAULT true,
  same_day_reminder_hour INTEGER NOT NULL DEFAULT 8
    CHECK (same_day_reminder_hour BETWEEN 0 AND 23),
  send_one_hour_followup BOOLEAN NOT NULL DEFAULT true,
  send_at_time_followup BOOLEAN NOT NULL DEFAULT true,
  send_absence_outreach BOOLEAN NOT NULL DEFAULT true,
  absence_grace_minutes INTEGER NOT NULL DEFAULT 15
    CHECK (absence_grace_minutes >= 0),
  absence_contact_channel TEXT NOT NULL DEFAULT 'both'
    CHECK (absence_contact_channel IN ('whatsapp', 'phone', 'both')),
  absence_agent_provider TEXT NOT NULL DEFAULT 'elevenlabs',
  waitlist_enabled BOOLEAN NOT NULL DEFAULT true,
  waitlist_offer_timeout_minutes INTEGER NOT NULL DEFAULT 30
    CHECK (waitlist_offer_timeout_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointment_automation_config_clinic_id_key'
      AND conrelid = 'public.appointment_automation_config'::regclass
  ) THEN
    ALTER TABLE public.appointment_automation_config
      ADD CONSTRAINT appointment_automation_config_clinic_id_key UNIQUE (clinic_id);
  END IF;
END $$;

INSERT INTO public.appointment_automation_config (
  clinic_id,
  is_enabled,
  primary_channel,
  send_confirmation_on_booking,
  send_same_day_followup,
  same_day_reminder_hour,
  send_one_hour_followup,
  send_at_time_followup,
  send_absence_outreach,
  absence_grace_minutes,
  absence_contact_channel,
  absence_agent_provider,
  waitlist_enabled,
  waitlist_offer_timeout_minutes
)
SELECT
  NULL,
  true,
  'whatsapp',
  true,
  true,
  8,
  true,
  true,
  true,
  15,
  'both',
  'elevenlabs',
  true,
  30
WHERE NOT EXISTS (
  SELECT 1 FROM public.appointment_automation_config
);

-- ============================================================================
-- Fila de automacao (confirmacoes, lembretes e abordagem de ausencia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NULL REFERENCES public.clinic_info(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (
    job_type IN (
      'confirmacao_agendamento',
      'followup_dia_consulta',
      'followup_1h_antes',
      'followup_hora_consulta',
      'contato_ausencia',
      'oferta_lista_espera'
    )
  ),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'phone')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled', 'done')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider TEXT,
  provider_message_id TEXT,
  last_error TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_automation_jobs_unique
  ON public.appointment_automation_jobs(appointment_id, patient_id, job_type, channel, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_appointment_automation_jobs_schedule
  ON public.appointment_automation_jobs(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_appointment_automation_jobs_appointment
  ON public.appointment_automation_jobs(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_automation_jobs_patient
  ON public.appointment_automation_jobs(patient_id);

-- ============================================================================
-- Lista de espera
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  preferred_date DATE,
  preferred_shift TEXT NOT NULL DEFAULT 'any'
    CHECK (preferred_shift IN ('morning', 'afternoon', 'evening', 'any')),
  appointment_type TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'contacted', 'booked', 'expired', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'patient'
    CHECK (source IN ('patient', 'staff', 'agent')),
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_waitlist_status_priority
  ON public.appointment_waitlist(status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_appointment_waitlist_doctor_date
  ON public.appointment_waitlist(doctor_id, preferred_date);

CREATE TABLE IF NOT EXISTS public.appointment_waitlist_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id UUID NOT NULL REFERENCES public.appointment_waitlist(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  automation_job_id UUID NULL REFERENCES public.appointment_automation_jobs(id) ON DELETE SET NULL,
  offer_channel TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (offer_channel IN ('whatsapp', 'phone')),
  offer_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (offer_status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  response_deadline TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointment_waitlist_offers_waitlist_id_appointment_id_key'
      AND conrelid = 'public.appointment_waitlist_offers'::regclass
  ) THEN
    ALTER TABLE public.appointment_waitlist_offers
      ADD CONSTRAINT appointment_waitlist_offers_waitlist_id_appointment_id_key
      UNIQUE (waitlist_id, appointment_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointment_waitlist_offers_status
  ON public.appointment_waitlist_offers(offer_status, response_deadline);

CREATE INDEX IF NOT EXISTS idx_appointment_waitlist_offers_appointment
  ON public.appointment_waitlist_offers(appointment_id);

-- ============================================================================
-- messages: rastreabilidade por consulta / job de automacao
-- ============================================================================
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS automation_job_id UUID;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS template_key TEXT;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS delivery_status TEXT;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

UPDATE public.messages
SET delivery_status = 'sent'
WHERE delivery_status IS NULL OR btrim(delivery_status) = '';

ALTER TABLE public.messages
  ALTER COLUMN delivery_status SET DEFAULT 'sent';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_delivery_status_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_delivery_status_check
      CHECK (delivery_status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'failed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_automation_job_id_fkey'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_automation_job_id_fkey
      FOREIGN KEY (automation_job_id)
      REFERENCES public.appointment_automation_jobs(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON public.messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_messages_automation_job_id ON public.messages(automation_job_id);
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON public.messages(delivery_status);

-- ============================================================================
-- Funcoes auxiliares
-- ============================================================================
CREATE OR REPLACE FUNCTION public.resolve_clinic_id_for_doctor(p_doctor_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT ci.id
  FROM public.clinic_info ci
  WHERE ci.doctor_ids IS NOT NULL
    AND p_doctor_id = ANY(ci.doctor_ids)
  ORDER BY ci.created_at ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.enqueue_appointment_job_if_missing(
  p_appointment_id UUID,
  p_patient_id UUID,
  p_clinic_id UUID,
  p_job_type TEXT,
  p_channel TEXT,
  p_scheduled_for TIMESTAMPTZ,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO public.appointment_automation_jobs (
    appointment_id,
    patient_id,
    clinic_id,
    job_type,
    channel,
    scheduled_for,
    payload,
    provider
  )
  VALUES (
    p_appointment_id,
    p_patient_id,
    p_clinic_id,
    p_job_type,
    p_channel,
    p_scheduled_for,
    COALESCE(p_payload, '{}'::jsonb),
    CASE
      WHEN p_channel = 'phone' THEN 'elevenlabs'
      ELSE 'whatsapp'
    END
  )
  ON CONFLICT (appointment_id, patient_id, job_type, channel, scheduled_for)
  DO NOTHING
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_appointment_journey_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.scheduled_at IS NULL THEN
    NEW.scheduled_at := NEW.appointment_date;
  END IF;

  IF NEW.attendance_margin_minutes IS NULL OR NEW.attendance_margin_minutes < 0 THEN
    NEW.attendance_margin_minutes := 15;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.journey_stage IS NULL OR btrim(NEW.journey_stage) = '' THEN
      NEW.journey_stage := CASE
        WHEN NEW.status = 'cancelled' THEN 'cancelado'
        WHEN NEW.status = 'completed' THEN 'finalizado'
        WHEN NEW.status = 'no_show' THEN 'aguardando'
        ELSE 'agendado'
      END;
    END IF;
  ELSE
    IF NEW.status = 'cancelled' THEN
      NEW.journey_stage := 'cancelado';
    ELSIF NEW.status = 'completed' THEN
      NEW.journey_stage := 'finalizado';
    ELSIF NEW.journey_stage IS NULL OR btrim(NEW.journey_stage) = '' THEN
      NEW.journey_stage := COALESCE(OLD.journey_stage, 'agendado');
    END IF;
  END IF;

  IF NEW.journey_stage = 'aguardando' AND NEW.checked_in_at IS NULL THEN
    NEW.checked_in_at := NOW();
  END IF;

  IF NEW.journey_stage = 'em_atendimento' AND NEW.started_at IS NULL THEN
    NEW.started_at := NOW();
  END IF;

  IF NEW.journey_stage = 'finalizado' AND NEW.finished_at IS NULL THEN
    NEW.finished_at := NOW();
  END IF;

  IF NEW.status = 'no_show' AND NEW.no_show_at IS NULL THEN
    NEW.no_show_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_appointment_journey_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT p.id
    INTO v_profile_id
  FROM public.profiles p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_journey_history (
      appointment_id,
      from_stage,
      to_stage,
      reason_code,
      changed_by,
      metadata
    )
    VALUES (
      NEW.id,
      NULL,
      COALESCE(NEW.journey_stage, 'agendado'),
      'created',
      v_profile_id,
      jsonb_build_object('status', NEW.status)
    );
    RETURN NEW;
  END IF;

  IF COALESCE(OLD.journey_stage, '') <> COALESCE(NEW.journey_stage, '') THEN
    INSERT INTO public.appointment_journey_history (
      appointment_id,
      from_stage,
      to_stage,
      reason_code,
      changed_by,
      metadata
    )
    VALUES (
      NEW.id,
      OLD.journey_stage,
      NEW.journey_stage,
      CASE
        WHEN NEW.status IS DISTINCT FROM OLD.status THEN NEW.status
        ELSE 'manual_update'
      END,
      v_profile_id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_appointment_default_jobs(p_appointment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_appt RECORD;
  v_cfg RECORD;
  v_clinic_id UUID;
  v_scheduled_at TIMESTAMPTZ;
  v_same_day_at TIMESTAMPTZ;
  v_absence_at TIMESTAMPTZ;
BEGIN
  SELECT a.*
    INTO v_appt
  FROM public.appointments a
  WHERE a.id = p_appointment_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_appt.status IN ('cancelled', 'completed') OR v_appt.journey_stage IN ('cancelado', 'finalizado') THEN
    RETURN;
  END IF;

  v_scheduled_at := COALESCE(v_appt.scheduled_at, v_appt.appointment_date);
  IF v_scheduled_at IS NULL THEN
    RETURN;
  END IF;

  v_clinic_id := public.resolve_clinic_id_for_doctor(v_appt.doctor_id);

  SELECT c.*
    INTO v_cfg
  FROM public.appointment_automation_config c
  WHERE c.clinic_id = v_clinic_id
     OR c.clinic_id IS NULL
  ORDER BY
    CASE WHEN c.clinic_id = v_clinic_id THEN 0 ELSE 1 END,
    c.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF COALESCE(v_cfg.is_enabled, true) = false THEN
    RETURN;
  END IF;

  IF COALESCE(v_cfg.send_confirmation_on_booking, true) THEN
    PERFORM public.enqueue_appointment_job_if_missing(
      v_appt.id,
      v_appt.patient_id,
      v_clinic_id,
      'confirmacao_agendamento',
      v_cfg.primary_channel,
      NOW(),
      jsonb_build_object('template', 'appointment_confirmation')
    );
  END IF;

  v_same_day_at := date_trunc('day', v_scheduled_at) + make_interval(hours => COALESCE(v_cfg.same_day_reminder_hour, 8));
  IF v_same_day_at > v_scheduled_at THEN
    v_same_day_at := v_scheduled_at - INTERVAL '15 minutes';
  END IF;
  v_same_day_at := GREATEST(v_same_day_at, NOW());

  IF COALESCE(v_cfg.send_same_day_followup, true) THEN
    PERFORM public.enqueue_appointment_job_if_missing(
      v_appt.id,
      v_appt.patient_id,
      v_clinic_id,
      'followup_dia_consulta',
      v_cfg.primary_channel,
      v_same_day_at,
      jsonb_build_object('template', 'appointment_same_day')
    );
  END IF;

  IF COALESCE(v_cfg.send_one_hour_followup, true) THEN
    PERFORM public.enqueue_appointment_job_if_missing(
      v_appt.id,
      v_appt.patient_id,
      v_clinic_id,
      'followup_1h_antes',
      v_cfg.primary_channel,
      GREATEST(v_scheduled_at - INTERVAL '1 hour', NOW()),
      jsonb_build_object('template', 'appointment_one_hour_before')
    );
  END IF;

  IF COALESCE(v_cfg.send_at_time_followup, true) THEN
    PERFORM public.enqueue_appointment_job_if_missing(
      v_appt.id,
      v_appt.patient_id,
      v_clinic_id,
      'followup_hora_consulta',
      v_cfg.primary_channel,
      GREATEST(v_scheduled_at, NOW()),
      jsonb_build_object('template', 'appointment_time')
    );
  END IF;

  IF COALESCE(v_cfg.send_absence_outreach, true) THEN
    v_absence_at := GREATEST(
      v_scheduled_at + make_interval(mins => COALESCE(v_cfg.absence_grace_minutes, 15)),
      NOW()
    );

    IF v_cfg.absence_contact_channel IN ('whatsapp', 'both') THEN
      PERFORM public.enqueue_appointment_job_if_missing(
        v_appt.id,
        v_appt.patient_id,
        v_clinic_id,
        'contato_ausencia',
        'whatsapp',
        v_absence_at,
        jsonb_build_object(
          'template', 'absence_outreach',
          'source', 'automation'
        )
      );
    END IF;

    IF v_cfg.absence_contact_channel IN ('phone', 'both') THEN
      PERFORM public.enqueue_appointment_job_if_missing(
        v_appt.id,
        v_appt.patient_id,
        v_clinic_id,
        'contato_ausencia',
        'phone',
        v_absence_at,
        jsonb_build_object(
          'template', 'absence_outreach_phone',
          'provider', COALESCE(v_cfg.absence_agent_provider, 'elevenlabs')
        )
      );
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_waitlist_offers_for_cancelled_appointment(p_appointment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_appt RECORD;
  v_cfg RECORD;
  v_clinic_id UUID;
  v_timeout_minutes INTEGER;
  v_waitlist RECORD;
  v_offer_id UUID;
  v_job_id UUID;
BEGIN
  SELECT a.*
    INTO v_appt
  FROM public.appointments a
  WHERE a.id = p_appointment_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_appt.status <> 'cancelled' AND v_appt.journey_stage <> 'cancelado' THEN
    RETURN;
  END IF;

  v_clinic_id := public.resolve_clinic_id_for_doctor(v_appt.doctor_id);

  SELECT c.*
    INTO v_cfg
  FROM public.appointment_automation_config c
  WHERE c.clinic_id = v_clinic_id
     OR c.clinic_id IS NULL
  ORDER BY
    CASE WHEN c.clinic_id = v_clinic_id THEN 0 ELSE 1 END,
    c.created_at DESC
  LIMIT 1;

  IF NOT FOUND OR COALESCE(v_cfg.waitlist_enabled, true) = false THEN
    RETURN;
  END IF;

  v_timeout_minutes := COALESCE(v_cfg.waitlist_offer_timeout_minutes, 30);

  FOR v_waitlist IN
    SELECT w.*
    FROM public.appointment_waitlist w
    WHERE w.status = 'active'
      AND (w.doctor_id IS NULL OR w.doctor_id = v_appt.doctor_id)
      AND (
        w.preferred_date IS NULL
        OR w.preferred_date = DATE(COALESCE(v_appt.scheduled_at, v_appt.appointment_date))
      )
    ORDER BY w.priority ASC, w.created_at ASC
    LIMIT 20
  LOOP
    v_offer_id := NULL;
    v_job_id := NULL;

    BEGIN
      INSERT INTO public.appointment_waitlist_offers (
        waitlist_id,
        appointment_id,
        offer_channel,
        offer_status,
        response_deadline
      )
      VALUES (
        v_waitlist.id,
        v_appt.id,
        COALESCE(v_cfg.primary_channel, 'whatsapp'),
        'pending',
        NOW() + make_interval(mins => v_timeout_minutes)
      )
      RETURNING id INTO v_offer_id;
    EXCEPTION
      WHEN unique_violation THEN
        v_offer_id := NULL;
    END;

    IF v_offer_id IS NOT NULL THEN
      v_job_id := public.enqueue_appointment_job_if_missing(
        v_appt.id,
        v_waitlist.patient_id,
        v_clinic_id,
        'oferta_lista_espera',
        COALESCE(v_cfg.primary_channel, 'whatsapp'),
        NOW(),
        jsonb_build_object(
          'offer_id', v_offer_id,
          'template', 'waitlist_offer'
        )
      );

      UPDATE public.appointment_waitlist_offers
      SET automation_job_id = COALESCE(v_job_id, automation_job_id)
      WHERE id = v_offer_id;

      UPDATE public.appointment_waitlist
      SET status = 'contacted',
          contacted_at = NOW(),
          updated_at = NOW()
      WHERE id = v_waitlist.id
        AND status = 'active';
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_enqueue_appointment_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_appointment_default_jobs(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_handle_appointment_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_new_scheduled TIMESTAMPTZ;
  v_old_scheduled TIMESTAMPTZ;
BEGIN
  v_new_scheduled := COALESCE(NEW.scheduled_at, NEW.appointment_date);
  v_old_scheduled := COALESCE(OLD.scheduled_at, OLD.appointment_date);

  IF NEW.status IN ('cancelled', 'completed')
     OR NEW.journey_stage IN ('cancelado', 'finalizado') THEN
    UPDATE public.appointment_automation_jobs
    SET status = 'cancelled',
        last_error = COALESCE(last_error, 'cancelled_by_status'),
        updated_at = NOW()
    WHERE appointment_id = NEW.id
      AND status IN ('pending', 'processing');
  END IF;

  IF NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.enqueue_waitlist_offers_for_cancelled_appointment(NEW.id);
  END IF;

  IF v_old_scheduled IS DISTINCT FROM v_new_scheduled
     AND NEW.status NOT IN ('cancelled', 'completed')
     AND NEW.journey_stage NOT IN ('cancelado', 'finalizado') THEN
    UPDATE public.appointment_automation_jobs
    SET status = 'cancelled',
        last_error = COALESCE(last_error, 'rescheduled'),
        updated_at = NOW()
    WHERE appointment_id = NEW.id
      AND status IN ('pending', 'processing')
      AND job_type IN (
        'followup_dia_consulta',
        'followup_1h_antes',
        'followup_hora_consulta',
        'contato_ausencia'
      );

    PERFORM public.enqueue_appointment_default_jobs(NEW.id);
  END IF;

  IF OLD.status IN ('cancelled', 'completed')
     AND NEW.status IN ('scheduled', 'confirmed') THEN
    PERFORM public.enqueue_appointment_default_jobs(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================
DROP TRIGGER IF EXISTS trg_sync_appointment_journey_stage ON public.appointments;
CREATE TRIGGER trg_sync_appointment_journey_stage
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_appointment_journey_stage();

DROP TRIGGER IF EXISTS trg_log_appointment_journey_history ON public.appointments;
CREATE TRIGGER trg_log_appointment_journey_history
AFTER INSERT OR UPDATE OF journey_stage, status ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.log_appointment_journey_history();

DROP TRIGGER IF EXISTS trg_enqueue_appointment_jobs ON public.appointments;
CREATE TRIGGER trg_enqueue_appointment_jobs
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.trg_enqueue_appointment_jobs();

DROP TRIGGER IF EXISTS trg_handle_appointment_updates ON public.appointments;
CREATE TRIGGER trg_handle_appointment_updates
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.trg_handle_appointment_updates();

DROP TRIGGER IF EXISTS trg_appointment_automation_config_updated_at ON public.appointment_automation_config;
CREATE TRIGGER trg_appointment_automation_config_updated_at
  BEFORE UPDATE ON public.appointment_automation_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_appointment_automation_jobs_updated_at ON public.appointment_automation_jobs;
CREATE TRIGGER trg_appointment_automation_jobs_updated_at
  BEFORE UPDATE ON public.appointment_automation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_appointment_waitlist_updated_at ON public.appointment_waitlist;
CREATE TRIGGER trg_appointment_waitlist_updated_at
  BEFORE UPDATE ON public.appointment_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_appointment_waitlist_offers_updated_at ON public.appointment_waitlist_offers;
CREATE TRIGGER trg_appointment_waitlist_offers_updated_at
  BEFORE UPDATE ON public.appointment_waitlist_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS e politicas
-- ============================================================================
ALTER TABLE public.appointment_journey_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_waitlist_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff pode ver historico de jornada" ON public.appointment_journey_history;
CREATE POLICY "Staff pode ver historico de jornada"
ON public.appointment_journey_history
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff pode inserir historico de jornada" ON public.appointment_journey_history;
CREATE POLICY "Staff pode inserir historico de jornada"
ON public.appointment_journey_history
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff pode ver configuracao de automacao" ON public.appointment_automation_config;
CREATE POLICY "Staff pode ver configuracao de automacao"
ON public.appointment_automation_config
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
);

DROP POLICY IF EXISTS "Owner e secretary podem gerenciar configuracao de automacao" ON public.appointment_automation_config;
CREATE POLICY "Owner e secretary podem gerenciar configuracao de automacao"
ON public.appointment_automation_config
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'secretary')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff pode ver jobs de automacao" ON public.appointment_automation_jobs;
CREATE POLICY "Staff pode ver jobs de automacao"
ON public.appointment_automation_jobs
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
);

DROP POLICY IF EXISTS "Owner e secretary podem gerenciar jobs de automacao" ON public.appointment_automation_jobs;
CREATE POLICY "Owner e secretary podem gerenciar jobs de automacao"
ON public.appointment_automation_jobs
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'secretary')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff pode ver lista de espera" ON public.appointment_waitlist;
CREATE POLICY "Staff pode ver lista de espera"
ON public.appointment_waitlist
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff pode gerenciar lista de espera" ON public.appointment_waitlist;
CREATE POLICY "Staff pode gerenciar lista de espera"
ON public.appointment_waitlist
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff pode ver ofertas de lista de espera" ON public.appointment_waitlist_offers;
CREATE POLICY "Staff pode ver ofertas de lista de espera"
ON public.appointment_waitlist_offers
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff pode gerenciar ofertas de lista de espera" ON public.appointment_waitlist_offers;
CREATE POLICY "Staff pode gerenciar ofertas de lista de espera"
ON public.appointment_waitlist_offers
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'doctor', 'secretary')
  )
);

-- ============================================================================
-- Realtime
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_journey_history;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_automation_config;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_automation_jobs;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_waitlist;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_waitlist_offers;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

COMMIT;
