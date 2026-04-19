import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from 'lucide-react';

type ConversationItem = {
  displayName?: string;
  kind: 'patient' | 'pre_patient' | 'unknown';
  lastMessagePreview: string;
  sessionId: string;
  totalMessages: number;
  sourceChannel?: string;
  temperature?: 'frio' | 'morno' | 'quente';
  stage?: string;
};

type WhatsAppConversationSidebarProps = {
  filteredSessions: ConversationItem[];
  loadingSessions: boolean;
  search: string;
  selectedSessionId: string | null;
  setSearch: (value: string) => void;
  setSelectedSessionId: (value: string) => void;
  setTab: (value: 'pre' | 'crm' | 'all') => void;
  tab: 'pre' | 'crm' | 'all';
};

export function WhatsAppConversationSidebar({
  filteredSessions,
  loadingSessions,
  search,
  selectedSessionId,
  setSearch,
  setSelectedSessionId,
  setTab,
  tab,
}: WhatsAppConversationSidebarProps) {
  return (
    <div className="flex min-h-0 flex-col border-r">
      <div className="px-3 pb-3 pt-4">
        <div className="mb-3 flex gap-2">
          <button
            className={`rounded-full px-3 py-1.5 text-xs ${
              tab === 'all' ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
            onClick={() => setTab('all')}
          >
            Todos
          </button>
          <button
            className={`rounded-full px-3 py-1.5 text-xs ${
              tab === 'pre' ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
            onClick={() => setTab('pre')}
          >
            Pre Pacientes
          </button>
          <button
            className={`rounded-full px-3 py-1.5 text-xs ${
              tab === 'crm' ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
            onClick={() => setTab('crm')}
          >
            Pacientes CRM
          </button>
        </div>
        <Input
          placeholder="Buscar por sessao ou mensagem..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 px-3 pb-4">
          {loadingSessions && (
            <div className="px-2 py-1 text-sm text-muted-foreground">Carregando...</div>
          )}

          {!loadingSessions && filteredSessions.length === 0 && (
            <div className="px-2 py-1 text-sm text-muted-foreground">Nenhuma conversa</div>
          )}

        {filteredSessions.map((session) => {
            const active = session.sessionId === selectedSessionId;
            const borderClass =
              session.kind === 'pre_patient'
                ? 'border-amber-400'
                : session.kind === 'patient'
                  ? 'border-emerald-400'
                  : 'border-muted';
            const badgeClass =
              session.kind === 'pre_patient'
                ? 'text-amber-700'
                : session.kind === 'patient'
                  ? 'text-emerald-700'
                  : 'text-slate-500';

            return (
              <button
                key={session.sessionId}
                onClick={() => setSelectedSessionId(session.sessionId)}
                className={`block w-[98%] max-w-[325px] rounded-xl border-l-4 px-2 py-2 text-left transition-colors ${
                  active ? 'bg-accent' : 'hover:bg-accent/50'
                } ${borderClass}`}
                style={{ boxSizing: 'border-box' }}
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    className={`h-8 w-8 shrink-0 ${
                      session.kind === 'pre_patient' ? 'bg-amber-100' : 'bg-primary/10'
                    }`}
                  >
                    <AvatarFallback
                      className={session.kind === 'pre_patient' ? 'text-amber-700' : 'text-primary'}
                    >
                      {session.kind === 'pre_patient' ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        (session.displayName?.[0] ?? session.sessionId?.[0] ?? '').toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="truncate text-sm font-medium">
                      {session.kind === 'pre_patient'
                        ? session.displayName ?? session.sessionId
                        : session.displayName ?? session.sessionId}
                    </div>
                    <div className={`text-[10px] font-medium ${badgeClass}`}>
                      {session.kind === 'pre_patient'
                        ? 'Pre Paciente'
                        : session.kind === 'patient'
                          ? 'Paciente'
                          : 'Desconhecido'}
                    </div>
                    {session.kind === 'pre_patient' && (
                      <div className="mt-0.5 flex items-center gap-1 text-[10px]">
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {session.sourceChannel ?? 'nao_informado'}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            session.temperature === 'quente'
                              ? 'bg-red-100 text-red-700'
                              : session.temperature === 'frio'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {session.temperature ?? 'morno'}
                        </span>
                        {session.stage ? (
                          <span className="rounded bg-background/60 px-1.5 py-0.5">
                            {session.stage}
                          </span>
                        ) : null}
                      </div>
                    )}
                    <div className="truncate text-xs text-white">{session.lastMessagePreview}</div>
                  </div>

                  <div className="ml-1 shrink-0 text-[11px] text-white">
                    {session.totalMessages}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
