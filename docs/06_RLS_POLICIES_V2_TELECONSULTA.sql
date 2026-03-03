-- 06_RLS_POLICIES_V2_TELECONSULTA.sql
-- Adições/ajustes de RLS para Teleconsulta + Transcrição
-- Requer que as tabelas abaixo existam (ver migrations_008_teleconsulta.sql).

-- Helpers (garantir existência)
create or replace function public.current_tenant_id()
returns uuid language sql stable as $$
  select tenant_id from public.profiles where id = auth.uid() and is_active = true limit 1
$$;

create or replace function public.current_role()
returns text language sql stable as $$
  select role::text from public.profiles where id = auth.uid() and is_active = true limit 1
$$;

create or replace function public.current_doctor_id()
returns uuid language sql stable as $$
  select d.id from public.doctors d where d.profile_id = auth.uid() limit 1
$$;

-- Enable RLS
alter table public.teleconsult_integrations enable row level security;
alter table public.teleconsult_meetings enable row level security;
alter table public.teleconsult_consents enable row level security;
alter table public.appointment_transcripts enable row level security;

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

-- teleconsult_meetings: staff vê tudo do tenant; médico vê apenas own (via appointment.doctor_id)
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

-- teleconsult_consents: staff pode criar/ler; médico pode criar/ler own; paciente response entra via RPC/service role
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

drop policy if exists telecons_write_staff_doc on public.teleconsult_consents;
create policy telecons_write_staff_doc
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

-- appointment_transcripts: transcript_text only by service role/worker (deny for users); summaries editable by doctor own
-- 1) Deny all by default for users
drop policy if exists transcripts_deny_all on public.appointment_transcripts;
create policy transcripts_deny_all
on public.appointment_transcripts
for all
using (false)
with check (false);

-- 2) Allow doctor/admin read via a view/RPC (recomendado) OU habilitar select controlado abaixo:
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

-- 3) Allow doctor update ONLY summaries (enforced via trigger/RPC; RLS alone não garante coluna)
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
with check (
  tenant_id = public.current_tenant_id()
);

-- IMPORTANTE:
-- Para garantir que médico não altere transcript_text, implemente:
-- a) RPC update_transcript_summary() que atualiza apenas structured_summary/patient_summary
-- ou
-- b) trigger BEFORE UPDATE que bloqueia mudanças em transcript_text.
