import { CalendarDays, Filter, Loader2 } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AgendaItem } from './types';

export type AgendaViewMode = 'month' | 'week' | 'day';

interface AgendaToolbarProps {
  agendas: AgendaItem[];
  loadingAgendas: boolean;
  onRefreshAgendas: () => void;
  onSelectAgenda: (agendaId: string) => void;
  onViewModeChange: (viewMode: AgendaViewMode) => void;
  selectedAgenda: string;
  userRole?: string;
  viewMode: AgendaViewMode;
}

export function AgendaToolbar({
  agendas,
  loadingAgendas,
  onRefreshAgendas,
  onSelectAgenda,
  onViewModeChange,
  selectedAgenda,
  userRole,
  viewMode,
}: AgendaToolbarProps) {
  return (
    <MagicBentoCard contentClassName="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {userRole === 'owner' && (
            <>
              <div className="flex-1 space-y-2">
                <Label htmlFor="agenda-filter" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar por Médico
                  {loadingAgendas && <span className="text-xs text-muted-foreground">(Carregando...)</span>}
                </Label>
                <Select value={selectedAgenda} onValueChange={onSelectAgenda} disabled={loadingAgendas}>
                  <SelectTrigger id="agenda-filter">
                    <SelectValue placeholder={loadingAgendas ? 'Carregando agendas...' : 'Selecione um médico'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Médicos</SelectItem>
                    {agendas.map((agenda) => (
                      <SelectItem key={agenda.id} value={agenda.id}>
                        {agenda.nome}
                      </SelectItem>
                    ))}
                    {!loadingAgendas && agendas.length === 0 && (
                      <SelectItem value="vazio" disabled>
                        Nenhuma agenda disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={onRefreshAgendas}
                disabled={loadingAgendas}
                variant="outline"
                className="w-full md:w-auto"
              >
                {loadingAgendas ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Lista'
                )}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Modo de Visualização:</Label>
          <div className="flex gap-2">
            <Button variant={viewMode === 'month' ? 'default' : 'outline'} size="sm" onClick={() => onViewModeChange('month')}>
              Mensal
            </Button>
            <Button variant={viewMode === 'week' ? 'default' : 'outline'} size="sm" onClick={() => onViewModeChange('week')}>
              Semanal
            </Button>
            <Button variant={viewMode === 'day' ? 'default' : 'outline'} size="sm" onClick={() => onViewModeChange('day')}>
              Diário
            </Button>
          </div>
        </div>
      </div>
    </MagicBentoCard>
  );
}
