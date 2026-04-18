import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { extractMessageText, listMedxSessions, listMessagesBySession, MedxSession } from '@/lib/medxHistory';
import { getSupabaseClient, getSupabaseModule } from '@/lib/supabaseClientLoader';

type RealtimeRow = Record<string, unknown> | null;

type SessionContact = {
  id: string;
  name: string | null;
  phone: string | null;
};

type DoctorProfile = {
  id: string;
  name: string;
  specialization?: string | null;
};

type DoctorJoinRow = {
  doctor_id: string;
  is_primary: boolean;
  profiles: DoctorProfile | DoctorProfile[] | null;
};

export type ClassifiedSession = MedxSession & {
  kind: 'patient' | 'pre_patient' | 'unknown';
  displayName?: string;
};

type UseWhatsAppConversationDataParams = {
  search: string;
  selectedSessionId: string | null;
  setSelectedSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  tab: 'pre' | 'crm' | 'all';
};

function getStringField(row: RealtimeRow, key: string): string | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const value = row[key];
  return typeof value === 'string' ? value : undefined;
}

function toDoctorProfile(value: DoctorProfile | DoctorProfile[] | null): DoctorProfile | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function useWhatsAppConversationData({
  search,
  selectedSessionId,
  setSelectedSessionId,
  tab,
}: UseWhatsAppConversationDataParams) {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['medx_sessions'],
    queryFn: () => listMedxSessions(1000),
    staleTime: 30_000,
  });

  const { data: patientsMin = [] } = useQuery({
    queryKey: ['patients_min'],
    queryFn: async () => {
      const supabase = await getSupabaseClient();
      const { data } = await supabase.from('patients').select('id, name, phone');
      return (data as SessionContact[]) ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: prePatientsMin = [] } = useQuery({
    queryKey: ['pre_patients_min'],
    queryFn: async () => {
      const supabase = await getSupabaseClient();
      const { data } = await supabase.from('pre_patients').select('id, name, phone');
      return (data as SessionContact[]) ?? [];
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].sessionId);
    }
  }, [selectedSessionId, setSelectedSessionId, sessions]);

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['medx_messages', selectedSessionId],
    queryFn: () =>
      selectedSessionId ? listMessagesBySession(selectedSessionId) : Promise.resolve([]),
    enabled: !!selectedSessionId,
    staleTime: 10_000,
  });

  useEffect(() => {
    let isActive = true;
    let cleanup = () => {};

    void (async () => {
      const { supabase } = await getSupabaseModule();
      if (!isActive) return;

      const channel = supabase
        .channel('realtime:medx_history-ui')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'medx_history' },
          (payload) => {
            queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
            const sessionId = getStringField(payload.new as RealtimeRow, 'session_id');
            if (sessionId && sessionId === selectedSessionId) {
              queryClient.invalidateQueries({ queryKey: ['medx_messages', selectedSessionId] });
            }
          }
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
          queryClient.invalidateQueries({ queryKey: ['patients_min'] });
          queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pre_patients' }, () => {
          queryClient.invalidateQueries({ queryKey: ['pre_patients_min'] });
          queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'patient_doctors' },
          (payload) => {
            const patientId =
              getStringField(payload.new as RealtimeRow, 'patient_id') ||
              getStringField(payload.old as RealtimeRow, 'patient_id');
            if (patientId === selectedSessionId) {
              queryClient.invalidateQueries({ queryKey: ['assigned_doctor', selectedSessionId] });
            }
          }
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
      };
    })();

    return () => {
      isActive = false;
      cleanup();
    };
  }, [queryClient, selectedSessionId]);

  const patientsMap = useMemo(() => {
    const map = new Map<string, SessionContact>();
    patientsMin.forEach((patient) => map.set(patient.id, patient));
    return map;
  }, [patientsMin]);

  const prePatientsMap = useMemo(() => {
    const map = new Map<string, SessionContact>();
    prePatientsMin.forEach((prePatient) => map.set(prePatient.id, prePatient));
    return map;
  }, [prePatientsMin]);

  const classifiedSessions = useMemo<ClassifiedSession[]>(() => {
    return sessions.map((session) => {
      const patient = patientsMap.get(session.sessionId);
      if (patient) {
        return { ...session, kind: 'patient', displayName: patient.name ?? undefined };
      }

      const prePatient = prePatientsMap.get(session.sessionId);
      if (prePatient) {
        return { ...session, kind: 'pre_patient', displayName: prePatient.name ?? undefined };
      }

      return { ...session, kind: 'unknown' };
    });
  }, [patientsMap, prePatientsMap, sessions]);

  const selectedSession = useMemo(() => {
    return classifiedSessions.find((session) => session.sessionId === selectedSessionId) ?? null;
  }, [classifiedSessions, selectedSessionId]);

  const patientPhone = useMemo(() => {
    if (!selectedSessionId) return null;

    const rawPhone =
      patientsMap.get(selectedSessionId)?.phone ??
      prePatientsMap.get(selectedSessionId)?.phone ??
      null;

    if (!rawPhone) return null;

    return rawPhone.trim().replace(/@s\.whatsapp\.net$/i, '');
  }, [patientsMap, prePatientsMap, selectedSessionId]);

  const { data: assignedDoctor, refetch: refetchAssignedDoctor } = useQuery({
    queryKey: ['assigned_doctor', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return null;
      const supabase = await getSupabaseClient();

      const { data: primaryData, error: primaryError } = await supabase
        .from('patient_doctors')
        .select(
          `
          doctor_id,
          is_primary,
          profiles!inner(id, name, specialization)
        `
        )
        .eq('patient_id', selectedSessionId)
        .eq('is_primary', true)
        .maybeSingle<DoctorJoinRow>();

      const primaryProfile = toDoctorProfile(primaryData?.profiles ?? null);
      if (!primaryError && primaryProfile) {
        return {
          id: primaryProfile.id,
          name: primaryProfile.name,
          specialization: primaryProfile.specialization,
        };
      }

      const { data: anyData, error: anyError } = await supabase
        .from('patient_doctors')
        .select(
          `
          doctor_id,
          is_primary,
          profiles!inner(id, name, specialization)
        `
        )
        .eq('patient_id', selectedSessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<DoctorJoinRow>();

      const fallbackProfile = toDoctorProfile(anyData?.profiles ?? null);
      if (anyError || !fallbackProfile) {
        console.log('Nenhum medico atribuido ainda');
        return null;
      }

      return {
        id: fallbackProfile.id,
        name: fallbackProfile.name,
        specialization: fallbackProfile.specialization,
      };
    },
    enabled: !!selectedSessionId,
  });

  const filteredSessions = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = classifiedSessions;
    if (tab === 'pre') list = list.filter((session) => session.kind === 'pre_patient');
    if (tab === 'crm') list = list.filter((session) => session.kind === 'patient');
    if (!term) return list;

    return list.filter((session) => {
      const name = (session.displayName ?? '').toLowerCase();
      return (
        session.sessionId.toLowerCase().includes(term) ||
        name.includes(term) ||
        extractMessageText(session.lastMessagePreview).toLowerCase().includes(term)
      );
    });
  }, [classifiedSessions, search, tab]);

  return {
    assignedDoctor,
    filteredSessions,
    loadingMessages,
    loadingSessions,
    messages,
    patientPhone,
    refetchAssignedDoctor,
    selectedSession,
  };
}
