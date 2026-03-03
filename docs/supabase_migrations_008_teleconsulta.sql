-- 008_teleconsulta.sql
-- Adiciona teleconsulta + integrações Google + consentimento + transcrição/resumo
-- Executar após 002_tables.sql / 003_indexes.sql.

-- 1) Enums
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

-- 2) Doctors: flags de teleconsulta e campos de integração (mínimo)
alter table public.doctors
  add column if not exists allow_teleconsultation boolean not null default false;

-- 3) Appointments: modalidade + campos de teleconsulta + consentimento
alter table public.appointments
  add column if not exists mode public.appointment_mode not null default 'presencial',
  add column if not exists teleconsultation_provider public.tele_provider null,
  add column if not exists teleconsultation_link text null,
  add column if not exists teleconsultation_event_id text null,
  add column if not exists consent_for_recording boolean not null default false;

-- 4) Tabelas novas

-- 4.1 Integração OAuth do médico (Google Calendar)
create table if not exists public.teleconsult_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  provider public.tele_provider not null default 'google_meet',
  google_calendar_id text null,
  refresh_token_ciphertext text not null, -- armazenar token protegido (ciphertext)
  scopes text[] null,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, doctor_id, provider)
);

-- 4.2 Meeting gerado (evento/calendar/meet link)
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

-- 4.3 Consentimento LGPD (gravação para transcrição)
create table if not exists public.teleconsult_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  status public.consent_status not null default 'pending',
  requested_at timestamptz not null default now(),
  responded_at timestamptz null,
  request_channel text null, -- whatsapp/email/app
  request_reason text null,
  response_channel text null,
  responder_identity text null, -- opcional (ex.: phone/email)
  retention_days int not null default 90,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, appointment_id)
);

-- 4.4 Transcrição e resumo
create table if not exists public.appointment_transcripts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  provider text null, -- whisper/gemini/etc
  status public.transcript_status not null default 'pending',
  transcript_text text null, -- escrito pelo worker; tratado como imutável
  structured_summary jsonb not null default '{}'::jsonb,
  patient_summary text null,
  confidence_score numeric null,
  patient_summary_sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, appointment_id)
);

-- 5) Índices
create index if not exists idx_teleint_tenant_doc on public.teleconsult_integrations (tenant_id, doctor_id);
create index if not exists idx_telemeet_tenant_appt on public.teleconsult_meetings (tenant_id, appointment_id);
create index if not exists idx_telecons_tenant_appt on public.teleconsult_consents (tenant_id, appointment_id, status);
create index if not exists idx_trans_tenant_appt on public.appointment_transcripts (tenant_id, appointment_id, status);

-- 6) updated_at triggers (se você usa a função set_updated_at)
do $$ begin
  create trigger trg_teleint_updated_at before update on public.teleconsult_integrations
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_telemeet_updated_at before update on public.teleconsult_meetings
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_telecons_updated_at before update on public.teleconsult_consents
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_trans_updated_at before update on public.appointment_transcripts
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
