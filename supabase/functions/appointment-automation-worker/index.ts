import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type JobType =
  | 'confirmacao_agendamento'
  | 'followup_dia_consulta'
  | 'followup_1h_antes'
  | 'followup_hora_consulta'
  | 'contato_ausencia'
  | 'oferta_lista_espera';

type JobRow = {
  id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string | null;
  job_type: JobType;
  channel: 'whatsapp' | 'phone';
  scheduled_for: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'done';
  attempt_count: number;
  max_attempts: number;
  payload: Record<string, unknown> | null;
  provider: string | null;
  provider_message_id: string | null;
  last_error: string | null;
};

type AppointmentRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string | null;
  appointment_date: string | null;
  reason: string | null;
};

type PatientRow = {
  id: string;
  name: string | null;
  phone: string | null;
};

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  name: string | null;
  role: string | null;
};

type WorkerRequest = {
  limit?: number;
  dryRun?: boolean;
  jobIds?: string[];
  onlyChannel?: 'whatsapp' | 'phone';
};

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 25;
const DEFAULT_HTTP_TIMEOUT_MS = 20000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string): string | null {
  const value = Deno.env.get(name);
  return value && value.trim().length > 0 ? value : null;
}

function parseBody(raw: unknown): Required<Pick<WorkerRequest, 'limit' | 'dryRun'>> &
  Pick<WorkerRequest, 'jobIds' | 'onlyChannel'> {
  if (!raw || typeof raw !== 'object') {
    return { limit: DEFAULT_LIMIT, dryRun: false };
  }

  const body = raw as Record<string, unknown>;
  const rawLimit = Number(body.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(MAX_LIMIT, Math.trunc(rawLimit)))
    : DEFAULT_LIMIT;

  const dryRun = Boolean(body.dryRun);

  const jobIds = Array.isArray(body.jobIds)
    ? body.jobIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : undefined;

  const onlyChannel =
    body.onlyChannel === 'whatsapp' || body.onlyChannel === 'phone' ? body.onlyChannel : undefined;

  return { limit, dryRun, jobIds, onlyChannel };
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function extractAuthUserIdFromBearer(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1];
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payloadText = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadText) as Record<string, unknown>;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

function formatScheduledAt(appointment: AppointmentRow | null): string {
  const raw = appointment?.scheduled_at ?? appointment?.appointment_date;
  if (!raw) return 'data/horario nao informado';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'data/horario nao informado';
  return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function normalizePhone(phone: string | null): string {
  if (!phone) throw new Error('Patient phone not available');
  const digits = phone.replace(/\D+/g, '');
  if (digits.length < 10) throw new Error(`Invalid patient phone: ${phone}`);
  return digits;
}

function extractProviderMessageId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const candidates = ['id', 'message_id', 'messageId', 'sid', 'call_id', 'conversation_id'];
  for (const key of candidates) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = DEFAULT_HTTP_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildMessageText(job: JobRow, appointment: AppointmentRow | null, patient: PatientRow | null, doctor: ProfileRow | null): string {
  const patientName = patient?.name || 'paciente';
  const doctorName = doctor?.name || 'sua medica/o';
  const dateLabel = formatScheduledAt(appointment);

  switch (job.job_type) {
    case 'confirmacao_agendamento':
      return `Ola ${patientName}, seu agendamento com ${doctorName} esta marcado para ${dateLabel}.`;
    case 'followup_dia_consulta':
      return `Lembrete: sua consulta com ${doctorName} acontece hoje (${dateLabel}).`;
    case 'followup_1h_antes':
      return `Lembrete: falta aproximadamente 1 hora para sua consulta com ${doctorName} (${dateLabel}).`;
    case 'followup_hora_consulta':
      return `Sua consulta com ${doctorName} esta no horario previsto (${dateLabel}).`;
    case 'contato_ausencia':
      return `Identificamos ausencia no horario da consulta (${dateLabel}). Deseja reagendar?`;
    case 'oferta_lista_espera':
      return `Temos uma vaga disponivel para ${dateLabel}. Deseja confirmar?`;
    default:
      return `Contato automatico da clinica para ${patientName}.`;
  }
}

async function assertAuthorizedStaff(
  admin: ReturnType<typeof createClient>,
  authorizationHeader: string | null
): Promise<{ authUserId: string; role: string }> {
  const authUserId = extractAuthUserIdFromBearer(authorizationHeader);
  if (!authUserId) {
    throw new Error('Unauthorized: missing or invalid bearer token');
  }

  const { data, error } = await admin
    .from('profiles')
    .select('auth_user_id, role')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error || !data || !data.role) {
    throw new Error('Forbidden: profile not found');
  }

  if (data.role !== 'owner' && data.role !== 'secretary') {
    throw new Error('Forbidden: insufficient role');
  }

  return { authUserId, role: data.role };
}

async function loadPendingJobs(
  admin: ReturnType<typeof createClient>,
  params: { limit: number; jobIds?: string[]; onlyChannel?: 'whatsapp' | 'phone' }
): Promise<JobRow[]> {
  let query = admin
    .from('appointment_automation_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(params.limit);

  if (params.jobIds && params.jobIds.length > 0) {
    query = query.in('id', params.jobIds);
  }

  if (params.onlyChannel) {
    query = query.eq('channel', params.onlyChannel);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load jobs: ${error.message}`);
  return (data || []) as JobRow[];
}

async function loadContextMaps(
  admin: ReturnType<typeof createClient>,
  jobs: JobRow[]
): Promise<{
  appointments: Map<string, AppointmentRow>;
  patients: Map<string, PatientRow>;
  doctors: Map<string, ProfileRow>;
}> {
  const appointmentIds = [...new Set(jobs.map((job) => job.appointment_id))];

  const { data: appointmentsData, error: appointmentsError } = await admin
    .from('appointments')
    .select('id, patient_id, doctor_id, scheduled_at, appointment_date, reason')
    .in('id', appointmentIds);

  if (appointmentsError) {
    throw new Error(`Failed to load appointments: ${appointmentsError.message}`);
  }

  const appointments = (appointmentsData || []) as AppointmentRow[];
  const patientIds = [...new Set(appointments.map((item) => item.patient_id).filter(Boolean))];
  const doctorIds = [...new Set(appointments.map((item) => item.doctor_id).filter(Boolean))];

  const { data: patientsData, error: patientsError } = await admin
    .from('patients')
    .select('id, name, phone')
    .in('id', patientIds);
  if (patientsError) {
    throw new Error(`Failed to load patients: ${patientsError.message}`);
  }

  const { data: doctorsData, error: doctorsError } = await admin
    .from('profiles')
    .select('id, auth_user_id, name, role')
    .in('id', doctorIds);
  if (doctorsError) {
    throw new Error(`Failed to load doctors: ${doctorsError.message}`);
  }

  return {
    appointments: new Map(appointments.map((item) => [item.id, item])),
    patients: new Map(((patientsData || []) as PatientRow[]).map((item) => [item.id, item])),
    doctors: new Map(((doctorsData || []) as ProfileRow[]).map((item) => [item.id, item])),
  };
}

async function sendWhatsApp(
  job: JobRow,
  appointment: AppointmentRow | null,
  patient: PatientRow | null,
  doctor: ProfileRow | null,
  messageText: string
): Promise<{ provider: string; providerMessageId: string | null }> {
  const webhookUrl = getRequiredEnv('AUTOMATION_WHATSAPP_WEBHOOK_URL');
  const webhookBearer = getOptionalEnv('AUTOMATION_WHATSAPP_BEARER_TOKEN');
  const patientPhone = normalizePhone(patient?.phone ?? null);

  const payload = {
    job_id: job.id,
    provider: 'whatsapp',
    template_key:
      typeof job.payload?.template === 'string' ? (job.payload.template as string) : job.job_type,
    message: messageText,
    patient: {
      id: patient?.id ?? job.patient_id,
      name: patient?.name ?? null,
      phone: patientPhone,
    },
    appointment: {
      id: appointment?.id ?? job.appointment_id,
      scheduled_at: appointment?.scheduled_at ?? appointment?.appointment_date ?? null,
      reason: appointment?.reason ?? null,
      doctor_name: doctor?.name ?? null,
    },
    metadata: job.payload ?? {},
  };

  const response = await fetchWithTimeout(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(webhookBearer ? { Authorization: `Bearer ${webhookBearer}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsed: unknown = rawText;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    throw new Error(
      `WhatsApp webhook failed (${response.status}): ${
        typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
      }`
    );
  }

  return {
    provider: 'whatsapp',
    providerMessageId: extractProviderMessageId(parsed),
  };
}

async function sendElevenLabs(
  job: JobRow,
  appointment: AppointmentRow | null,
  patient: PatientRow | null,
  doctor: ProfileRow | null,
  messageText: string
): Promise<{ provider: string; providerMessageId: string | null }> {
  const apiKey = getRequiredEnv('ELEVENLABS_API_KEY');
  const outboundUrl =
    getOptionalEnv('ELEVENLABS_OUTBOUND_URL') ||
    'https://api.elevenlabs.io/v1/convai/twilio/outbound-call';
  const agentId = getOptionalEnv('ELEVENLABS_AGENT_ID');
  const patientPhone = normalizePhone(patient?.phone ?? null);

  const payload: Record<string, unknown> = {
    to_number: patientPhone,
    phone_number: patientPhone,
    agent_id: agentId,
    text: messageText,
    patient: {
      id: patient?.id ?? job.patient_id,
      name: patient?.name ?? null,
      phone: patientPhone,
    },
    appointment: {
      id: appointment?.id ?? job.appointment_id,
      scheduled_at: appointment?.scheduled_at ?? appointment?.appointment_date ?? null,
      doctor_name: doctor?.name ?? null,
    },
    metadata: {
      job_id: job.id,
      job_type: job.job_type,
      payload: job.payload ?? {},
    },
  };

  const response = await fetchWithTimeout(outboundUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsed: unknown = rawText;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    throw new Error(
      `ElevenLabs request failed (${response.status}): ${
        typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
      }`
    );
  }

  return {
    provider: 'elevenlabs',
    providerMessageId: extractProviderMessageId(parsed),
  };
}

async function insertMessageLog(
  admin: ReturnType<typeof createClient>,
  job: JobRow,
  messageText: string,
  providerMessageId: string | null
): Promise<void> {
  const nowIso = new Date().toISOString();

  const fullPayload: Record<string, unknown> = {
    patient_id: job.patient_id,
    direction: 'outbound',
    content: messageText,
    sent_at: nowIso,
    channel: job.channel,
    appointment_id: job.appointment_id,
    automation_job_id: job.id,
    template_key:
      typeof job.payload?.template === 'string' ? (job.payload.template as string) : job.job_type,
    delivery_status: 'sent',
    provider_message_id: providerMessageId,
  };

  const { error: fullInsertError } = await admin.from('messages').insert(fullPayload);
  if (!fullInsertError) return;

  if (!/column/i.test(fullInsertError.message)) {
    throw new Error(`Failed to log message: ${fullInsertError.message}`);
  }

  const fallbackPayload = {
    patient_id: job.patient_id,
    direction: 'outbound',
    content: messageText,
    sent_at: nowIso,
  };

  const { error: fallbackError } = await admin.from('messages').insert(fallbackPayload);
  if (fallbackError) {
    throw new Error(`Failed to log message (fallback): ${fallbackError.message}`);
  }
}

async function processJob(
  admin: ReturnType<typeof createClient>,
  job: JobRow,
  maps: { appointments: Map<string, AppointmentRow>; patients: Map<string, PatientRow>; doctors: Map<string, ProfileRow> }
): Promise<{ jobId: string; status: 'sent' | 'failed' | 'skipped'; detail: string }> {
  const nowIso = new Date().toISOString();
  const nextAttempt = Number(job.attempt_count || 0) + 1;

  const { data: lockedRow, error: lockError } = await admin
    .from('appointment_automation_jobs')
    .update({
      status: 'processing',
      attempt_count: nextAttempt,
      updated_at: nowIso,
    })
    .eq('id', job.id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  if (lockError) {
    throw new Error(`Failed to lock job ${job.id}: ${lockError.message}`);
  }

  if (!lockedRow) {
    return { jobId: job.id, status: 'skipped', detail: 'Job already locked/processed' };
  }

  const lockedJob = lockedRow as JobRow;
  const appointment = maps.appointments.get(lockedJob.appointment_id) ?? null;
  const patient = maps.patients.get(lockedJob.patient_id) ?? null;
  const doctor = appointment ? maps.doctors.get(appointment.doctor_id) ?? null : null;
  const messageText = buildMessageText(lockedJob, appointment, patient, doctor);

  try {
    const useElevenLabs =
      lockedJob.channel === 'phone' ||
      (typeof lockedJob.provider === 'string' && lockedJob.provider.toLowerCase() === 'elevenlabs') ||
      (typeof lockedJob.payload?.provider === 'string' &&
        (lockedJob.payload.provider as string).toLowerCase() === 'elevenlabs');

    const sendResult = useElevenLabs
      ? await sendElevenLabs(lockedJob, appointment, patient, doctor, messageText)
      : await sendWhatsApp(lockedJob, appointment, patient, doctor, messageText);

    await insertMessageLog(admin, lockedJob, messageText, sendResult.providerMessageId);

    const { error: finishError } = await admin
      .from('appointment_automation_jobs')
      .update({
        status: 'sent',
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        last_error: null,
        executed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lockedJob.id);

    if (finishError) {
      throw new Error(`Failed to finalize job ${lockedJob.id}: ${finishError.message}`);
    }

    return { jobId: lockedJob.id, status: 'sent', detail: sendResult.provider };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const shouldFail = nextAttempt >= Number(lockedJob.max_attempts || 3);

    await admin
      .from('appointment_automation_jobs')
      .update({
        status: shouldFail ? 'failed' : 'pending',
        last_error: message.slice(0, 800),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lockedJob.id);

    return {
      jobId: lockedJob.id,
      status: 'failed',
      detail: message,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = getRequiredEnv('SUPABASE_URL');
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const admin = createClient(supabaseUrl, serviceRoleKey);

    await assertAuthorizedStaff(admin, req.headers.get('authorization'));

    const body = parseBody(await req.json().catch(() => ({})));
    const pendingJobs = await loadPendingJobs(admin, {
      limit: body.limit,
      jobIds: body.jobIds,
      onlyChannel: body.onlyChannel,
    });

    if (pendingJobs.length === 0) {
      return jsonResponse({
        ok: true,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        jobs: [],
      });
    }

    if (body.dryRun) {
      return jsonResponse({
        ok: true,
        dryRun: true,
        processed: pendingJobs.length,
        jobs: pendingJobs.map((job) => ({
          id: job.id,
          job_type: job.job_type,
          channel: job.channel,
          scheduled_for: job.scheduled_for,
          patient_id: job.patient_id,
          appointment_id: job.appointment_id,
          provider: job.provider,
        })),
      });
    }

    const maps = await loadContextMaps(admin, pendingJobs);

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const results: Array<{ jobId: string; status: 'sent' | 'failed' | 'skipped'; detail: string }> = [];

    for (const job of pendingJobs) {
      const result = await processJob(admin, job, maps);
      results.push(result);
      if (result.status === 'sent') sent += 1;
      if (result.status === 'failed') failed += 1;
      if (result.status === 'skipped') skipped += 1;
    }

    return jsonResponse({
      ok: true,
      processed: pendingJobs.length,
      sent,
      failed,
      skipped,
      jobs: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = /unauthorized/i.test(message) ? 401 : /forbidden/i.test(message) ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
});
