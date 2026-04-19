-- 001_enums.sql

do $$ begin
  create type public.user_role as enum ('admin','gestor','recepcao','medico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.patient_journey_status as enum ('lead','qualificado','em_retencao','inativo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum ('new','in_progress','qualified','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_channel as enum ('whatsapp','leadads','landing','manual','outbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum (
    'agendado','confirmado','nao_confirmado',
    'cancelado','cancelado_por_nao_confirmacao',
    'em_atendimento','no_show','concluido'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_delivery_status as enum ('queued','sent','delivered','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.confirmation_response as enum ('confirmed','declined','none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_notification_type as enum ('day_morning','one_hour','on_time');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_event_type as enum ('checkin','no_show','completed','cancelled','status_change');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.followup_type as enum ('post_visit','review_request','retention','reactivation');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.followup_status as enum ('queued','sent','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.waitlist_entry_status as enum ('active','offered','paused','removed','converted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.waitlist_offer_status as enum ('hold_created','claimed','expired','declined','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.triggered_by_type as enum ('system','user','ia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.system_event_status as enum ('pending','processing','done','failed');
exception when duplicate_object then null; end $$;


-- === TELECONSULTA (ADD) ===
do $$ begin
  create type public.appointment_mode as enum ('presencial','teleconsulta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tele_provider as enum ('google_meet','zoom','custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.consent_status as enum ('pending','accepted','declined','expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transcript_status as enum ('pending','processing','ready','error');
exception when duplicate_object then null; end $$;
