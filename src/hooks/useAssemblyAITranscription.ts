import { useRef, useState } from 'react';
import { webhookRequest } from '@/lib/webhookClient';

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

export type FinalizedTranscriptResponse =
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

export function useAssemblyAITranscription() {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaCaptureRefs | null>(null);
  const fullTranscriptRef = useRef('');
  const lastPartialRef = useRef('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');

  const startTranscription = async (
    teleconsultationId: string,
    _patientName: string,
    _doctorName: string
  ) => {
    try {
      const tokenResponse = await webhookRequest<{ token: string }>('/assemblyai-token', {
        method: 'POST',
        body: {
          teleconsultationId,
          purpose: 'teleconsulta',
        },
      });

      const { token } = tokenResponse;
      const wsUrl = new URL('wss://streaming.assemblyai.com/v3/ws');
      wsUrl.searchParams.set('token', token);
      wsUrl.searchParams.set('sample_rate', '16000');
      wsUrl.searchParams.set('format_turns', 'true');
      wsUrl.searchParams.set('language', 'multi');
      wsUrl.searchParams.set('encoding', 'pcm_s16le');
      wsUrl.searchParams.set('end_of_turn_confidence_threshold', '0.7');
      wsUrl.searchParams.set('min_end_of_turn_silence_when_confident', '160');
      wsUrl.searchParams.set('max_turn_silence', '2400');
      wsUrl.searchParams.set(
        'keyterms_prompt',
        JSON.stringify([
          'medico',
          'paciente',
          'consulta',
          'exame',
          'diagnostico',
          'tratamento',
          'medicamento',
          'sintoma',
          'dor',
          'febre',
          'pressao',
          'diabetes',
          'hipertensao',
          'receita',
          'prontuario',
        ])
      );

      wsRef.current = new WebSocket(wsUrl.toString());
      fullTranscriptRef.current = '';
      lastPartialRef.current = '';
      setTranscript('');
      setPartialTranscript('');

      let mediaStarted = false;

      const startMediaCapture = async () => {
        if (mediaStarted) return;
        mediaStarted = true;

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        let displayStream: MediaStream | null = null;
        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } catch {
          console.warn('Captura de audio da aba nao autorizada ou nao suportada. Apenas microfone sera transcrito.');
        }

        const audioContext = new AudioContext({ sampleRate: 16000 });
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
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
          } catch {
            console.warn('Falha ao conectar audio da aba. Prosseguindo apenas com microfone.');
          }
        }

        processor.connect(audioContext.destination);
        processor.onaudioprocess = (event) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const inputData = event.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const sample = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            }
            wsRef.current.send(pcmData.buffer);
          }
        };

        mediaRecorderRef.current = {
          micStream,
          displayStream,
          audioContext,
          processor,
          micSource,
          micGain,
          tabSource,
          tabGain,
        };
      };

      wsRef.current.onopen = async () => {
        setIsTranscribing(true);
      };

      wsRef.current.onmessage = (message) => {
        const response = JSON.parse(message.data);

        if (response.type === 'Begin') {
          setTimeout(() => {
            startMediaCapture().catch(console.error);
          }, 100);
          return;
        }

        if (response.type === 'Turn') {
          const text = response.transcript || '';
          const isEndOfTurn = response.end_of_turn || false;

          if (isEndOfTurn && text) {
            fullTranscriptRef.current += text + ' ';
            setTranscript(fullTranscriptRef.current);
            setPartialTranscript('');
          } else if (!isEndOfTurn && text) {
            lastPartialRef.current = text;
            setPartialTranscript(text);
          }
        }
      };

      wsRef.current.onerror = () => {
        setIsTranscribing(false);
      };

      wsRef.current.onclose = () => {
        setIsTranscribing(false);
      };

      return true;
    } catch (error) {
      console.error('Erro ao iniciar transcricao:', error);
      setIsTranscribing(false);
      return false;
    }
  };

  const stopTranscription = async (teleconsultationId: string) => {
    let currentTranscript = fullTranscriptRef.current;
    if (currentTranscript.trim().length === 0 && lastPartialRef.current.trim().length > 0) {
      currentTranscript = lastPartialRef.current;
    }

    if (mediaRecorderRef.current) {
      const refs = mediaRecorderRef.current;
      try {
        refs.processor.disconnect();
        refs.micGain.disconnect();
        refs.micSource.disconnect();
        refs.tabGain?.disconnect();
        refs.tabSource?.disconnect();
      } catch (cleanupError) {
        console.error('Falha ao liberar nos de audio', cleanupError);
      }

      try {
        await refs.audioContext.close();
      } catch (cleanupError) {
        console.error('Falha ao fechar contexto de audio', cleanupError);
      }

      try {
        refs.micStream.getTracks().forEach((track) => track.stop());
        refs.displayStream?.getTracks().forEach((track) => track.stop());
      } catch (cleanupError) {
        console.error('Falha ao encerrar streams de captura', cleanupError);
      }
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'Terminate' }));
      }
      wsRef.current.close();
    }

    if (currentTranscript.trim().length > 0) {
      try {
        return await webhookRequest<FinalizedTranscriptResponse>('/finalizar-transcricao', {
          method: 'POST',
          body: {
            teleconsultationId,
            fullTranscript: currentTranscript.trim(),
            timestamp: new Date().toISOString(),
            wordCount: currentTranscript.trim().split(/\s+/).length,
            charCount: currentTranscript.trim().length,
          },
        });
      } catch (error) {
        console.error('Erro ao enviar transcricao completa:', error);
        return null;
      }
    }

    return null;
  };

  return {
    isTranscribing,
    partialTranscript,
    startTranscription,
    stopTranscription,
    transcript,
  };
}
