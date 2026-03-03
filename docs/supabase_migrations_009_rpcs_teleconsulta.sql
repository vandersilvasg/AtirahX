-- 009_rpcs_teleconsulta.sql
-- RPCs mínimas para Teleconsulta (orientado a event-driven).

-- Solicitar consentimento (staff ou médico do appointment)
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

  -- Permissões: staff ou medico dono
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

  -- Emitir evento para automação disparar mensagem
  perform public.emit_event(
    'tele_consent_requested', 'appointment', p_appointment_id,
    jsonb_build_object('reason', p_reason, 'channel', p_channel, 'retention_days', p_retention_days),
    'tele_consent:'||p_appointment_id::text||':requested'
  );
end $$;

-- Registrar resposta do paciente (recomendado via service role / webhook handler)
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

-- Solicitar criação do meeting (ao confirmar appointment teleconsulta)
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

-- Atualizar summaries pelo médico (bloqueia edição do transcript_text via RPC)
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
