-- 010_security_hardening_v2_teleconsulta.sql
-- Correcoes de seguranca, RBAC e concorrencia para Teleconsulta V2.
-- Este script e incremental e pode ser aplicado apos 009_rpcs_teleconsulta.sql.

-- ---------------------------------------------------------------------------
-- 1) Anti-overbooking concorrente (garantia no banco)
-- ---------------------------------------------------------------------------
create extension if not exists btree_gist;

create or replace function public.assert_staff()
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.current_role() not in ('admin', 'recepcao') then
    raise exception 'forbidden';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_overlap_active'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_no_overlap_active
      exclude using gist (
        tenant_id with =,
        doctor_id with =,
        tstzrange(scheduled_start_at, scheduled_end_at, '[)') with &&
      )
      where (status in ('agendado', 'confirmado', 'nao_confirmado', 'em_atendimento'));
  end if;
end $$;

create or replace function public.create_appointment(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_start_at timestamptz,
  p_duration_minutes int,
  p_location_name text default null,
  p_location_address text default null,
  p_telehealth_url text default null,
  p_instructions text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_end_at timestamptz := p_start_at + make_interval(mins => p_duration_minutes);
  v_id uuid;
begin
  perform public.assert_staff();

  if not exists (
    select 1
    from public.patients
    where id = p_patient_id
      and tenant_id = v_tenant
  ) then
    raise exception 'invalid patient';
  end if;

  if not exists (
    select 1
    from public.doctors
    where id = p_doctor_id
      and tenant_id = v_tenant
  ) then
    raise exception 'invalid doctor';
  end if;

  insert into public.appointments (
    tenant_id, patient_id, doctor_id,
    scheduled_start_at, scheduled_end_at, duration_minutes,
    status, location_name, location_address, telehealth_url, instructions,
    created_by_profile_id
  )
  values (
    v_tenant, p_patient_id, p_doctor_id,
    p_start_at, v_end_at, p_duration_minutes,
    'agendado', p_location_name, p_location_address, p_telehealth_url, p_instructions,
    auth.uid()
  )
  returning id into v_id;

  perform public.log_attendance(v_id, 'status_change', null, 'agendado', 'appointment_created');

  perform public.emit_event(
    'appointment_created', 'appointment', v_id,
    jsonb_build_object('patient_id', p_patient_id, 'doctor_id', p_doctor_id, 'start_at', p_start_at, 'end_at', v_end_at),
    'appointment:'||v_id::text||':created'
  );

  return v_id;
exception
  when exclusion_violation then
    raise exception 'overbooking';
end $$;

-- ---------------------------------------------------------------------------
-- 2) Hardening de self-update em profiles (evita elevacao de privilegio)
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Service role e admin podem manter fluxo administrativo.
  if auth.role() = 'service_role' or public.current_role() = 'admin' then
    return new;
  end if;

  -- Usuario comum editando o proprio registro nao pode alterar campos sensiveis.
  if new.id = auth.uid() then
    if new.role is distinct from old.role then
      raise exception 'cannot_change_role';
    end if;
    if new.tenant_id is distinct from old.tenant_id then
      raise exception 'cannot_change_tenant';
    end if;
    if new.is_active is distinct from old.is_active then
      raise exception 'cannot_change_is_active';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_profiles_self_update_guard on public.profiles;
create trigger trg_profiles_self_update_guard
before update on public.profiles
for each row
execute function public.guard_profile_self_update();

-- ---------------------------------------------------------------------------
-- 3) RBAC alinhado ao documento: gestor leitura, recepcao operacao
-- ---------------------------------------------------------------------------
drop policy if exists patients_write_staff on public.patients;
create policy patients_write_staff
on public.patients
for insert
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists patients_update_staff on public.patients;
create policy patients_update_staff
on public.patients
for update
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists leads_write_staff on public.leads;
create policy leads_write_staff
on public.leads
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists appointments_insert_staff on public.appointments;
create policy appointments_insert_staff
on public.appointments
for insert
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists appointments_update_staff_or_doctor on public.appointments;
create policy appointments_update_staff_or_doctor
on public.appointments
for update
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin', 'recepcao')
    or doctor_id = public.current_doctor_id()
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.current_role() in ('admin', 'recepcao')
    or doctor_id = public.current_doctor_id()
  )
);

drop policy if exists conf_write_staff on public.appointment_confirmation_attempts;
create policy conf_write_staff
on public.appointment_confirmation_attempts
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists notif_write_staff on public.appointment_notifications;
create policy notif_write_staff
on public.appointment_notifications
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists followups_staff on public.followups;
drop policy if exists followups_select_staff on public.followups;
drop policy if exists followups_write_staff on public.followups;

create policy followups_select_staff
on public.followups
for select
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'gestor', 'recepcao')
);

create policy followups_write_staff
on public.followups
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists waitlists_write_staff on public.waitlists;
create policy waitlists_write_staff
on public.waitlists
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists waitlist_entries_write_staff on public.waitlist_entries;
create policy waitlist_entries_write_staff
on public.waitlist_entries
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists waitlist_offers_write_staff on public.waitlist_offers;
create policy waitlist_offers_write_staff
on public.waitlist_offers
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists telemeet_write_staff on public.teleconsult_meetings;
create policy telemeet_write_staff
on public.teleconsult_meetings
for all
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() in ('admin', 'recepcao')
);

drop policy if exists telecons_insert_staff_doc on public.teleconsult_consents;
drop policy if exists telecons_write_staff_doc on public.teleconsult_consents;
create policy telecons_insert_staff_doc
on public.teleconsult_consents
for insert
with check (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.appointments a
    where a.id = teleconsult_consents.appointment_id
      and a.tenant_id = public.current_tenant_id()
      and (
        public.current_role() in ('admin', 'recepcao')
        or a.doctor_id = public.current_doctor_id()
      )
  )
);

-- ---------------------------------------------------------------------------
-- 4) RPCs de Teleconsulta com autorizacao explicita e tenant resolvido
-- ---------------------------------------------------------------------------
create or replace function public.request_teleconsult_consent(
  p_appointment_id uuid,
  p_reason text,
  p_channel text default 'whatsapp',
  p_retention_days int default 90
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant uuid;
  v_doc uuid;
  v_actor_tenant uuid := public.current_tenant_id();
begin
  if p_retention_days <= 0 then
    raise exception 'invalid_retention_days';
  end if;

  select tenant_id, doctor_id into v_tenant, v_doc
  from public.appointments
  where id = p_appointment_id
  limit 1;

  if v_tenant is null then
    raise exception 'not found';
  end if;

  if auth.role() <> 'service_role' then
    if v_actor_tenant is null or v_actor_tenant <> v_tenant then
      raise exception 'forbidden';
    end if;
    if public.current_role() not in ('admin', 'recepcao') and v_doc <> public.current_doctor_id() then
      raise exception 'forbidden';
    end if;
  end if;

  insert into public.teleconsult_consents (
    tenant_id, appointment_id, doctor_id, status,
    request_channel, request_reason, retention_days,
    expires_at
  ) values (
    v_tenant, p_appointment_id, v_doc, 'pending',
    p_channel, p_reason, p_retention_days,
    now() + make_interval(days => p_retention_days)
  )
  on conflict (tenant_id, appointment_id) do update
    set status = 'pending',
        request_channel = excluded.request_channel,
        request_reason = excluded.request_reason,
        retention_days = excluded.retention_days,
        requested_at = now(),
        expires_at = excluded.expires_at;

  insert into public.system_events (tenant_id, event_type, entity_type, entity_id, payload, idempotency_key)
  values (
    v_tenant,
    'tele_consent_requested',
    'appointment',
    p_appointment_id,
    jsonb_build_object('reason', p_reason, 'channel', p_channel, 'retention_days', p_retention_days),
    'tele_consent:'||p_appointment_id::text||':requested'
  )
  on conflict (tenant_id, idempotency_key) where idempotency_key is not null
  do nothing;
end $$;

create or replace function public.record_teleconsult_consent_response(
  p_appointment_id uuid,
  p_accepted boolean,
  p_response_channel text default 'whatsapp',
  p_responder_identity text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant uuid;
  v_doc uuid;
  v_actor_tenant uuid := public.current_tenant_id();
  v_status public.consent_status := case when p_accepted then 'accepted' else 'declined' end;
begin
  select tenant_id, doctor_id into v_tenant, v_doc
  from public.appointments
  where id = p_appointment_id
  limit 1;

  if v_tenant is null then
    raise exception 'not found';
  end if;

  if auth.role() <> 'service_role' then
    if v_actor_tenant is null or v_actor_tenant <> v_tenant then
      raise exception 'forbidden';
    end if;
    if public.current_role() not in ('admin', 'recepcao') and v_doc <> public.current_doctor_id() then
      raise exception 'forbidden';
    end if;
  end if;

  update public.teleconsult_consents
  set status = v_status,
      responded_at = now(),
      response_channel = p_response_channel,
      responder_identity = p_responder_identity
  where tenant_id = v_tenant
    and appointment_id = p_appointment_id;

  if not found then
    raise exception 'consent_not_requested';
  end if;

  update public.appointments
  set consent_for_recording = p_accepted
  where tenant_id = v_tenant
    and id = p_appointment_id;

  insert into public.system_events (tenant_id, event_type, entity_type, entity_id, payload, idempotency_key)
  values (
    v_tenant,
    case when p_accepted then 'tele_consent_accepted' else 'tele_consent_declined' end,
    'appointment',
    p_appointment_id,
    jsonb_build_object('response_channel', p_response_channel),
    'tele_consent:'||p_appointment_id::text||':'||v_status::text
  )
  on conflict (tenant_id, idempotency_key) where idempotency_key is not null
  do nothing;
end $$;

create or replace function public.request_tele_meeting_create(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant uuid;
  v_mode public.appointment_mode;
  v_doc uuid;
  v_actor_tenant uuid := public.current_tenant_id();
begin
  select tenant_id, mode, doctor_id into v_tenant, v_mode, v_doc
  from public.appointments
  where id = p_appointment_id
  limit 1;

  if v_tenant is null then
    raise exception 'not found';
  end if;

  if auth.role() <> 'service_role' then
    if v_actor_tenant is null or v_actor_tenant <> v_tenant then
      raise exception 'forbidden';
    end if;
    if public.current_role() not in ('admin', 'recepcao') and v_doc <> public.current_doctor_id() then
      raise exception 'forbidden';
    end if;
  end if;

  if v_mode <> 'teleconsulta' then
    return;
  end if;

  insert into public.system_events (tenant_id, event_type, entity_type, entity_id, payload, idempotency_key)
  values (
    v_tenant,
    'tele_meeting_create_requested',
    'appointment',
    p_appointment_id,
    '{}'::jsonb,
    'tele_meet:'||p_appointment_id::text||':request'
  )
  on conflict (tenant_id, idempotency_key) where idempotency_key is not null
  do nothing;
end $$;
