supabase/migrations/003_indexes.sql

-- 003_indexes.sql

create index if not exists idx_profiles_tenant_role on public.profiles (tenant_id, role);
create index if not exists idx_doctors_tenant_active on public.doctors (tenant_id, is_active);

create unique index if not exists uq_patients_tenant_phone on public.patients (tenant_id, phone);
create index if not exists idx_patients_tenant_status on public.patients (tenant_id, journey_status);
create index if not exists idx_patients_tenant_source on public.patients (tenant_id, source);

create index if not exists idx_leads_tenant_status on public.leads (tenant_id, status);
create index if not exists idx_leads_tenant_channel on public.leads (tenant_id, channel);

create index if not exists idx_appt_tenant_doctor_start on public.appointments (tenant_id, doctor_id, scheduled_start_at);
create index if not exists idx_appt_tenant_patient_start on public.appointments (tenant_id, patient_id, scheduled_start_at);
create index if not exists idx_appt_tenant_status_start on public.appointments (tenant_id, status, scheduled_start_at);

create index if not exists idx_conf_tenant_sched_status on public.appointment_confirmation_attempts (tenant_id, scheduled_send_at, delivery_status);
create index if not exists idx_notif_tenant_sched_status on public.appointment_notifications (tenant_id, scheduled_send_at, delivery_status);

create index if not exists idx_att_tenant_appt_created on public.attendance_logs (tenant_id, appointment_id, created_at);
create index if not exists idx_att_tenant_event_created on public.attendance_logs (tenant_id, event_type, created_at);

create index if not exists idx_med_tenant_patient_created on public.medical_records (tenant_id, patient_id, created_at);
create index if not exists idx_med_tenant_doctor_created on public.medical_records (tenant_id, doctor_id, created_at);

create index if not exists idx_follow_tenant_sched on public.followups (tenant_id, scheduled_send_at);
create index if not exists idx_follow_tenant_type_status on public.followups (tenant_id, type, status);

create index if not exists idx_wait_entries_pick on public.waitlist_entries (tenant_id, waitlist_id, status, priority, created_at);
create index if not exists idx_wait_offers_status_exp on public.waitlist_offers (tenant_id, status, expires_at);

create index if not exists idx_events_tenant_status_created on public.system_events (tenant_id, processing_status, created_at);
create unique index if not exists uq_events_tenant_idempotency on public.system_events (tenant_id, idempotency_key) where idempotency_key is not null;

create index if not exists idx_audit_tenant_action_created on public.audit_logs (tenant_id, action, created_at);
create index if not exists idx_audit_entity on public.audit_logs (tenant_id, entity_type, entity_id);


-- === TELECONSULTA (ADD) ===
create index if not exists idx_teleint_tenant_doc on public.teleconsult_integrations (tenant_id, doctor_id);
create index if not exists idx_telemeet_tenant_appt on public.teleconsult_meetings (tenant_id, appointment_id);
create index if not exists idx_telecons_tenant_appt on public.teleconsult_consents (tenant_id, appointment_id, status);
create index if not exists idx_trans_tenant_appt on public.appointment_transcripts (tenant_id, appointment_id, status);
