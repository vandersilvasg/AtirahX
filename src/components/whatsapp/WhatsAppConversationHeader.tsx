import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, FileText, Stethoscope } from 'lucide-react';

type SelectedSession = {
  displayName?: string;
  kind: 'patient' | 'pre_patient' | 'unknown';
  sessionId: string;
} | null;

type AssignedDoctor = {
  id: string;
  name: string;
  specialization?: string | null;
} | null;

type WhatsAppConversationHeaderProps = {
  assignedDoctor: AssignedDoctor;
  messageCount: number;
  onAssignDoctor: () => void;
  onOpenSummary: () => void;
  patientPhone: string | null;
  selectedSession: SelectedSession;
  selectedSessionId: string | null;
};

export function WhatsAppConversationHeader({
  assignedDoctor,
  messageCount,
  onAssignDoctor,
  onOpenSummary,
  patientPhone,
  selectedSession,
  selectedSessionId,
}: WhatsAppConversationHeaderProps) {
  return (
    <div className="-mx-4 flex items-center gap-3 border-b px-4 py-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback>
          {selectedSession
            ? selectedSession.kind === 'pre_patient'
              ? 'PP'
              : (selectedSession.displayName ?? selectedSession.sessionId).slice(0, 2).toUpperCase()
            : selectedSessionId?.slice(0, 2).toUpperCase() ?? ''}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold">
            {selectedSession
              ? selectedSession.kind === 'pre_patient'
                ? 'Pre Paciente'
                : selectedSession.displayName ?? selectedSession.sessionId
              : selectedSessionId ?? 'Selecione uma conversa'}
          </div>

          {assignedDoctor && (
            <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-accent/50 px-2 py-0.5 text-xs text-white">
              <Stethoscope className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{assignedDoctor.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{messageCount} mensagens</span>
          {patientPhone ? (
            <span className="flex items-center gap-1 text-green-600">• Tel: {patientPhone}</span>
          ) : selectedSessionId ? (
            <span className="flex items-center gap-1 text-amber-600">• Sem telefone</span>
          ) : null}
        </div>
      </div>

      <TooltipProvider delayDuration={80} skipDelayDuration={200}>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSummary}
                aria-label="Gerar resumo"
                className="transition-transform duration-200 hover:scale-110 hover:text-primary"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Gerar resumo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {}}
                aria-label="Fazer follow up"
                className="transition-transform duration-200 hover:scale-110 hover:text-primary"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Fazer follow up</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAssignDoctor}
                aria-label="Atribuir a medico"
                className="transition-transform duration-200 hover:scale-110 hover:text-primary"
              >
                <Stethoscope className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {assignedDoctor ? 'Alterar medico' : 'Atribuir a medico'}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
