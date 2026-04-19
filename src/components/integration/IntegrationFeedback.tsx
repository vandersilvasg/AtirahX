import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, Plug, RefreshCw } from 'lucide-react';

type IntegrationErrorStateProps = {
  error: string;
  onRetry: () => void;
};

export function IntegrationErrorState({ error, onRetry }: IntegrationErrorStateProps) {
  return (
    <Card className="border-2 border-destructive bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 p-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-lg font-bold text-destructive">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={onRetry} variant="destructive" size="sm" className="mt-3 gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function IntegrationLoadingState() {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Plug className="h-12 w-12 text-primary/20" />
            </div>
            <Loader2 className="relative z-10 h-12 w-12 animate-spin text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Carregando instancias...</p>
            <p className="text-sm text-muted-foreground">Aguarde enquanto buscamos os dados</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type IntegrationEmptyStateProps = {
  onRetry: () => void;
};

export function IntegrationEmptyState({ onRetry }: IntegrationEmptyStateProps) {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted/50 p-6">
            <Plug className="h-16 w-16 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold">Nenhuma instancia encontrada</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Nao ha instancias do WhatsApp disponiveis no momento. Tente atualizar ou verifique
              sua conexao.
            </p>
          </div>
          <Button onClick={onRetry} variant="outline" size="lg" className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
