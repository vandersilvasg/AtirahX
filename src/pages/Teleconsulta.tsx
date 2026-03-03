import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAvailableDoctorsNow } from '@/hooks/useAvailableDoctorsNow';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePatientData } from '@/hooks/usePatientData';
import { webhookRequest } from '@/lib/webhookClient';
import { MedicalRecordsList } from '@/components/patients/MedicalRecordsList';
import { Mic, MicOff, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type MediaCaptureRefs = {
  micStream: MediaStream;
  displayStream: MediaStream | null;
  audioContext: AudioContext;
  processor: ScriptProcessorNode;
  micSource: MediaStreamAudioSourceNode;
  micGain: GainNode;
  tabSource: MediaStreamAudioSourceNode | null;
  tabGain: GainNode | null;
};

type FinalizedTranscriptResponse =
  | {
      output?: string;
      summary?: string;
      resumo?: string;
      chief_complaint?: string;
      queixa_principal?: string;
      diagnosis?: string;
      diagnostico?: string;
      treatment_plan?: string;
      plano_tratamento?: string;
    }
  | Array<{
      output?: string;
      summary?: string;
      resumo?: string;
      chief_complaint?: string;
      queixa_principal?: string;
      diagnosis?: string;
      diagnostico?: string;
      treatment_plan?: string;
      plano_tratamento?: string;
    }>;

type UpcomingTeleconsultation = {
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

// Hook para transcrição com AssemblyAI
const useAssemblyAITranscription = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaCaptureRefs | null>(null);
  const fullTranscriptRef = useRef<string>(''); // Mantém transcrição completa acumulada
  const lastPartialRef = useRef<string>(''); // Mantém última transcrição parcial
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [partialTranscript, setPartialTranscript] = useState<string>('');

  const startTranscription = async (teleconsultationId: string, patientName: string, doctorName: string) => {
    try {
      // Primeiro, obtenha um token temporário do seu backend
      // Você deve criar este endpoint para proteger sua API key
      const tokenResponse = await webhookRequest<{ token: string }>('/assemblyai-token', {
        method: 'POST',
        body: {
          teleconsultationId,
          purpose: 'teleconsulta',
        },
      });
      
      const { token } = tokenResponse;
      
      // Conecta ao WebSocket da AssemblyAI (v3) com MESMOS parâmetros do playground
      const wsUrl = new URL('wss://streaming.assemblyai.com/v3/ws');
      wsUrl.searchParams.set('token', token);
      wsUrl.searchParams.set('sample_rate', '16000');
      wsUrl.searchParams.set('format_turns', 'true');
      wsUrl.searchParams.set('language', 'multi');
      wsUrl.searchParams.set('encoding', 'pcm_s16le');
      
      // Parâmetros EXATOS do playground (note os valores diferentes!)
      wsUrl.searchParams.set('end_of_turn_confidence_threshold', '0.7');
      wsUrl.searchParams.set('min_end_of_turn_silence_when_confident', '160');
      wsUrl.searchParams.set('max_turn_silence', '2400');
      
      // Palavras-chave médicas (pode adicionar mais conforme necessário)
      const medicalKeywords = [
        'médico', 'paciente', 'consulta', 'exame', 'diagnóstico',
        'tratamento', 'medicamento', 'sintoma', 'dor', 'febre',
        'pressão', 'diabetes', 'hipertensão', 'receita', 'prontuário'
      ];
      // Opcional: melhorar reconhecimento de termos médicos (formato v3)
      wsUrl.searchParams.set('keyterms_prompt', JSON.stringify(medicalKeywords));
      
      console.log('Conectando ao WebSocket v3 com URL:', wsUrl.toString());
      wsRef.current = new WebSocket(wsUrl.toString());
      
      // Reseta transcrição ao iniciar nova sessão
      fullTranscriptRef.current = '';
      lastPartialRef.current = '';
      setTranscript('');
      setPartialTranscript('');
      
      let mediaStarted = false;

      const startMediaCapture = async () => {
        if (mediaStarted) return;
        mediaStarted = true;
        // Inicia captura do microfone
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });

        // Tenta capturar áudio da aba (para incluir o áudio do paciente no iframe)
        let displayStream: MediaStream | null = null;
        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } catch (e) {
          console.warn('Captura de áudio da aba não autorizada ou não suportada. Apenas microfone será transcrito.');
        }

        const audioContext = new AudioContext({ sampleRate: 16000 });
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        // Fontes e ganhos para mixar sem clipping
        const micSource = audioContext.createMediaStreamSource(micStream);
        const micGain = audioContext.createGain();
        micGain.gain.value = 0.8;
        micSource.connect(micGain);
        micGain.connect(processor);

        let tabSource: MediaStreamAudioSourceNode | null = null;
        let tabGain: GainNode | null = null;
        if (displayStream && displayStream.getAudioTracks().length > 0) {
          try {
            tabSource = audioContext.createMediaStreamSource(displayStream);
            tabGain = audioContext.createGain();
            tabGain.gain.value = 0.8;
            tabSource.connect(tabGain);
            tabGain.connect(processor);
            console.log('Áudio da aba conectado ao mix para transcrição.');
          } catch (e) {
            console.warn('Falha ao conectar áudio da aba. Prosseguindo apenas com microfone.');
          }
        } else {
          console.warn('Nenhuma trilha de áudio da aba disponível. Confirme que selecionou "Compartilhar áudio".');
        }

        // Necessário manter o nó processando
        processor.connect(audioContext.destination);

        let frameCount = 0;
        processor.onaudioprocess = (e) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            frameCount++;
            if (frameCount <= 3) {
              console.log(`Frame ${frameCount} - PCM samples:`, pcmData.length, 'bytes:', pcmData.buffer.byteLength);
              console.log('Primeiros 10 samples PCM:', Array.from(pcmData.slice(0, 10)));
            }

            if (frameCount === 1) {
              console.log('Enviando ArrayBuffer binário, tamanho:', pcmData.buffer.byteLength);
            }
            wsRef.current.send(pcmData.buffer);
          }
        };

        // Salva referências para limpeza
        mediaRecorderRef.current = { 
          micStream, 
          displayStream, 
          audioContext, 
          processor, 
          micSource, 
          micGain, 
          tabSource, 
          tabGain 
        };
      };
      
      wsRef.current.onopen = async () => {
        console.log('Conectado ao AssemblyAI');
        setIsTranscribing(true);
      };
      
      wsRef.current.onmessage = (message) => {
        console.log('Mensagem recebida do AssemblyAI:', message.data);
        const res = JSON.parse(message.data);
        console.log('Mensagem parseada:', res);
        
        // AssemblyAI v3 envia type: 'Begin' para iniciar a sessão
        if (res.type === 'Begin') {
          console.log('Sessão AssemblyAI iniciada (Begin)', res);
          // Pequeno delay antes de iniciar captura
          setTimeout(() => {
            startMediaCapture().catch(console.error);
          }, 100);
          return;
        }

        // v3 usa type: 'Turn' para transcrições
        if (res.type === 'Turn') {
          const text = res.transcript || '';
          const isEndOfTurn = res.end_of_turn || false;
          const isFormatted = res.turn_is_formatted || false;
          
          // Acumula transcrições quando termina de falar (end_of_turn)
          if (isEndOfTurn && text) {
            const label = isFormatted ? '✅ Transcrição FINAL FORMATADA' : '✅ Transcrição FINAL';
            console.log(label + ':', text);
            fullTranscriptRef.current += text + ' ';
            setTranscript(fullTranscriptRef.current);
            setPartialTranscript('');
          } else if (!isEndOfTurn && text) {
            // Transcrição parcial (enquanto ainda está falando)
            console.log('📝 Transcrição parcial:', text);
            lastPartialRef.current = text; // Salva última parcial
            setPartialTranscript(text);
          }
        }
        // Logar mensagens não reconhecidas
        else {
          console.log('⚠️ Mensagem não reconhecida do AssemblyAI:', res);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        setIsTranscribing(false);
      };
      
      wsRef.current.onclose = (ev) => {
        console.log('Desconectado do AssemblyAI', { code: ev.code, reason: ev.reason });
        setIsTranscribing(false);
      };
      
      return true;
    } catch (error) {
      console.error('Erro ao iniciar transcrição:', error);
      setIsTranscribing(false);
      return false;
    }
  };
  
  const stopTranscription = async (teleconsultationId: string) => {
    // Captura transcrição completa + última parcial se não tiver nada acumulado
    let currentTranscript = fullTranscriptRef.current;
    
    // Se não tem transcrição acumulada mas tem parcial, usa a parcial
    if (currentTranscript.trim().length === 0 && lastPartialRef.current.trim().length > 0) {
      console.log('⚠️ Usando transcrição parcial pois não há final');
      currentTranscript = lastPartialRef.current;
    }
    
    console.log('🛑 Encerrando transcrição...');
    console.log('Transcrição acumulada:', currentTranscript);
    console.log('Tamanho:', currentTranscript.length, 'caracteres');
    
    // Para a gravação (agora usamos WebAudio + múltiplas fontes)
    if (mediaRecorderRef.current) {
      const refs = mediaRecorderRef.current;
      try {
        if (refs.processor) {
          refs.processor.disconnect();
        }
        if (refs.micGain) {
          refs.micGain.disconnect();
        }
        if (refs.micSource) {
          refs.micSource.disconnect();
        }
        if (refs.tabGain) {
          refs.tabGain.disconnect();
        }
        if (refs.tabSource) {
          refs.tabSource.disconnect();
        }
      } catch (cleanupError) {
        console.error('Falha ao liberar nos de audio', cleanupError);
      }
      try {
        if (refs.audioContext) {
          await refs.audioContext.close();
        }
      } catch (cleanupError) {
        console.error('Falha ao fechar contexto de audio', cleanupError);
      }
      try {
        if (refs.micStream) {
          refs.micStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        if (refs.displayStream) {
          refs.displayStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
      } catch (cleanupError) {
        console.error('Falha ao encerrar streams de captura', cleanupError);
      }
    }
    
    // Fecha WebSocket
    if (wsRef.current) {
      // Envia comando de finalização
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'Terminate' }));
      }
      wsRef.current.close();
    }
    
    // Salva transcrição completa quando encerrar e recebe resumo
    console.log('📤 Enviando transcrição completa para webhook...');
    
    if (currentTranscript.trim().length > 0) {
      try {
        const payload = {
          teleconsultationId,
          fullTranscript: currentTranscript.trim(),
          timestamp: new Date().toISOString(),
          wordCount: currentTranscript.trim().split(/\s+/).length,
          charCount: currentTranscript.trim().length
        };
        
        console.log('Payload:', payload);
        
        const result = await webhookRequest<FinalizedTranscriptResponse>('/finalizar-transcricao', {
          method: 'POST',
          body: payload,
        });

        console.log('✅ Transcrição completa enviada com sucesso');
        console.log('📋 Resumo recebido:', result);

        return result; // Retorna o resumo para ser processado
      } catch (error) {
        console.error('❌ Erro ao enviar transcrição completa:', error);
        return null;
      }
    } else {
      console.log('⚠️ Nenhuma transcrição para enviar (vazia)');
      return null;
    }
    
    setIsTranscribing(false);
  };
  
  return { 
    startTranscription, 
    stopTranscription, 
    isTranscribing, 
    transcript, 
    partialTranscript 
  };
};

export default function Teleconsulta() {
  const { user } = useAuth(); // Pega o usuário autenticado
  const { availableDoctors, loading: loadingDoctors, error: errorDoctors } = useAvailableDoctorsNow();
  const [upcoming, setUpcoming] = useState<UpcomingTeleconsultation[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState<boolean>(false);
  const [errorUpcoming, setErrorUpcoming] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<null | {
    roomName: string;
    password: string;
    patientName: string;
    patientPhone?: string | null;
    patientId: string;
    doctorName: string;
    urlPatient: string;
    urlDoctor: string;
    teleconsultationId: string;
  }>(null);

  const { patient, medicalRecords, loading: loadingPatientData } = usePatientData(activePatientId);
  
  // Hook de transcrição
  const { 
    startTranscription, 
    stopTranscription, 
    isTranscribing, 
    transcript, 
    partialTranscript 
  } = useAssemblyAITranscription();
  
  const currentTeleconsultationRef = useRef<string>('');
  const currentPatientNameRef = useRef<string>('');
  const currentDoctorNameRef = useRef<string>('');

  const normalizeName = (name: string) => {
    const cleaned = (name || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const first = parts[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    const joined = `${first}${last}`;
    return joined.replace(/[^a-z]/g, '');
  };

  const generateId = () => {
    let out = '';
    for (let i = 0; i < 5; i++) out += Math.floor(Math.random() * 10).toString();
    return out;
  };

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < 12; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  };

  useEffect(() => {
    const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      setErrorUpcoming(null);
      try {
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
      } catch (e: unknown) {
        setErrorUpcoming(e instanceof Error ? e.message : 'Erro ao carregar próximas teleconsultas');
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcoming();
  }, []);

  return (
    <DashboardLayout requiredRoles={['owner', 'doctor']}>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teleconsulta</h1>
          <p className="text-muted-foreground mt-1">Atendimento remoto por vídeo com transcrição automática</p>
        </div>

        {/* Médicos disponíveis agora */}
        <MagicBentoCard contentClassName="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Médicos disponíveis agora</h2>
            <p className="text-sm text-muted-foreground">Com base na tabela de horários</p>
          </div>
          {loadingDoctors ? (
            <p className="text-muted-foreground">Carregando médicos…</p>
          ) : errorDoctors ? (
            <p className="text-destructive">Erro: {errorDoctors}</p>
          ) : availableDoctors.length === 0 ? (
            <p className="text-muted-foreground">Nenhum médico disponível neste momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableDoctors.map(({ doctorId, profile }) => {
                const displayName = profile.name || 'Médico(a)';
                const initials = displayName
                  .split(' ')
                  .filter(Boolean)
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <Card key={doctorId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex-row items-center gap-4">
                      <Avatar>
                        <AvatarImage src={undefined} alt={displayName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-lg">{displayName}</CardTitle>
                        <CardDescription className="truncate">{profile.specialization || 'Clínico(a)'}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button size="sm" className="w-full" variant="secondary">
                        Iniciar teleconsulta
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </MagicBentoCard>

        {/* Próximas TeleConsultas */}
        <MagicBentoCard contentClassName="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Próximas TeleConsultas</h2>
            <p className="text-sm text-muted-foreground">Baseadas em agendamentos futuros</p>
          </div>
          {loadingUpcoming ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : errorUpcoming ? (
            <p className="text-destructive">Erro: {errorUpcoming}</p>
          ) : upcoming.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma teleconsulta futura.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((t) => {
                const appt = t.appointments;
                const when = appt?.scheduled_at ? new Date(appt.scheduled_at) : (t.start_time ? new Date(t.start_time) : null);
                const patientName = appt?.patients?.name || 'Paciente';
                const patientPhone = appt?.patients?.phone || null;
                const doctorName = appt?.doctor_profile?.name || 'Médico(a)';
                const handleStart = () => {
                  const id5 = generateId();
                  const pass = generatePassword();
                  const normalized = normalizeName(patientName);
                  const room = `${normalized}${id5}`;
                  const urlPatient = `https://vdo.ninja/?room=${room}&password=${pass}&webcam&autostart`;
                  const urlDoctor = `https://vdo.ninja/?room=${room}&password=${pass}&webcam&autostart&embed`;
                  setPendingInvite({ 
                    roomName: room, 
                    password: pass, 
                    patientName, 
                    patientPhone, 
                    patientId: appt?.patient_id, 
                    doctorName, 
                    urlPatient, 
                    urlDoctor, 
                    teleconsultationId: t.id 
                  });
                  setConfirmOpen(true);
                };
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{patientName}</div>
                      <div className="text-sm text-muted-foreground truncate">Com {doctorName}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium">{when ? when.toLocaleDateString() : '-'}</div>
                      <div className="text-xs text-muted-foreground">{when ? when.toLocaleTimeString() : '-'}</div>
                      <div className="mt-2">
                        <Button size="sm" onClick={handleStart}>Iniciar teleconsulta</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MagicBentoCard>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Iniciar Teleconsulta</DialogTitle>
              <DialogDescription>
                Deseja enviar o link de acesso para o paciente via WhatsApp?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={async () => {
                try {
                  if (pendingInvite) {
                    await supabase
                      .from('teleconsultations')
                      .update({ meeting_url: pendingInvite.urlPatient })
                      .eq('id', pendingInvite.teleconsultationId);
                    setEmbedUrl(pendingInvite.urlDoctor);
                    setActivePatientId(pendingInvite.patientId || null);
                    
                    // Salva refs para transcrição
                    currentTeleconsultationRef.current = pendingInvite.teleconsultationId;
                    currentPatientNameRef.current = pendingInvite.patientName;
                    currentDoctorNameRef.current = pendingInvite.doctorName;
                    
                    // Inicia transcrição automaticamente após 3 segundos
                    setTimeout(() => {
                      startTranscription(
                        pendingInvite.teleconsultationId,
                        pendingInvite.patientName,
                        pendingInvite.doctorName
                      );
                    }, 3000);
                  }
                } finally {
                  setConfirmOpen(false);
                }
              }}>Não enviar, apenas abrir</Button>
              <Button onClick={async () => {
                try {
                  if (pendingInvite) {
                    await supabase
                      .from('teleconsultations')
                      .update({ meeting_url: pendingInvite.urlPatient })
                      .eq('id', pendingInvite.teleconsultationId);
                    await webhookRequest('/enviar-link', {
                      method: 'POST',
                      body: {
                        paciente_nome: pendingInvite.patientName,
                        paciente_telefone: pendingInvite.patientPhone,
                        url_participacao: pendingInvite.urlPatient,
                        medico_nome: pendingInvite.doctorName,
                      },
                    });
                    setEmbedUrl(pendingInvite.urlDoctor);
                    setActivePatientId(pendingInvite.patientId || null);
                    
                    // Salva refs para transcrição
                    currentTeleconsultationRef.current = pendingInvite.teleconsultationId;
                    currentPatientNameRef.current = pendingInvite.patientName;
                    currentDoctorNameRef.current = pendingInvite.doctorName;
                    
                    // Inicia transcrição automaticamente após 3 segundos
                    setTimeout(() => {
                      startTranscription(
                        pendingInvite.teleconsultationId,
                        pendingInvite.patientName,
                        pendingInvite.doctorName
                      );
                    }, 3000);
                  }
                } finally {
                  setConfirmOpen(false);
                }
              }}>Sim, enviar e abrir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {embedUrl && (
          <MagicBentoCard contentClassName="p-3">
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-xl font-semibold">Teleconsulta em andamento</h2>
              <div className="flex items-center gap-2">
                {/* Indicador de transcrição */}
                {isTranscribing ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                    <Mic className="h-4 w-4 text-green-600 animate-pulse" />
                    <span className="text-xs text-green-600">Transcrevendo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/10 border border-gray-500/20 rounded-md">
                    <MicOff className="h-4 w-4 text-gray-600" />
                    <span className="text-xs text-gray-600">Transcrição pausada</span>
                  </div>
                )}
                
                {/* Botão para mostrar/ocultar transcrição */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {showTranscript ? 'Ocultar' : 'Ver'} Transcrição
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (isTranscribing) {
                      const resumo = await stopTranscription(currentTeleconsultationRef.current);
                      
                      // Se recebeu resumo, salva no prontuário
                      if (resumo && activePatientId) {
                        try {
                          console.log('💾 Salvando resumo no prontuário...');
                          console.log('💾 Resumo recebido:', resumo);
                          console.log('💾 Doctor ID:', user?.id);
                          
                          if (!user?.id) {
                            console.error('❌ Usuário não autenticado');
                            return;
                          }
                          
                          // Extrai o texto do resumo (webhook retorna array com objeto { output: "texto" })
                          let textoResumo = '';
                          
                          if (Array.isArray(resumo) && resumo.length > 0 && resumo[0].output) {
                            textoResumo = resumo[0].output;
                          } else if (resumo.output) {
                            textoResumo = resumo.output;
                          } else if (resumo.summary) {
                            textoResumo = resumo.summary;
                          } else if (resumo.resumo) {
                            textoResumo = resumo.resumo;
                          } else if (typeof resumo === 'string') {
                            textoResumo = resumo;
                          } else {
                            textoResumo = JSON.stringify(resumo);
                          }
                          
                          console.log('💾 Texto extraído:', textoResumo);
                          
                          const { data, error } = await supabase
                            .from('medical_records')
                            .insert({
                              patient_id: activePatientId,
                              doctor_id: user.id, // Usa o ID do perfil do contexto de autenticação
                              appointment_date: new Date().toISOString(),
                              notes: textoResumo,
                              chief_complaint: resumo.chief_complaint || resumo.queixa_principal || null,
                              diagnosis: resumo.diagnosis || resumo.diagnostico || null,
                              treatment_plan: resumo.treatment_plan || resumo.plano_tratamento || null
                            });
                          
                          if (error) {
                            console.error('❌ Erro ao salvar prontuário:', error);
                          } else {
                            console.log('✅ Prontuário salvo com sucesso:', data);
                          }
                        } catch (error) {
                          console.error('❌ Erro ao processar resumo:', error);
                        }
                      }
                    }
                    setEmbedUrl(null);
                    setActivePatientId(null);
                    setShowTranscript(false);
                  }}
                >
                  Encerrar
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 xl:col-span-8">
                <div className="w-full rounded-md overflow-hidden border">
                  <iframe
                    src={embedUrl}
                    title="Teleconsulta"
                    className="w-full h-[70vh] bg-black"
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                  />
                </div>
                
                {/* Área de transcrição */}
                {showTranscript && (
                  <Card className="mt-4">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Transcrição em Tempo Real</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-48 overflow-y-auto">
                      <div className="text-sm space-y-2">
                        {transcript && (
                          <p className="text-foreground">{transcript}</p>
                        )}
                        {partialTranscript && (
                          <p className="text-muted-foreground italic">{partialTranscript}...</p>
                        )}
                        {!transcript && !partialTranscript && (
                          <p className="text-muted-foreground">Aguardando áudio...</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="col-span-12 xl:col-span-4">
                <Card className="h-[70vh] overflow-hidden">
                  <CardHeader className="py-4">
                    <CardTitle className="text-lg truncate">{patient?.name || 'Paciente'}</CardTitle>
                    <CardDescription>Prontuário</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(70vh-80px)] overflow-y-auto">
                    {loadingPatientData ? (
                      <p className="text-muted-foreground">Carregando dados…</p>
                    ) : (
                      <MedicalRecordsList records={medicalRecords} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </MagicBentoCard>
        )}
      </div>
    </DashboardLayout>
  );
}

