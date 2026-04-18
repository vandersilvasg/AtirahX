import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CalendarData, WebhookCalendarsResponse } from '@/hooks/useUsersManagement';
import { Calendar, CheckCircle, Link, Loader2, Plus, Trash2 } from 'lucide-react';

type UsersCalendarsDialogProps = {
  currentUserId: string;
  deletingCalendarId: string | null;
  isOpen: boolean;
  linkedCalendarId: string | null;
  linkingCalendarId: string | null;
  onClose: () => void;
  onDeleteCalendar: (userId: string, calendarId: string) => void;
  onLinkCalendar: (userId: string, calendarId: string, calendarName: string) => void;
  onOpenAddCalendar: () => void;
  parseCalendarData: (data: unknown) => CalendarData;
  webhookResponse: WebhookCalendarsResponse | null;
};

function CalendarCard({
  calendar,
  currentUserId,
  deletingCalendarId,
  linkedCalendarId,
  linkingCalendarId,
  onDeleteCalendar,
  onLinkCalendar,
}: {
  calendar: CalendarData;
  currentUserId: string;
  deletingCalendarId: string | null;
  linkedCalendarId: string | null;
  linkingCalendarId: string | null;
  onDeleteCalendar: (userId: string, calendarId: string) => void;
  onLinkCalendar: (userId: string, calendarId: string, calendarName: string) => void;
}) {
  const calendarId = calendar['Calendar ID'] || '';
  const calendarName = calendar['Calendar Name'] || 'Agenda sem nome';
  const isDeleting = deletingCalendarId === calendarId;
  const isLinking = linkingCalendarId === calendarId;
  const isLinked = linkedCalendarId === calendarId;

  return (
    <Card className={`border-primary/20 transition-colors hover:border-primary/40 ${isLinked ? 'border-green-500/30 bg-green-50/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Calendar className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-medium text-foreground">{calendarName}</span>
              {isLinked && (
                <Badge variant="outline" className="shrink-0 border-green-500/20 bg-green-500/10 text-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Vinculada
                </Badge>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isLinked ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => onLinkCalendar(currentUserId, calendarId, calendarName)}
                disabled={isLinking || !calendarId}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Vinculando...</span>
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    <span className="ml-2">Vincular</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLinkCalendar(currentUserId, calendarId, calendarName)}
                disabled={isLinking}
                className="border-green-500/30 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="ml-2">Vinculada</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteCalendar(currentUserId, calendarId)}
              disabled={isDeleting || !calendarId}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span className="ml-2">Excluir</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UsersCalendarsDialog({
  currentUserId,
  deletingCalendarId,
  isOpen,
  linkedCalendarId,
  linkingCalendarId,
  onClose,
  onDeleteCalendar,
  onLinkCalendar,
  onOpenAddCalendar,
  parseCalendarData,
  webhookResponse,
}: UsersCalendarsDialogProps) {
  const renderContent = () => {
    if (!webhookResponse) {
      return <div className="py-8 text-center text-muted-foreground">Nenhum dado recebido</div>;
    }

    try {
      const data = webhookResponse;

      if (typeof data !== 'string' && 'calendars' in data && Array.isArray(data.calendars)) {
        const nonPrimaryCalendars = data.calendars.filter((calendar) => {
          const parsed = typeof calendar === 'string' ? parseCalendarData(calendar) : calendar;
          return parsed['Primary Calendar'] !== 'Yes';
        });

        if (nonPrimaryCalendars.length === 0) {
          return (
            <Card className="border-muted">
              <CardContent className="py-8 pt-6 text-center">
                <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma agenda secundaria encontrada.</p>
                <p className="mt-1 text-sm text-muted-foreground/70">Apenas agendas principais foram detectadas.</p>
              </CardContent>
            </Card>
          );
        }

        return (
          <>
            <div className="mb-4 flex items-center justify-between rounded-lg bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">
                  {nonPrimaryCalendars.length} {nonPrimaryCalendars.length === 1 ? 'Agenda Disponivel' : 'Agendas Disponiveis'}
                </span>
                <Badge variant="secondary">{data.calendars.length} no total</Badge>
              </div>
              <Button size="sm" onClick={onOpenAddCalendar} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Calendario
              </Button>
            </div>

            <div className="space-y-4">
              {nonPrimaryCalendars.map((calendar, index) => {
                const parsedCalendar = typeof calendar === 'string' ? parseCalendarData(calendar) : calendar;
                return (
                  <CalendarCard
                    key={`${parsedCalendar['Calendar ID'] || index}`}
                    calendar={parsedCalendar}
                    currentUserId={currentUserId}
                    deletingCalendarId={deletingCalendarId}
                    linkedCalendarId={linkedCalendarId}
                    linkingCalendarId={linkingCalendarId}
                    onDeleteCalendar={onDeleteCalendar}
                    onLinkCalendar={onLinkCalendar}
                  />
                );
              })}
            </div>
          </>
        );
      }

      const calendar = parseCalendarData(data);
      const hasFields =
        !!calendar['Calendar Name'] || !!calendar['Calendar ID'] || Object.keys(calendar).length > 0;

      if (hasFields) {
        return (
          <CalendarCard
            calendar={calendar}
            currentUserId={currentUserId}
            deletingCalendarId={deletingCalendarId}
            linkedCalendarId={linkedCalendarId}
            linkingCalendarId={linkingCalendarId}
            onDeleteCalendar={onDeleteCalendar}
            onLinkCalendar={onLinkCalendar}
          />
        );
      }

      return (
        <Card className="border-yellow-500/20">
          <CardContent className="pt-6">
            <p className="mb-3 text-sm text-muted-foreground">Formato nao reconhecido. Dados brutos:</p>
            <div className="rounded-lg bg-muted/50 p-4">
              <pre className="overflow-auto text-xs">
                {typeof webhookResponse === 'string'
                  ? webhookResponse
                  : JSON.stringify(webhookResponse, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      );
    } catch (error) {
      console.error('Erro ao renderizar calendar:', error);
      return (
        <Card className="border-red-500/20">
          <CardContent className="pt-6">
            <p className="mb-3 text-sm text-red-500">Erro ao processar dados. Dados brutos:</p>
            <div className="rounded-lg bg-muted/50 p-4">
              <pre className="overflow-auto text-xs">
                {typeof webhookResponse === 'string'
                  ? webhookResponse
                  : JSON.stringify(webhookResponse, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agendas Disponiveis
          </DialogTitle>
          <DialogDescription>
            Selecione uma agenda secundaria para vincular (agendas principais sao ocultadas)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">{renderContent()}</div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
