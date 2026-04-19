supabase/migrations/002_tables

-- 002_tables.sql
-- Extensions (if needed)
create extension if not exists pgcrypto;

-- 2.1 tenants
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Sao_Paulo',
  locale text not null default 'pt-BR',
  plan_id text null,
  active_modules jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 profiles (app users)
create table if not exists public.profiles (
  id uuid primary key, -- should match auth.users.id
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'recepcao',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email)
);

-- 2.3 doctors
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete set null,
  name text not null,
  specialty text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.4 patients
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text null,
  document text null,
  birth_date date null,
  notes text null,
  journey_status public.patient_journey_status not null default 'lead',
  source text not null default 'manual', -- whatsapp_inbound, leadads_meta, leadads_google, landing, manual, outbound_list
  tags text[] null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.5 leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid null references public.patients(id) on delete set null,
  full_name text null,
  phone text not null,
  channel public.lead_channel not null,
  status public.lead_status not null default 'new',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  duration_minutes int not null,
  status public.appointment_status not null default 'agendado',
  location_name text null,
  location_address text null,
  telehealth_url text null,
  instructions text null,
  created_by_profile_id uuid null references public.profiles(id) on delete set null,
  cancellation_reason text null,
  cancelled_at timestamptz null,
  checkin_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.1 appointment_confirmation_attempts
create table if not exists public.appointment_confirmation_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  attempt_number int not null check (attempt_number between 1 and 3),
  scheduled_send_at timestamptz not null,
  sent_at timestamptz null,
  delivery_status public.message_delivery_status not null default 'queued',
  provider_message_id text null,
  response public.confirmation_response not null default 'none',
  responded_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, attempt_number)
);

-- 4.2 appointment_notifications (D-0 reminders)
create table if not exists public.appointment_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  type public.appointment_notification_type not null,
  scheduled_send_at timestamptz not null,
  sent_at timestamptz null,
  delivery_status public.message_delivery_status not null default 'queued',
  provider_message_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, type)
);

-- 5.1 attendance_logs
create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type public.attendance_event_type not null,
  from_status public.appointment_status null,
  to_status public.appointment_status null,
  created_by_profile_id uuid null references public.profiles(id) on delete set null,
  notes text null,
  created_at timestamptz not null default now()
);

-- 6.1 medical_records
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  content jsonb not null default '{}'::jsonb,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  updated_by_profile_id uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7.1 followups
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid null references public.appointments(id) on delete set null,
  type public.followup_type not null,
  scheduled_send_at timestamptz not null,
  sent_at timestamptz null,
  status public.followup_status not null default 'queued',
  template_key text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8.1 waitlists
create table if not exists public.waitlists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  is_active boolean not null default true,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, doctor_id)
);

-- 8.2 waitlist_entries
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  desired_start_date date null,
  desired_end_date date null,
  preferred_time_window jsonb null,
  priority int not null default 0,
  status public.waitlist_entry_status not null default 'active',
  notes text null,
  created_by_profile_id uuid null references public.profiles(id) on delete set null,
  converted_appointment_id uuid null references public.appointments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, waitlist_id, patient_id)
);

-- 8.3 waitlist_offers
create table if not exists public.waitlist_offers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  waitlist_id uuid not null references public.waitlists(id) on delete cascade,
  waitlist_entry_id uuid not null references public.waitlist_entries(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  appointment_slot_start_at timestamptz not null,
  appointment_slot_end_at timestamptz not null,
  status public.waitlist_offer_status not null default 'hold_created',
  expires_at timestamptz not null,
  claimed_at timestamptz null,
  declined_at timestamptz null,
  system_notes text null,
  provider_message_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10.1 system_events (event bus)
create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  processing_status public.system_event_status not null default 'pending',
  processed_at timestamptz null,
  processed_by text null,
  retry_count int not null default 0,
  last_error text null,
  idempotency_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11.1 audit_logs (minimal)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  ip_address text null,
  user_agent text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);


-- === TELECONSULTA (ADD) ===

-- Doctors: habilita teleconsulta
alter table public.doctors
  add column if not exists allow_teleconsultation boolean not null default false;

-- Appointments: modalidade + campos teleconsulta + consentimento
alter table public.appointments
  add column if not exists mode public.appointment_mode not null default 'presencial',
  add column if not exists teleconsultation_provider public.tele_provider null,
  add column if not exists teleconsultation_link text null,
  add column if not exists teleconsultation_event_id text null,
  add column if not exists consent_for_recording boolean not null default false;

-- Integração OAuth do médico (Google Calendar)
create table if not exists public.teleconsult_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  provider public.tele_provider not null default 'google_meet',
  google_calendar_id text null,
  refresh_token_ciphertext text not null,
  scopes text[] null,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, doctor_id, provider)
);

-- Meeting gerado (evento/calendar/meet link)
create table if not exists public.teleconsult_meetings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  provider public.tele_provider not null default 'google_meet',
  google_event_id text null,
  meet_link text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, appointment_id)
);

-- Consentimento LGPD (gravação para transcrição)
create table if not exists public.teleconsult_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  status public.consent_status not null default 'pending',
  requested_at timestamptz not null default now(),
  responded_at timestamptz null,
  request_channel text null,
  request_reason text null,
  response_channel text null,
  responder_identity text null,
  retention_days int not null default 90,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, appointment_id)
);

-- Transcrição e resumo (imutável + resumo editável pelo médico)
create table if not exists public.appointment_transcripts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  provider text null,
  status public.transcript_status not null default 'pending',
  transcript_text text null,
  structured_summary jsonb not null default '{}'::jsonb,
  patient_summary text null,
  confidence_score numeric null,
  patient_summary_sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, appointment_id)
);
