import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, CalendarPlus2, FileText, Stethoscope, UserRoundX } from 'lucide-react';

type SelectedSession = {
  displayName?: string;
  kind: 'patient' | 'pre_patient' | 'unknown';
  sessionId: string;
  sourceChannel?: string;
  temperature?: 'frio' | 'morno' | 'quente';
  stage?: string;
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
  onQuickAction?: (action: 'agendar' | 'followup' | 'marcar_perdido') => void;
};

export function WhatsAppConversationHeader({
  assignedDoctor,
  messageCount,
  onAssignDoctor,
  onOpenSummary,
  patientPhone,
  selectedSession,
  selectedSessionId,
  onQuickAction,
}: WhatsAppConversationHeaderProps) {
  return (
    <div className="-mx-4 flex items-center gap-3 border-b px-4 py-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback>
          {selectedSession
            ? (selectedSession.displayName ?? selectedSession.sessionId).slice(0, 2).toUpperCase()
            : selectedSessionId?.slice(0, 2).toUpperCase() ?? ''}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold">
            {selectedSession
              ? selectedSession.displayName ?? selectedSession.sessionId
              : selectedSessionId ?? 'Selecione uma conversa'}
          </div>

          {assignedDoctor && (
            <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-accent/50 px-2 py-0.5 text-xs text-white">
              <Stethoscope className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{assignedDoctor.name}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{messageCount} mensagens</span>
          {patientPhone ? <span>• Tel: {patientPhone}</span> : selectedSessionId ? <span>• Sem telefone</span> : null}
          {selectedSession?.kind === 'pre_patient' && selectedSession.sourceChannel ? (
            <span>• Origem: {selectedSession.sourceChannel}</span>
          ) : null}
          {selectedSession?.kind === 'pre_patient' && selectedSession.temperature ? (
            <span className="capitalize">• Temp: {selectedSession.temperature}</span>
          ) : null}
          {selectedSession?.kind === 'pre_patient' && selectedSession.stage ? (
            <span>• Etapa: {selectedSession.stage}</span>
          ) : null}
        </div>
      </div>

      <TooltipProvider delayDuration={80} skipDelayDuration={200}>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onOpenSummary} aria-label="Gerar resumo">
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Gerar resumo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => onQuickAction?.('followup')} aria-label="Follow-up">
                <Bell className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Registrar follow-up</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onAssignDoctor} aria-label="Atribuir a medico">
                <Stethoscope className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {assignedDoctor ? 'Alterar medico' : 'Atribuir a medico'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => onQuickAction?.('agendar')} className="h-8 px-2 text-xs">
                <CalendarPlus2 className="mr-1 h-3.5 w-3.5" />
                Agendar
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Agendar atendimento</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => onQuickAction?.('marcar_perdido')} className="h-8 px-2 text-xs">
                <UserRoundX className="mr-1 h-3.5 w-3.5" />
                Perdido
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Marcar como perdido</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
