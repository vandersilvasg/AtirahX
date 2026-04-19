import dayjs from 'dayjs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageMediaPreview } from '@/components/whatsapp/MessageMediaPreview';
import type { MedxHistoryRow } from '@/lib/medxHistory';

type WhatsAppMessageListProps = {
  appTimeZone: string;
  loadingMessages: boolean;
  messages: MedxHistoryRow[];
  renderMessageText: (message: MedxHistoryRow) => string;
};

export function WhatsAppMessageList({
  appTimeZone,
  loadingMessages,
  messages,
  renderMessageText,
}: WhatsAppMessageListProps) {
  return (
    <ScrollArea className="-mx-4 min-h-0 flex-1 px-4 py-4">
      <div className="space-y-3">
        {loadingMessages && (
          <div className="text-sm text-muted-foreground">Carregando mensagens...</div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div className="text-sm text-muted-foreground">Nenhuma mensagem</div>
        )}

        {messages.map((message, index) => {
          const type = (message.message?.type ?? '').toLowerCase();
          const isAi = type === 'ai';
          const text = renderMessageText(message);
          const current = message.data_e_hora ? dayjs(message.data_e_hora).tz(appTimeZone) : null;
          const prev =
            index > 0 && messages[index - 1].data_e_hora
              ? dayjs(messages[index - 1].data_e_hora!).tz(appTimeZone)
              : null;
          const showDateHeader = !!current && (!prev || !current.isSame(prev, 'day'));

          return (
            <div key={message.id}>
              {showDateHeader && (
                <div className="sticky top-0 z-10 mb-2 flex items-center justify-center">
                  <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                    {current?.format('DD/MM/YYYY')}
                  </span>
                </div>
              )}

              <div className={`flex ${isAi ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] break-all whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    isAi
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted'
                  }`}
                >
                  {message.media ? (
                    <MessageMediaPreview url={message.media} transcriptText={text} />
                  ) : (
                    <div>{text}</div>
                  )}

                  {current && (
                    <div
                      className={`mt-1 text-[10px] opacity-70 ${
                        isAi ? 'text-primary-foreground' : 'text-foreground/70'
                      }`}
                    >
                      {current.format('HH:mm')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
