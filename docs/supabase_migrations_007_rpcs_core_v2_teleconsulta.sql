supabase/migrations/007_rpcs_core.sql

-- 007_rpcs_core.sql
-- RPCs fundamentais para manter consistência + logs

-- Helper: assert staff
create or replace function public.assert_staff()
returns void
language plpgsql as $$
begin
  if public.current_role() not in ('admin','gestor','recepcao') then
    raise exception 'forbidden';
  end if;
end $$;

-- Helper: add system event
create or replace function public.emit_event(p_event_type text, p_entity_type text, p_entity_id uuid, p_payload jsonb, p_idempotency_key text default null)
returns void
language plpgsql as $$
begin
  insert into public.system_events (tenant_id, event_type, entity_type, entity_id, payload, idempotency_key)
  values (public.current_tenant_id(), p_event_type, p_entity_type, p_entity_id, coalesce(p_payload,'{}'::jsonb), p_idempotency_key)
  on conflict (tenant_id, idempotency_key) where idempotency_key is not null
  do nothing;
end $$;

-- Helper: status log for appointment
create or replace function public.log_attendance(p_appointment_id uuid, p_event public.attendance_event_type, p_from public.appointment_status, p_to public.appointment_status, p_notes text default null)
returns void
language plpgsql as $$
begin
  insert into public.attendance_logs (tenant_id, appointment_id, event_type, from_status, to_status, created_by_profile_id, notes)
  values (public.current_tenant_id(), p_appointment_id, p_event, p_from, p_to, auth.uid(), p_notes);
end $$;

-- 1) create_appointment: checks overlap (simple) and creates AGENDADO + emits event
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
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_end_at timestamptz := p_start_at + make_interval(mins => p_duration_minutes);
  v_conflict int;
  v_id uuid;
begin
  perform public.assert_staff();

  -- Ensure same tenant relationships
  if not exists (select 1 from public.patients where id = p_patient_id and tenant_id = v_tenant) then
    raise exception 'invalid patient';
  end if;

  if not exists (select 1 from public.doctors where id = p_doctor_id and tenant_id = v_tenant) then
    raise exception 'invalid doctor';
  end if;

  -- Overlap check (V1 simple)
  select count(*) into v_conflict
  from public.appointments a
  where a.tenant_id = v_tenant
    and a.doctor_id = p_doctor_id
    and a.status not in ('cancelado','cancelado_por_nao_confirmacao')
    and tstzrange(a.scheduled_start_at, a.scheduled_end_at, '[)') && tstzrange(p_start_at, v_end_at, '[)');

  if v_conflict > 0 then
    raise exception 'overbooking';
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
end $$;

-- 2) confirm_appointment: status -> CONFIRMADO, emits event
create or replace function public.confirm_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_old public.appointment_status;
begin
  perform public.assert_staff();

  select status into v_old
  from public.appointments
  where id = p_appointment_id and tenant_id = v_tenant
  for update;

  if v_old is null then
    raise exception 'not found';
  end if;

  if v_old in ('cancelado','cancelado_por_nao_confirmacao','no_show','concluido') then
    raise exception 'cannot confirm';
  end if;

  update public.appointments
  set status = 'confirmado'
  where id = p_appointment_id and tenant_id = v_tenant;

  perform public.log_attendance(p_appointment_id, 'status_change', v_old, 'confirmado', 'appointment_confirmed');

  perform public.emit_event(
    'appointment_confirmed', 'appointment', p_appointment_id,
    jsonb_build_object('old', v_old),
    'appointment:'||p_appointment_id::text||':confirmed'
  );
end $$;

-- 3) set_appointment_status: validated transitions (basic)
create or replace function public.set_appointment_status(p_appointment_id uuid, p_new public.appointment_status, p_notes text default null)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_old public.appointment_status;
  v_doctor uuid;
  v_role text := public.current_role();
begin
  -- staff can change most; doctor can change to em_atendimento/concluido on own
  select status, doctor_id into v_old, v_doctor
  from public.appointments
  where id = p_appointment_id and tenant_id = v_tenant
  for update;

  if v_old is null then
    raise exception 'not found';
  end if;

  if v_role = 'medico' then
    if v_doctor <> public.current_doctor_id() then
      raise exception 'forbidden';
    end if;
    if p_new not in ('em_atendimento','concluido') then
      raise exception 'forbidden';
    end if;
  else
    perform public.assert_staff();
  end if;

  -- Basic guards
  if v_old in ('cancelado','cancelado_por_nao_confirmacao') and p_new <> v_old then
    raise exception 'cannot change cancelled';
  end if;

  update public.appointments
  set status = p_new,
      cancelled_at = case when p_new in ('cancelado','cancelado_por_nao_confirmacao') then now() else cancelled_at end,
      completed_at = case when p_new = 'concluido' then now() else completed_at end,
      checkin_at = case when p_new = 'em_atendimento' then now() else checkin_at end
  where id = p_appointment_id and tenant_id = v_tenant;

  perform public.log_attendance(p_appointment_id, 'status_change', v_old, p_new, p_notes);

  perform public.emit_event(
    'appointment_status_changed', 'appointment', p_appointment_id,
    jsonb_build_object('from', v_old, 'to', p_new, 'notes', p_notes),
    'appointment:'||p_appointment_id::text||':status:'||p_new::text||':'||extract(epoch from now())::bigint::text
  );
end $$;

-- 4) cancel_appointment_no_confirmation
create or replace function public.cancel_appointment_no_confirmation(p_appointment_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_old public.appointment_status;
begin
  perform public.assert_staff();

  select status into v_old
  from public.appointments
  where id = p_appointment_id and tenant_id = v_tenant
  for update;

  if v_old is null then raise exception 'not found'; end if;
  if v_old <> 'agendado' then raise exception 'invalid_state'; end if;

  update public.appointments
  set status = 'cancelado_por_nao_confirmacao',
      cancelled_at = now(),
      cancellation_reason = 'no_confirmation'
  where id = p_appointment_id and tenant_id = v_tenant;

  perform public.log_attendance(p_appointment_id, 'cancelled', v_old, 'cancelado_por_nao_confirmacao', 'auto_cancel_no_confirmation');

  perform public.emit_event(
    'appointment_cancelled_no_confirmation', 'appointment', p_appointment_id,
    '{}'::jsonb,
    'appointment:'||p_appointment_id::text||':cancel_no_conf'
  );

  -- Trigger waitlist slot opened (handled by automation)
  perform public.emit_event(
    'waitlist_slot_opened', 'appointment', p_appointment_id,
    '{}'::jsonb,
    'appointment:'||p_appointment_id::text||':slot_opened'
  );
end $$;

-- 5) offer_waitlist_slot: creates hold for next active entry
create or replace function public.offer_waitlist_slot(
  p_doctor_id uuid,
  p_slot_start timestamptz,
  p_slot_end timestamptz,
  p_hold_minutes int default 30
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_waitlist_id uuid;
  v_entry_id uuid;
  v_offer_id uuid;
  v_expires timestamptz := now() + make_interval(mins => p_hold_minutes);
begin
  perform public.assert_staff();

  select id into v_waitlist_id
  from public.waitlists
  where tenant_id = v_tenant and doctor_id = p_doctor_id and is_active = true
  limit 1;

  if v_waitlist_id is null then
    raise exception 'waitlist_not_found';
  end if;

  -- pick next entry
  select id into v_entry_id
  from public.waitlist_entries
  where tenant_id = v_tenant and waitlist_id = v_waitlist_id and status = 'active'
  order by priority desc, created_at asc
  limit 1
  for update skip locked;

  if v_entry_id is null then
    raise exception 'waitlist_empty';
  end if;

  insert into public.waitlist_offers (
    tenant_id, waitlist_id, waitlist_entry_id, doctor_id,
    appointment_slot_start_at, appointment_slot_end_at,
    status, expires_at
  ) values (
    v_tenant, v_waitlist_id, v_entry_id, p_doctor_id,
    p_slot_start, p_slot_end,
    'hold_created', v_expires
  )
  returning id into v_offer_id;

  update public.waitlist_entries
  set status = 'offered'
  where id = v_entry_id and tenant_id = v_tenant;

  perform public.emit_event(
    'waitlist_slot_offered', 'waitlist_offer', v_offer_id,
    jsonb_build_object('doctor_id', p_doctor_id, 'slot_start', p_slot_start, 'slot_end', p_slot_end, 'entry_id', v_entry_id),
    'waitlist_offer:'||v_offer_id::text||':offered'
  );

  return v_offer_id;
end $$;


-- === TELECONSULTA (ADD) RPCs ===

create or replace function public.request_teleconsult_consent(
  p_appointment_id uuid,
  p_reason text,
  p_channel text default 'whatsapp',
  p_retention_days int default 90
)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_doc uuid;
begin
  select doctor_id into v_doc
  from public.appointments
  where id = p_appointment_id and tenant_id = v_tenant
  limit 1;

  if v_doc is null then raise exception 'not found'; end if;

  if public.current_role() not in ('admin','gestor','recepcao') and v_doc <> public.current_doctor_id() then
    raise exception 'forbidden';
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

  perform public.emit_event(
    'tele_consent_requested', 'appointment', p_appointment_id,
    jsonb_build_object('reason', p_reason, 'channel', p_channel, 'retention_days', p_retention_days),
    'tele_consent:'||p_appointment_id::text||':requested'
  );
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
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_status public.consent_status := case when p_accepted then 'accepted' else 'declined' end;
begin
  update public.teleconsult_consents
  set status = v_status,
      responded_at = now(),
      response_channel = p_response_channel,
      responder_identity = p_responder_identity
  where tenant_id = v_tenant and appointment_id = p_appointment_id;

  update public.appointments
  set consent_for_recording = p_accepted
  where tenant_id = v_tenant and id = p_appointment_id;

  perform public.emit_event(
    case when p_accepted then 'tele_consent_accepted' else 'tele_consent_declined' end,
    'appointment', p_appointment_id,
    jsonb_build_object('response_channel', p_response_channel),
    'tele_consent:'||p_appointment_id::text||':'||v_status::text
  );
end $$;

create or replace function public.request_tele_meeting_create(p_appointment_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_mode public.appointment_mode;
begin
  select mode into v_mode
  from public.appointments
  where id = p_appointment_id and tenant_id = v_tenant;

  if v_mode <> 'teleconsulta' then
    return;
  end if;

  perform public.emit_event(
    'tele_meeting_create_requested', 'appointment', p_appointment_id,
    '{}'::jsonb,
    'tele_meet:'||p_appointment_id::text||':request'
  );
end $$;

create or replace function public.update_transcript_summaries(
  p_appointment_id uuid,
  p_structured_summary jsonb,
  p_patient_summary text
)
returns void
language plpgsql
security definer
as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_doc uuid;
begin
  select doctor_id into v_doc
  from public.appointments
  where id = p_appointment_id and tenant_id = v_tenant;

  if v_doc is null then raise exception 'not found'; end if;
  if public.current_role() <> 'medico' or v_doc <> public.current_doctor_id() then
    raise exception 'forbidden';
  end if;

  update public.appointment_transcripts
  set structured_summary = coalesce(p_structured_summary,'{}'::jsonb),
      patient_summary = p_patient_summary
  where tenant_id = v_tenant and appointment_id = p_appointment_id;

  perform public.emit_event(
    'transcript_summaries_updated', 'appointment', p_appointment_id,
    '{}'::jsonb,
    'transcript:'||p_appointment_id::text||':summaries_updated'
  );
end $$;
