import { Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type MessageMediaPreviewProps = {
  transcriptText?: string;
  url: string;
};

function getMediaKind(url: string): 'image' | 'audio' | 'video' | 'pdf' | 'doc' | 'other' {
  const normalizedUrl = (url || '').toLowerCase();
  if (normalizedUrl.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/)) return 'image';
  if (normalizedUrl.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/)) return 'audio';
  if (normalizedUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/)) return 'video';
  if (normalizedUrl.endsWith('.pdf')) return 'pdf';
  if (normalizedUrl.match(/\.(doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/)) return 'doc';
  return 'other';
}

function cleanTranscriptText(text?: string): string | undefined {
  if (!text) return text;
  return text.trim().replace(/^audio\s+recebido\s*:\s*/i, '');
}

function formatAudioTime(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function AudioBubble({ transcriptText, url }: MessageMediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useMemo(() => new Audio(url), [url]);

  useEffect(() => {
    const audio = audioRef;
    audio.preload = 'metadata';
    audio.playbackRate = playbackRate;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrent(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrent(audio.duration || 0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioRef, playbackRate]);

  const toggle = async () => {
    try {
      if (isPlaying) {
        audioRef.pause();
        setIsPlaying(false);
        return;
      }

      await audioRef.play();
      setIsPlaying(true);
    } catch (playError) {
      console.error('[WhatsApp] Falha ao reproduzir audio:', playError);
    }
  };

  const onScrub = (value: number) => {
    if (!isFinite(value)) return;
    const clamped = Math.max(0, Math.min(duration || 0, value));
    setCurrent(clamped);
    audioRef.currentTime = clamped;
  };

  const cycleRate = () => {
    const rates = [1, 1.5, 2];
    const index = rates.indexOf(playbackRate);
    const nextRate = rates[(index + 1) % rates.length];
    setPlaybackRate(nextRate);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow"
        aria-label={isPlaying ? 'Pausar audio' : 'Reproduzir audio'}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <div className="min-w-[160px] max-w-[260px] flex-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step="0.01"
          value={current}
          onChange={(event) => onScrub(parseFloat(event.target.value))}
          className="w-full accent-current"
        />
        <div className="mt-1 flex items-center justify-between text-[10px] opacity-80">
          <span>{formatAudioTime(current)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
        {transcriptText && (
          <button
            type="button"
            onClick={() => setShowTranscript((value) => !value)}
            className="mt-2 text-[11px] underline"
          >
            {showTranscript ? 'Ocultar transcricao' : 'Exibir transcricao'}
          </button>
        )}
        {showTranscript && transcriptText && (
          <div className="mt-2 break-all whitespace-pre-wrap text-xs opacity-90">
            {transcriptText}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={cycleRate}
        className="rounded bg-white px-2 py-1 text-[10px] text-black shadow"
        aria-label={`Velocidade ${playbackRate}x`}
      >
        {playbackRate}x
      </button>
    </div>
  );
}

export function MessageMediaPreview({ transcriptText, url }: MessageMediaPreviewProps) {
  const kind = getMediaKind(url);

  if (kind === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt="imagem" className="mb-1 max-w-full rounded-md border" />
      </a>
    );
  }

  if (kind === 'audio') {
    return <AudioBubble url={url} transcriptText={cleanTranscriptText(transcriptText)} />;
  }

  if (kind === 'video') {
    return (
      <video controls className="w-full rounded-md border">
        <source src={url} />
        Seu navegador nao suporta video.
      </video>
    );
  }

  if (kind === 'pdf') {
    return (
      <div className="space-y-1">
        <iframe src={url} className="h-64 w-full rounded-md border" title="Pre-visualizacao PDF" />
        <a href={url} target="_blank" rel="noreferrer" className="underline">
          Abrir PDF em nova guia
        </a>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="underline">
      Abrir arquivo
    </a>
  );
}
