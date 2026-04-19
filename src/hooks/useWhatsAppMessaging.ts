import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webhookRequest } from '@/lib/webhookClient';

type SendMessagePayload = {
  session_id: string;
  numero_paciente: string;
  nome_login: string;
  funcao: 'text' | 'audio' | 'arquivo';
  texto: string;
  base64?: string;
  arquivo_nome?: string;
  tipo_documento?: 'imagem' | 'arquivo';
};

type UseWhatsAppMessagingParams = {
  patientPhone: string | null;
  queryClient: QueryClient;
  selectedSessionId: string | null;
  userName?: string | null;
};

type UseWhatsAppMessagingResult = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleAttachFile: () => void;
  handleFileSelected: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleKeyPress: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleRecordAudio: () => Promise<void>;
  handleSendMessage: (
    funcao?: 'text' | 'audio' | 'arquivo',
    fileBase64?: string,
    fileName?: string
  ) => Promise<void>;
  isRecording: boolean;
  messageText: string;
  recordingTime: number;
  sending: boolean;
  setMessageText: React.Dispatch<React.SetStateAction<string>>;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Erro ao converter arquivo'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

function audioToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Erro ao converter audio'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export function useWhatsAppMessaging({
  patientPhone,
  queryClient,
  selectedSessionId,
  userName,
}: UseWhatsAppMessagingParams): UseWhatsAppMessagingResult {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (
    funcao: 'text' | 'audio' | 'arquivo' = 'text',
    fileBase64?: string,
    fileName?: string
  ) => {
    if (funcao === 'text' && !messageText.trim()) {
      toast.error('Digite uma mensagem antes de enviar');
      return;
    }

    if ((funcao === 'arquivo' || funcao === 'audio') && !fileBase64) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    if (!selectedSessionId) {
      toast.error('Selecione uma conversa primeiro');
      return;
    }

    if (!patientPhone || patientPhone.trim() === '') {
      toast.error('Paciente nao possui numero de telefone cadastrado');
      return;
    }

    if (!userName) {
      toast.error('Usuario nao identificado. Faca login novamente.');
      return;
    }

    const messageToSend = funcao === 'text' ? messageText.trim() : fileBase64 || '';
    const cleanPhone = patientPhone.replace(/@s\.whatsapp\.net$/i, '');

    setSending(true);

    try {
      const payload: SendMessagePayload = {
        session_id: selectedSessionId,
        numero_paciente: cleanPhone,
        nome_login: userName,
        funcao,
        texto: '',
      };

      if (funcao === 'text') {
        payload.texto = messageToSend;
      } else {
        payload.base64 = messageToSend;
        payload.arquivo_nome = fileName;

        if (funcao === 'arquivo' && fileName) {
          const ext = fileName.split('.').pop()?.toLowerCase();
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];
          payload.tipo_documento = imageExtensions.includes(ext || '') ? 'imagem' : 'arquivo';
        }
      }

      await webhookRequest<unknown>('/enviar-mensagem', {
        method: 'POST',
        body: payload,
      });

      toast.success('Mensagem enviada com sucesso!');
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['medx_messages', selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao enviar mensagem. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const handleAttachFile = () => {
    if (!selectedSessionId) {
      toast.error('Selecione uma conversa primeiro');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho maximo: 10MB');
      return;
    }

    try {
      setSending(true);
      toast.info('Convertendo arquivo...');
      const base64 = await fileToBase64(file);
      await handleSendMessage('arquivo', base64, file.name);
    } catch (error) {
      console.error('[WhatsApp] Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo. Tente novamente.');
      setSending(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRecordAudio = async () => {
    if (isRecording) {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const maxSize = 5 * 1024 * 1024;
        if (audioBlob.size > maxSize) {
          toast.error('Audio muito grande. Maximo: 5MB');
          setRecordingTime(0);
          return;
        }

        try {
          setSending(true);
          toast.info('Convertendo audio...');
          const base64 = await audioToBase64(audioBlob);
          const fileName = `audio_${Date.now()}.webm`;
          await handleSendMessage('audio', base64, fileName);
          setRecordingTime(0);
        } catch (error) {
          console.error('[WhatsApp] Erro ao processar audio:', error);
          toast.error('Erro ao processar audio');
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('Gravando audio...');
    } catch (error) {
      console.error('[WhatsApp] Erro ao acessar microfone:', error);
      toast.error('Nao foi possivel acessar o microfone. Verifique as permissoes.');
    }
  };

  return {
    fileInputRef,
    handleAttachFile,
    handleFileSelected,
    handleKeyPress,
    handleRecordAudio,
    handleSendMessage,
    isRecording,
    messageText,
    recordingTime,
    sending,
    setMessageText,
  };
}
