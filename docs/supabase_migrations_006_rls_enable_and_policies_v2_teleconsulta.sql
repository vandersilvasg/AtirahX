-- 006_rls_enable_and_policies.sql

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.leads enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_confirmation_attempts enable row level security;
alter table public.appointment_notifications enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.medical_records enable row level security;
alter table public.followups enable row level security;
alter table public.waitlists enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.waitlist_offers enable row level security;
alter table public.system_events enable row level security;
alter table public.audit_logs enable row level security;

-- Helper macro: tenant isolation policies are explicit per table (Supabase doesn't have macros)

-- tenants: read own tenant
drop policy if exists tenants_select_own on public.tenants;
create policy tenants_select_own
on public.tenants
for select
using (id = public.current_tenant_id());

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select
on public.profiles
for select
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin','gestor')
    or id = auth.uid()
  )
);

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin
on public.profiles
for insert
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'admin'
);

drop policy if exists profiles_update_admin_or_self on public.profiles;
create policy profiles_update_admin_or_self
on public.profiles
for update
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() = 'admin'
    or id = auth.uid()
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() = 'admin'
    or id = auth.uid()
  )
);

-- doctors
drop policy if exists doctors_select on public.doctors;
create policy doctors_select
on public.doctors
for select
using (tenant_id = public.current_tenant_id());

drop policy if exists doctors_write_admin on public.doctors;
create policy doctors_write_admin
on public.doctors
for all
using (tenant_id = public.current_tenant_id() and public.current_role() = 'admin')
with check (tenant_id = public.current_tenant_id() and public.current_role() = 'admin');

-- patients
drop policy if exists patients_select on public.patients;
create policy patients_select
on public.patients
for select
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin','gestor','recepcao')
    or exists (
      select 1 from public.appointments a
      where a.patient_id = patients.id
        and a.doctor_id = public.current_doctor_id()
        and a.tenant_id = public.current_tenant_id()
    )
  )
);

drop policy if exists patients_write_staff on public.patients;
create policy patients_write_staff
on public.patients
for insert
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin','gestor','recepcao')
);

drop policy if exists patients_update_staff on public.patients;
create policy patients_update_staff
on public.patients
for update
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin','gestor','recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin','gestor','recepcao')
);

-- leads
drop policy if exists leads_select on public.leads;
create policy leads_select
on public.leads
for select
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin','gestor','recepcao')
    or (
      patient_id is not null and exists (
        select 1 from public.appointments a
        where a.patient_id = leads.patient_id
          and a.doctor_id = public.current_doctor_id()
          and a.tenant_id = public.current_tenant_id()
      )
    )
  )
);

drop policy if exists leads_write_staff on public.leads;
create policy leads_write_staff
on public.leads
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin','gestor','recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin','gestor','recepcao')
);

-- appointments
drop policy if exists appointments_select on public.appointments;
create policy appointments_select
on public.appointments
for select
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin','gestor','recepcao')
    or doctor_id = public.current_doctor_id()
  )
);

drop policy if exists appointments_insert_staff on public.appointments;
create policy appointments_insert_staff
on public.appointments
for insert
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin','gestor','recepcao')
);

drop policy if exists appointments_update_staff_or_doctor on public.appointments;
create policy appointments_update_staff_or_doctor
on public.appointments
for update
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin','gestor','recepcao')
    or doctor_id = public.current_doctor_id()
  )
)
with check (tenant_id = public.current_tenant_id());

-- confirmations & notifications & attendance logs: mirror appointment visibility
drop policy if exists conf_select on public.appointment_confirmation_attempts;
create policy conf_select
on public.appointment_confirmation_attempts
for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.appointments a
    where a.id = appointment_confirmation_attempts.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin','gestor','recepcao')
        or a.doctor_id = public.current_doctor_id()
      )
  )
);

drop policy if exists notif_select on public.appointment_notifications;
create policy notif_select
on public.appointment_notifications
for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.appointments a
    where a.id = appointment_notifications.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin','gestor','recepcao')
        or a.doctor_id = public.current_doctor_id()
      )
  )
);

drop policy if exists attendance_select on public.attendance_logs;
create policy attendance_select
on public.attendance_logs
for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.appointments a
    where a.id = attendance_logs.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin','gestor','recepcao')
        or a.doctor_id = public.current_doctor_id()
      )
  )
);

-- For writes on these operational tables: staff only (use RPC/service role ideally)
drop policy if exists conf_write_staff on public.appointment_confirmation_attempts;
create policy conf_write_staff
on public.appointment_confirmation_attempts
for all
using (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'))
with check (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'));

drop policy if exists notif_write_staff on public.appointment_notifications;
create policy notif_write_staff
on public.appointment_notifications
for all
using (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'))
with check (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'));

drop policy if exists attendance_write_staff_or_doctor on public.attendance_logs;
create policy attendance_write_staff_or_doctor
on public.attendance_logs
for insert
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin','gestor','recepcao')
    or exists (
      select 1 from public.appointments a
      where a.id = attendance_logs.appointment_id
        and a.doctor_id = public.current_doctor_id()
        and a.tenant_id = public.current_tenant_id()
    )
  )
);

-- medical_records (LGPD)
drop policy if exists med_select on public.medical_records;
create policy med_select
on public.medical_records
for select
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() = 'admin'
    or (public.current_role() = 'medico' and doctor_id = public.current_doctor_id())
  )
);

drop policy if exists med_insert_doctor on public.medical_records;
create policy med_insert_doctor
on public.medical_records
for insert
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'medico'
  and doctor_id = public.current_doctor_id()
);

drop policy if exists med_update_doctor on public.medical_records;
create policy med_update_doctor
on public.medical_records
for update
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'medico'
  and doctor_id = public.current_doctor_id()
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'medico'
  and doctor_id = public.current_doctor_id()
);

-- followups: staff read/write, doctors read related (optional) - keep simple
drop policy if exists followups_staff on public.followups;
create policy followups_staff
on public.followups
for all
using (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'))
with check (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'));

-- waitlists: staff read/write, doctor read own
drop policy if exists waitlists_select on public.waitlists;
create policy waitlists_select
on public.waitlists
for select
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin','gestor','recepcao')
    or doctor_id = public.current_doctor_id()
  )
);

drop policy if exists waitlists_write_staff on public.waitlists;
create policy waitlists_write_staff
on public.waitlists
for all
using (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'))
with check (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'));

drop policy if exists waitlist_entries_select on public.waitlist_entries;
create policy waitlist_entries_select
on public.waitlist_entries
for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.waitlists w
    where w.id = waitlist_entries.waitlist_id
      and w.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin','gestor','recepcao')
        or w.doctor_id = public.current_doctor_id()
      )
  )
);

drop policy if exists waitlist_entries_write_staff on public.waitlist_entries;
create policy waitlist_entries_write_staff
on public.waitlist_entries
for all
using (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'))
with check (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'));

drop policy if exists waitlist_offers_select on public.waitlist_offers;
create policy waitlist_offers_select
on public.waitlist_offers
for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.waitlists w
    where w.id = waitlist_offers.waitlist_id
      and w.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin','gestor','recepcao')
        or w.doctor_id = public.current_doctor_id()
      )
  )
);

drop policy if exists waitlist_offers_write_staff on public.waitlist_offers;
create policy waitlist_offers_write_staff
on public.waitlist_offers
for all
using (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'))
with check (tenant_id = public.current_tenant_id() and public.current_role() in ('admin','gestor','recepcao'));

-- system_events & audit_logs: deny for users (use service role/RPC)
drop policy if exists system_events_deny on public.system_events;
create policy system_events_deny
on public.system_events
for all
using (false)
with check (false);

drop policy if exists audit_logs_deny on public.audit_logs;
create policy audit_logs_deny
on public.audit_logs
for all
using (false)
with check (false);


-- === TELECONSULTA (ADD) enable RLS ===
alter table public.teleconsult_integrations enable row level security;
alter table public.teleconsult_meetings enable row level security;
alter table public.teleconsult_consents enable row level security;
alter table public.appointment_transcripts enable row level security;


-- === TELECONSULTA (ADD) POLICIES ===

-- teleconsult_integrations
drop policy if exists teleint_select on public.teleconsult_integrations;
create policy teleint_select
on public.teleconsult_integrations
for select
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() = 'admin'
    or doctor_id = public.current_doctor_id()
  )
);

drop policy if exists teleint_write on public.teleconsult_integrations;
create policy teleint_write
on public.teleconsult_integrations
for all
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() = 'admin'
    or doctor_id = public.current_doctor_id()
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() = 'admin'
    or doctor_id = public.current_doctor_id()
  )
);

-- teleconsult_meetings
drop policy if exists telemeet_select on public.teleconsult_meetings;
create policy telemeet_select
on public.teleconsult_meetings
for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.appointments a
    where a.id = teleconsult_meetings.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin','gestor','recepcao')
        or a.doctor_id = public.current_doctor_id()
      )
  )
);

drop policy if exists telemeet_write_staff on public.teleconsult_meetings;
create policy telemeet_write_staff
on public.teleconsult_meetings
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin','gestor','recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin','gestor','recepcao')
);

-- teleconsult_consents
drop policy if exists telecons_select on public.teleconsult_consents;
create policy telecons_select
on public.teleconsult_consents
for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.appointments a
    where a.id = teleconsult_consents.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin','gestor','recepcao')
        or a.doctor_id = public.current_doctor_id()
      )
  )
);

drop policy if exists telecons_insert_staff_doc on public.teleconsult_consents;
create policy telecons_insert_staff_doc
on public.teleconsult_consents
for insert
with check (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.appointments a
    where a.id = teleconsult_consents.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin','gestor','recepcao')
        or a.doctor_id = public.current_doctor_id()
      )
  )
);

-- appointment_transcripts (select restrito; updates via RPC recomendado)
drop policy if exists transcripts_select on public.appointment_transcripts;
create policy transcripts_select
on public.appointment_transcripts
for select
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.appointments a
    where a.id = appointment_transcripts.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and (
        public.current_role() = 'admin'
        or a.doctor_id = public.current_doctor_id()
      )
  )
);

drop policy if exists transcripts_update_doctor on public.appointment_transcripts;
create policy transcripts_update_doctor
on public.appointment_transcripts
for update
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1 from public.appointments a
    where a.id = appointment_transcripts.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and a.doctor_id = public.current_doctor_id()
  )
)
with check (tenant_id = public.current_tenant_id());

-- Nota: para impedir alteração de transcript_text, use RPC/trigger (ver 009).
