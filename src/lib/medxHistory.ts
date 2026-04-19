import { getSupabaseClient } from '@/lib/supabaseClientLoader';

export type MedxHistoryRow = {
  id: number;
  session_id: string;
  message: unknown;
  data_e_hora?: string;
  media?: string | null;
};

export type MedxSession = {
  sessionId: string;
  totalMessages: number;
  lastMessageId: number;
  lastMessagePreview: string;
  kind?: 'patient' | 'pre_patient' | 'unknown';
  displayName?: string;
};

type MedxContentPart = {
  text?: string;
};

type MedxMessageObject = {
  type?: string;
  content?: string | MedxContentPart[] | unknown;
};

function extractPatientMessage(text: string): string {
  const label = 'mensagem do paciente:';
  const lower = text.toLowerCase();
  const idx = lower.indexOf(label);
  if (idx < 0) return '';

  const after = text.slice(idx + label.length);
  const stopMarkers = [
    '\n\n',
    '\nInformaÃ§Ãµes do Paciente:',
    '\nInformacoes do Paciente:',
    'InformaÃ§Ãµes do Paciente:',
    'Informacoes do Paciente:',
  ];

  let endIdx = -1;
  for (const marker of stopMarkers) {
    const pos = after.indexOf(marker);
    if (pos >= 0) {
      endIdx = endIdx === -1 ? pos : Math.min(endIdx, pos);
    }
  }

  return after.slice(0, endIdx >= 0 ? endIdx : after.length).trim();
}

export function extractMessageText(message: unknown): string {
  if (!message) return '';
  if (typeof message === 'string') return message;

  const typedMessage = message as MedxMessageObject;

  if (typeof typedMessage.content === 'string') {
    const base = typedMessage.content;
    const type = typeof typedMessage.type === 'string' ? typedMessage.type.toLowerCase() : '';

    if (type === 'human') {
      const extracted = extractPatientMessage(base);
      if (extracted) return extracted;
    }

    return base;
  }

  if (Array.isArray(typedMessage.content)) {
    const first = typedMessage.content.find(
      (contentPart): contentPart is string | MedxContentPart =>
        typeof contentPart === 'string' ||
        (typeof contentPart === 'object' &&
          contentPart !== null &&
          typeof (contentPart as MedxContentPart).text === 'string')
    );

    if (!first) return '';

    const type = typeof typedMessage.type === 'string' ? typedMessage.type.toLowerCase() : '';
    const text = typeof first === 'string' ? first : (first.text ?? '');

    if (type === 'human') {
      const extracted = extractPatientMessage(text);
      if (extracted) return extracted;
    }

    return text;
  }

  return JSON.stringify(message);
}

export async function listMedxSessions(limitRows: number = 500): Promise<MedxSession[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('medx_history')
    .select('id, session_id, message')
    .order('id', { ascending: false })
    .limit(limitRows);

  if (error) throw error;

  const bySession = new Map<string, MedxSession>();

  (data as MedxHistoryRow[]).forEach((row) => {
    const existing = bySession.get(row.session_id);
    const preview = extractMessageText(row.message).slice(0, 120);

    if (!existing) {
      bySession.set(row.session_id, {
        sessionId: row.session_id,
        totalMessages: 1,
        lastMessageId: row.id,
        lastMessagePreview: preview,
      });
    } else {
      existing.totalMessages += 1;
      if (row.id > existing.lastMessageId) {
        existing.lastMessageId = row.id;
        existing.lastMessagePreview = preview;
      }
    }
  });

  const sessions = Array.from(bySession.values());
  sessions.sort((a, b) => b.lastMessageId - a.lastMessageId);

  try {
    const [patientsResp, prePatientsResp] = await Promise.all([
      supabase.from('patients').select('id, name'),
      supabase.from('pre_patients').select('id, name'),
    ]);

    const patients = new Map<string, string>();
    const prePatients = new Map<string, string>();

    if (!patientsResp.error) {
      (patientsResp.data as { id: string; name: string }[] | null)?.forEach((patient) =>
        patients.set(patient.id, patient.name)
      );
    }

    if (!prePatientsResp.error) {
      (prePatientsResp.data as { id: string; name: string }[] | null)?.forEach((patient) =>
        prePatients.set(patient.id, patient.name)
      );
    }

    sessions.forEach((session) => {
      if (patients.has(session.sessionId)) {
        session.kind = 'patient';
        session.displayName = patients.get(session.sessionId);
      } else if (prePatients.has(session.sessionId)) {
        session.kind = 'pre_patient';
        session.displayName = prePatients.get(session.sessionId);
      } else {
        session.kind = 'unknown';
      }
    });
  } catch {
    sessions.forEach((session) => {
      session.kind = session.kind ?? 'unknown';
    });
  }

  return sessions;
}

export async function listMessagesBySession(sessionId: string): Promise<MedxHistoryRow[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('medx_history')
    .select('id, session_id, message, data_e_hora, media')
    .eq('session_id', sessionId)
    .order('id', { ascending: true });

  if (error) throw error;
  return (data as MedxHistoryRow[]) ?? [];
}
