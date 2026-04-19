import { Card, CardContent } from '@/components/ui/card';

export function AssistantInfoCards() {
  return (
    <>
      <Card className="border-dashed">
        <CardContent className="py-6">
          <p className="text-center text-sm text-muted-foreground">
            Clique em qualquer card para acessar o assistente correspondente.
            Cada agente sera configurado com funcionalidades especificas.
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-6">
          <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Isencao de Responsabilidade Medica
          </h3>
          <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>Estas ferramentas sao fornecidas apenas para fins informativos e educacionais.</p>
            <p>As Ferramentas NAO:</p>
            <ul className="ml-2 list-inside list-disc space-y-1">
              <li>Constituem aconselhamento medico, diagnostico ou tratamento</li>
              <li>Substituem a consulta com profissionais de saude qualificados</li>
              <li>Garantem a precisao ou adequacao para casos individuais</li>
              <li>Consideram todas as variaveis clinicas possiveis</li>
            </ul>
            <p className="mt-3">
              O usuario assume total responsabilidade pelo uso das informacoes
              fornecidas. Os desenvolvedores nao se responsabilizam por quaisquer
              danos diretos, indiretos ou consequenciais resultantes do uso ou
              impossibilidade de uso destas Ferramentas.
            </p>
            <p className="mt-2 text-center font-medium">
              Ao utilizar estas Ferramentas, voce concorda com estes termos.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
