import { Button } from '@/components/ui/button';
import { Loader2, Plug, RefreshCw } from 'lucide-react';

type IntegrationHeaderProps = {
  loading: boolean;
  onRefresh: () => void;
};

export function IntegrationHeader({ loading, onRefresh }: IntegrationHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
      <div className="relative flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
              <Plug className="h-6 w-6 text-primary" />
            </div>
            <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              Integracao WhatsApp
            </h1>
          </div>
          <p className="ml-14 text-muted-foreground">
            Gerencie e monitore suas instancias do WhatsApp conectadas
          </p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={loading}
          size="lg"
          className="gap-2 shadow-lg transition-all hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5" />
              Atualizar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
