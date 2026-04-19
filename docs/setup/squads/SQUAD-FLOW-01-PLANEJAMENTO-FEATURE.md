# Squad Flow 01 - Planejamento de Feature

Fluxo operacional inicial para o piloto de `opensquad` no projeto `Atirah-IA-OS`.

## Objetivo

Padronizar o processo de transformar uma demanda de produto em:

- entendimento de contexto
- analise de impacto
- escopo funcional
- backlog tecnico inicial
- documento pronto para revisao humana

Esse fluxo deve ser o primeiro a ser validado no piloto porque o projeto ja possui:

- base relevante de documentacao em `docs/`
- historico de correcoes e entregas
- estrutura clara de modulos
- necessidade recorrente de refinamento de features

## Quando usar este fluxo

Usar quando a demanda envolver:

- nova feature
- melhoria de modulo existente
- refinamento de escopo
- criacao de backlog tecnico
- avaliacao de impacto entre telas, banco e automacoes

Exemplos:

- "analise o modulo de teleconsulta e monte backlog da proxima sprint"
- "quero planejar uma melhoria no WhatsApp com impacto em automacao"
- "mapeie o escopo da feature de follow-up e gere tarefas tecnicas"

## Agentes envolvidos

### 1. orquestrador

Funcao:

- interpretar a demanda
- decidir se o fluxo e de produto
- definir quais fontes do projeto precisam ser lidas
- organizar a passagem entre agentes
- controlar checkpoints

### 2. pesquisador

Funcao:

- localizar arquivos relevantes
- reunir contexto tecnico e funcional
- identificar modulos impactados
- apontar lacunas ou dependencias

Fontes prioritarias no `Atirah-IA-OS`:

- `README.md`
- `docs/README.md`
- `docs/features/`
- `docs/database/`
- `docs/troubleshooting/`
- `docs/delivery/`
- `src/pages/`
- `src/components/`
- `supabase/functions/`
- `migrations/`

### 3. estrategista

Funcao:

- converter contexto em abordagem pratica
- propor escopo inicial
- separar entregavel, dependencia, risco e prioridade
- estruturar backlog em blocos logicos

### 4. executor

Funcao:

- produzir o documento principal
- escrever backlog, plano ou especificacao
- organizar saida em formato utilizavel pela operacao

### 5. revisor

Funcao:

- verificar coerencia do escopo
- apontar omissoes
- validar se o backlog faz sentido para o estado atual do projeto

## Pipeline do fluxo

### Etapa 1: entrada do usuario

O usuario envia uma demanda clara.

Formato ideal:

- objetivo
- modulo afetado
- resultado esperado
- restricao ou prioridade, se houver

Exemplo:

- "analise a feature de teleconsulta e gere backlog tecnico da proxima sprint com foco em estabilidade e experiencia do medico"

### Etapa 2: classificacao

O `orquestrador` deve responder internamente:

- isso e demanda de produto?
- qual squad entra?
- quais partes do projeto devem ser lidas antes de qualquer producao?
- existe necessidade de checkpoint intermediario?

Decisao esperada:

- usar `squad-produto`

### Etapa 3: coleta de contexto

O `pesquisador` deve:

- ler a documentacao principal do modulo
- localizar paginas e componentes impactados
- verificar edge functions ou migrations relacionadas
- consultar troubleshooting e historico de entrega, quando existir

Saida esperada:

- resumo do estado atual
- arquivos relevantes
- pontos de impacto
- riscos e duvidas

### Etapa 4: definicao de abordagem

O `estrategista` deve organizar:

- objetivo funcional
- escopo do que entra e do que fica fora
- dependencias tecnicas
- ordem sugerida de execucao
- prioridades

Saida esperada:

- plano enxuto e defensavel

### Etapa 5: producao do backlog

O `executor` deve gerar:

- titulo da iniciativa
- objetivo
- contexto resumido
- lista de tarefas tecnicas
- tarefas de frontend
- tarefas de banco ou edge functions
- tarefas de validacao
- riscos
- criterio de pronto

Formato sugerido:

1. Contexto
2. Escopo
3. Dependencias
4. Backlog priorizado
5. Riscos
6. Checkpoint de aprovacao

### Etapa 6: revisao

O `revisor` deve validar:

- se o backlog esta aderente ao contexto real
- se ha inconsistencia entre documentacao e codigo
- se faltam tarefas de validacao, deploy ou dados
- se o escopo esta grande demais para uma sprint

Saida esperada:

- aprovado
- aprovado com ajustes
- reprovado com justificativa

### Etapa 7: checkpoint humano

Antes de qualquer execucao tecnica, o usuario aprova:

- backlog final
- ordem de prioridade
- recorte da sprint

Sem essa aprovacao, o fluxo para.

## Entregavel esperado

Ao final, o squad deve devolver um documento com:

- resumo do pedido
- leitura do contexto atual
- modulos impactados
- backlog tecnico inicial
- riscos e observacoes
- proxima decisao esperada do usuario

## Prompt-base para acionar o fluxo

Usar pedidos nesse formato:

```text
Analise o modulo [nome do modulo] no projeto Atirah-IA-OS e gere um backlog tecnico inicial.

Objetivo:
[o que precisa ser resolvido]

Foco:
[estabilidade, UX, performance, integracao, etc.]

Restricoes:
[prazo, limite tecnico, modulo sensivel, etc.]
```

## Exemplo real de uso

```text
Analise o modulo de WhatsApp no projeto Atirah-IA-OS e gere um backlog tecnico inicial.

Objetivo:
Melhorar a operacao de mensagens, anexos e atribuicao de medico.

Foco:
Estabilidade e consistencia operacional.

Restricoes:
Nao alterar automacoes ativas sem checkpoint humano.
```

## Regras do piloto para este fluxo

- iniciar sempre por demanda explicita do usuario
- ler contexto real antes de propor backlog
- nao executar mudancas tecnicas automaticamente
- sempre parar para aprovacao antes de implementar
- registrar a saida em formato reutilizavel quando fizer sentido

## Criterio de sucesso deste fluxo

O fluxo sera considerado bom se:

- reduzir tempo de analise inicial
- gerar backlog mais consistente
- evitar lacunas entre documentacao e codigo
- facilitar recorte de sprint
- manter o usuario no controle das decisoes sensiveis
