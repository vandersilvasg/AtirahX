import type { DragEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CRM_STAGES,
  formatDateLabel,
  formatPhone,
  type PrePatientRow,
  type StageKey,
} from '@/hooks/useCrmJourney';
import { Calendar, CircleDollarSign, Loader2, Phone, Thermometer, Waypoints } from 'lucide-react';

type CrmKanbanBoardProps = {
  prePatientsByStage: Record<StageKey, PrePatientRow[]>;
  stageMetrics: Record<StageKey, { total: number; valor: number }>;
  draggingPrePatientId: string | null;
  handleDragEnd: () => void;
  handleDragOverStage: (event: DragEvent<HTMLDivElement>) => void;
  handleDragStart: (event: DragEvent<HTMLDivElement>, prePatientId: string) => void;
  handleDropOnStage: (event: DragEvent<HTMLDivElement>, targetStage: StageKey) => Promise<void>;
  updatingPrePatientId: string | null;
};

export function CrmKanbanBoard({
  prePatientsByStage,
  stageMetrics,
  draggingPrePatientId,
  handleDragEnd,
  handleDragOverStage,
  handleDragStart,
  handleDropOnStage,
  updatingPrePatientId,
}: CrmKanbanBoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {CRM_STAGES.map((stage) => {
          const stagePrePatients = prePatientsByStage[stage.key];
          const stageMetric = stageMetrics[stage.key];

          return (
            <Card key={stage.key} className="w-[320px] shrink-0 bg-muted/25">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                      {stage.label}
                    </CardTitle>
                    <Badge variant="outline" className={stage.badgeClass}>
                      {stagePrePatients.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(stageMetric?.valor ?? 0)}{' '}
                    em oportunidade
                  </p>
                </div>
              </CardHeader>
              <CardContent
                className={`min-h-[420px] space-y-3 rounded-md ${
                  draggingPrePatientId ? 'bg-muted/40' : ''
                }`}
                onDragOver={handleDragOverStage}
                onDrop={(event) => void handleDropOnStage(event, stage.key)}
              >
                {stagePrePatients.length === 0 ? (
                  <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-background/60 px-4 text-center text-xs text-muted-foreground">
                    Arraste leads para esta etapa
                  </div>
                ) : (
                  stagePrePatients.map((prePatient) => (
                    <div
                      key={prePatient.id}
                      draggable={updatingPrePatientId !== prePatient.id}
                      onDragStart={(event) => handleDragStart(event, prePatient.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab rounded-lg border bg-card p-3 shadow-sm transition active:cursor-grabbing ${
                        draggingPrePatientId === prePatient.id ? 'opacity-40' : ''
                      } ${updatingPrePatientId === prePatient.id ? 'ring-2 ring-primary/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-tight text-foreground">
                          {prePatient.name || 'Lead sem nome'}
                        </p>
                        {updatingPrePatientId === prePatient.id && (
                          <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                        )}
                      </div>

                      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Waypoints className="h-3.5 w-3.5 shrink-0" />
                          <span>{prePatient.source_channel || 'nao_informado'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{formatPhone(prePatient.phone)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-3.5 w-3.5 shrink-0" />
                          <span className="capitalize">{prePatient.temperature || 'morno'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>SLA: {formatDateLabel(prePatient.last_contact_at ?? prePatient.created_at)}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-foreground/80">
                        <CircleDollarSign className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(prePatient.estimated_value || 0))}
                        </span>
                      </div>

                      {prePatient.procedure_interest && (
                        <p className="mt-2 line-clamp-2 text-xs text-foreground/80">
                          {prePatient.procedure_interest}
                        </p>
                      )}

                      {prePatient.next_action && (
                        <p className="mt-2 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                          Proxima acao: {prePatient.next_action}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
