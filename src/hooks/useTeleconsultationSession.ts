import { useEffect, useRef, useState } from 'react';
import type { FinalizedTranscriptResponse } from '@/hooks/useAssemblyAITranscription';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { webhookRequest } from '@/lib/webhookClient';

export type UpcomingTeleconsultation = {
  id: string;
  start_time?: string | null;
  appointments?: {
    patient_id?: string | null;
    scheduled_at?: string | null;
    patients?: {
      name?: string | null;
      phone?: string | null;
    } | null;
    doctor_profile?: {
      name?: string | null;
    } | null;
  } | null;
};

type PendingInvite = {
  roomName: string;
  password: string;
  patientName: string;
  patientPhone?: string | null;
  patientId: string;
  doctorName: string;
  urlPatient: string;
  urlDoctor: string;
  teleconsultationId: string;
};

type UseTeleconsultationSessionParams = {
  startTranscription: (
    teleconsultationId: string,
    patientName: string,
    doctorName: string
  ) => Promise<boolean>;
  stopTranscription: (
    teleconsultationId: string
  ) => Promise<FinalizedTranscriptResponse | null>;
  userId?: string;
};

function normalizeName(name: string) {
  const cleaned = (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  return `${first}${last}`.replace(/[^a-z]/g, '');
}

function generateId() {
  let out = '';
  for (let i = 0; i < 5; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

function generatePassword() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function extractSummaryText(summary: FinalizedTranscriptResponse) {
  if (Array.isArray(summary) && summary.length > 0 && summary[0].output) return summary[0].output;
  if (!Array.isArray(summary) && summary.output) return summary.output;
  if (!Array.isArray(summary) && summary.summary) return summary.summary;
  if (!Array.isArray(summary) && summary.resumo) return summary.resumo;
  if (typeof summary === 'string') return summary;
  return JSON.stringify(summary);
}

export function useTeleconsultationSession({
  startTranscription,
  stopTranscription,
  userId,
}: UseTeleconsultationSessionParams) {
  const [upcoming, setUpcoming] = useState<UpcomingTeleconsultation[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [errorUpcoming, setErrorUpcoming] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);

  const currentTeleconsultationRef = useRef('');
  const currentPatientNameRef = useRef('');
  const currentDoctorNameRef = useRef('');

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      setErrorUpcoming(null);
      try {
        const supabase = await getSupabaseClient();
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('teleconsultations')
          .select(
            `id, appointment_id, start_time, end_time, status, meeting_url,
             appointments!inner(id, appointment_date, patient_id, doctor_id,
               patients:patient_id(name, phone),
               doctor_profile:doctor_id(name)
             )`
          )
          .eq('status', 'scheduled')
          .gte('appointments.appointment_date', nowIso)
          .order('appointment_date', { ascending: true, foreignTable: 'appointments' })
          .limit(8);

        if (error) throw error;
        setUpcoming(data || []);
      } catch (error: unknown) {
        setErrorUpcoming(error instanceof Error ? error.message : 'Erro ao carregar proximas teleconsultas');
      } finally {
        setLoadingUpcoming(false);
      }
    };

    void fetchUpcoming();
  }, []);

  const prepareInvite = (teleconsultation: UpcomingTeleconsultation) => {
    const appointment = teleconsultation.appointments;
    const patientName = appointment?.patients?.name || 'Paciente';
    const patientPhone = appointment?.patients?.phone || null;
    const doctorName = appointment?.doctor_profile?.name || 'Medico(a)';
    const room = `${normalizeName(patientName)}${generateId()}`;
    const password = generatePassword();
    const urlPatient = `https://vdo.ninja/?room=${room}&password=${password}&webcam&autostart`;
    const urlDoctor = `https://vdo.ninja/?room=${room}&password=${password}&webcam&autostart&embed`;

    setPendingInvite({
      roomName: room,
      password,
      patientName,
      patientPhone,
      patientId: appointment?.patient_id || '',
      doctorName,
      urlPatient,
      urlDoctor,
      teleconsultationId: teleconsultation.id,
    });
    setConfirmOpen(true);
  };

  const startSession = async (sendInvite: boolean) => {
    try {
      if (!pendingInvite) return;
      const supabase = await getSupabaseClient();

      await supabase
        .from('teleconsultations')
        .update({ meeting_url: pendingInvite.urlPatient })
        .eq('id', pendingInvite.teleconsultationId);

      if (sendInvite) {
        await webhookRequest('/enviar-link', {
          method: 'POST',
          body: {
            paciente_nome: pendingInvite.patientName,
            paciente_telefone: pendingInvite.patientPhone,
            url_participacao: pendingInvite.urlPatient,
            medico_nome: pendingInvite.doctorName,
          },
        });
      }

      setEmbedUrl(pendingInvite.urlDoctor);
      setActivePatientId(pendingInvite.patientId || null);
      currentTeleconsultationRef.current = pendingInvite.teleconsultationId;
      currentPatientNameRef.current = pendingInvite.patientName;
      currentDoctorNameRef.current = pendingInvite.doctorName;

      setTimeout(() => {
        void startTranscription(
          pendingInvite.teleconsultationId,
          pendingInvite.patientName,
          pendingInvite.doctorName
        );
      }, 3000);
    } finally {
      setConfirmOpen(false);
    }
  };

  const endSession = async (isTranscribing: boolean) => {
    if (isTranscribing) {
      const summary = await stopTranscription(currentTeleconsultationRef.current);

      if (summary && activePatientId && userId) {
        try {
          const supabase = await getSupabaseClient();
          const textSummary = extractSummaryText(summary);
          const normalizedSummary = Array.isArray(summary) ? summary[0] ?? {} : summary;

          const { error } = await supabase.from('medical_records').insert({
            patient_id: activePatientId,
            doctor_id: userId,
            appointment_date: new Date().toISOString(),
            notes: textSummary,
            chief_complaint: normalizedSummary.chief_complaint || normalizedSummary.queixa_principal || null,
            diagnosis: normalizedSummary.diagnosis || normalizedSummary.diagnostico || null,
            treatment_plan:
              normalizedSummary.treatment_plan || normalizedSummary.plano_tratamento || null,
          });

          if (error) {
            console.error('Erro ao salvar prontuario:', error);
          }
        } catch (error) {
          console.error('Erro ao processar resumo:', error);
        }
      }
    }

    setEmbedUrl(null);
    setActivePatientId(null);
    setShowTranscript(false);
  };

  return {
    activePatientId,
    confirmOpen,
    embedUrl,
    endSession,
    errorUpcoming,
    loadingUpcoming,
    pendingInvite,
    prepareInvite,
    setConfirmOpen,
    setShowTranscript,
    showTranscript,
    startSession,
    upcoming,
  };
}
