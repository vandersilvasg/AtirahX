import type React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Mic, Paperclip, Send } from 'lucide-react';

type WhatsAppMessageComposerProps = {
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAttachFile: () => void;
  handleFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleRecordAudio: () => Promise<void>;
  handleSendText: () => void;
  isRecording: boolean;
  messageText: string;
  recordingTime: number;
  sending: boolean;
  setMessageText: (value: string) => void;
};

function formatTime(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function WhatsAppMessageComposer({
  disabled,
  fileInputRef,
  handleAttachFile,
  handleFileSelected,
  handleKeyPress,
  handleRecordAudio,
  handleSendText,
  isRecording,
  messageText,
  recordingTime,
  sending,
  setMessageText,
}: WhatsAppMessageComposerProps) {
  return (
    <div className="-mx-4 border-t bg-background/50 px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAttachFile}
                disabled={disabled || sending}
                className="shrink-0 hover:bg-accent"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Anexar arquivo ou imagem</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Input
          placeholder="Digite sua mensagem..."
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || sending}
          className="flex-1"
        />

        {isRecording ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => void handleRecordAudio()}
                  disabled={sending}
                  className="shrink-0 animate-pulse gap-2"
                >
                  <Mic className="h-4 w-4" />
                  <span className="font-mono text-xs">{formatTime(recordingTime)}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Clique para parar a gravacao</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleRecordAudio()}
                  disabled={disabled || sending}
                  className="shrink-0 hover:bg-accent"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Gravar mensagem de audio</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Button
          onClick={handleSendText}
          disabled={!messageText.trim() || disabled || sending}
          size="icon"
          className="shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
