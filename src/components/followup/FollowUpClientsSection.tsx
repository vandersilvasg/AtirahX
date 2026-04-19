import { MagicBentoCard } from '@/components/bento/MagicBento';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  formatDate,
  formatPhone,
  getFollowUpStatus,
  type ClienteFollowUp,
} from '@/hooks/useFollowUpManagement';
import { Calendar, MessageCircle, Phone, User } from 'lucide-react';

type FollowUpClientsSectionProps = {
  clientes: ClienteFollowUp[];
  error: string | null;
  loadingClientes: boolean;
};

export function FollowUpClientsSection({
  clientes,
  error,
  loadingClientes,
}: FollowUpClientsSectionProps) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Clientes em Follow Up ({clientes.length})</h2>

      {loadingClientes ? (
        <MagicBentoCard contentClassName="p-6">
          <div className="text-center text-muted-foreground">Carregando clientes...</div>
        </MagicBentoCard>
      ) : error ? (
        <MagicBentoCard contentClassName="p-6">
          <div className="text-center text-destructive">Erro: {error}</div>
        </MagicBentoCard>
      ) : clientes.length === 0 ? (
        <MagicBentoCard contentClassName="p-6">
          <div className="text-center text-muted-foreground">
            Nenhum cliente em follow-up no momento
          </div>
        </MagicBentoCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientes.map((cliente) => {
            const status = getFollowUpStatus(cliente);

            return (
              <Card key={cliente.id} className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                    </div>
                    <Badge variant={status.completed === 3 ? 'default' : 'secondary'}>
                      {status.completed}/3
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="truncate">{formatPhone(cliente.numero)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Ultima atividade: {formatDate(cliente.ultima_atividade)}</span>
                  </div>

                  {cliente.situacao && (
                    <div className="text-sm">
                      <span className="font-medium">Situacao:</span> {cliente.situacao}
                    </div>
                  )}

                  <div className="space-y-2 border-t pt-3">
                    <div className="mb-2 text-sm font-medium">Status dos Follow-ups:</div>
                    {status.followups.map((followup) => (
                      <div
                        key={followup.num}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <MessageCircle className="h-3 w-3" />
                          Follow-up {followup.num}
                        </span>
                        {followup.status === 'concluido' ? (
                          <Badge variant="default" className="text-xs">
                            Enviado {formatDate(followup.date)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Pendente
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
