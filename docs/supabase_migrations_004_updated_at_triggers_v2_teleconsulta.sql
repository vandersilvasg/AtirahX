supabase/migrations/004_updated_at_triggers

-- 004_updated_at_triggers.sql

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

do $$ begin
  create trigger trg_tenants_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_doctors_updated_at before update on public.doctors
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_patients_updated_at before update on public.patients
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_conf_attempts_updated_at before update on public.appointment_confirmation_attempts
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_notifications_updated_at before update on public.appointment_notifications
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_medical_records_updated_at before update on public.medical_records
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_followups_updated_at before update on public.followups
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_waitlists_updated_at before update on public.waitlists
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_wait_entries_updated_at before update on public.waitlist_entries
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_wait_offers_updated_at before update on public.waitlist_offers
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_system_events_updated_at before update on public.system_events
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;


-- === TELECONSULTA (ADD) updated_at triggers ===
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
