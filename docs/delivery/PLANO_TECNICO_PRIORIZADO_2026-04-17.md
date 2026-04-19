# Plano Tecnico Priorizado

Data: 2026-04-17

Projeto: `Atirah-IA-OS`

## Objetivo

Transformar a analise tecnica mais recente em um plano de execucao pequeno, objetivo e verificavel.

Este plano evita abrir um refactor amplo demais e organiza a evolucao do produto por frentes que reduzem risco tecnico real.

## Estado atual validado

Verificacoes executadas localmente nesta leitura:

- `npm run lint` -> OK
- `npm run test` -> OK
- `npm run build` -> OK

Estado tecnico observado:

- o projeto esta funcional
- a base nao esta quebrada
- a principal pressao agora e manutencao, performance e governanca

## Checkpoint de retomada

Atualizado em: 2026-04-18

Estado consolidado apos a rodada recente:

- `npm run lint` -> OK
- `npm run test` -> OK
- `npm run build` -> OK
- lazy loading por rota e por modulos pesados ja implantado
- `recharts`, `jspdf` e `html2canvas` removidos do runtime do app
- acesso ao Supabase padronizado em `src/lib/supabaseClientLoader.ts`
- imports diretos de `@/lib/supabaseClient` removidos do runtime, restando apenas mocks de teste e o proprio loader

Principais pesos remanescentes observados no build:

- `supabaseClient` ~ `171 kB`
- `react-vendor` ~ `164 kB`
- `ui-vendor` ~ `89 kB`
- `PatientDetailModal` ~ `90 kB`

Leitura pragmatica:

- a Frente 1 ja entregou o ganho grosso de performance
- a migracao do loader do Supabase esta praticamente encerrada
- o melhor proximo passo deixa de ser split tatico e passa a ser reducao estrutural de custo ou retomada de governanca operacional

## Principais riscos atuais

### 1. Bundle inicial pesado

Sinal observado:

- build com chunk principal acima de 2 MB minificado
- ausencia visivel de lazy loading por rota em `src/App.tsx`

Impacto:

- carregamento inicial mais caro
- pior escalabilidade do frontend
- custo de entrega maior para modulos pouco usados

### 2. Complexidade concentrada em hooks e componentes

Arquivos com concentracao relevante:

- `src/hooks/useAgendaExternalData.ts`
- `src/hooks/useClinicInfoManagement.ts`
- `src/hooks/useUsersManagement.ts`
- `src/hooks/useDashboardMetrics.ts`
- `src/hooks/useWhatsAppIntegration.ts`
- `src/components/assistant/AgentMedicationModal.tsx`
- `src/components/whatsapp/SummaryModal.tsx`
- `src/components/assistant/AgentExamModal.tsx`

Impacto:

- manutencao lenta
- maior risco de regressao
- testes mais caros de escrever

### 3. Governanca fraca de migrations

Sinais observados:

- alto volume de migrations
- coexistencia de migrations oficiais e scripts corretivos manuais
- numeracao com inconsistencias historicas

Impacto:

- risco de divergencia entre historico e estado real
- dificuldade de replicacao segura
- onboarding tecnico mais lento

### 4. Higiene de repositorio e versionamento

Sinais observados:

- worktree com muitas alteracoes simultaneas
- `.env` aparece como arquivo trackeado com modificacoes
- reorganizacao documental e mudancas de codigo ocorrendo ao mesmo tempo

Impacto:

- revisao diffusa
- risco operacional
- baixa rastreabilidade

### 5. Inconsistencia de encoding

Sinais observados:

- trechos com mojibake em arquivos de interface e configuracao

Impacto:

- experiencia ruim no produto
- perda de confianca na documentacao e no codigo

## Ordem recomendada de execucao

## Frente 1: performance estrutural do frontend

Objetivo:

- reduzir custo de carregamento inicial sem mexer na regra de negocio

Escopo:

- implementar lazy loading por rota em `src/App.tsx`
- adicionar `Suspense` com fallback simples
- revisar os modulos mais pesados carregados apenas sob demanda

Arquivos de partida:

- `src/App.tsx`
- `src/main.tsx`

Criterio de pronto:

- rotas principais carregadas por import dinamico
- build continua passando
- chunk principal reduzido de forma perceptivel

## Frente 2: quebra dos hooks mais pesados

Objetivo:

- reduzir acoplamento e tornar manutencao previsivel

Escopo inicial:

- extrair funcoes puras e adaptadores de dados dos hooks
- separar fetch, normalizacao e efeitos de UI
- manter API publica dos hooks estavel enquanto possivel

Prioridade interna:

1. `src/hooks/useAgendaExternalData.ts`
2. `src/hooks/useClinicInfoManagement.ts`
3. `src/hooks/useUsersManagement.ts`
4. `src/hooks/useDashboardMetrics.ts`

Criterio de pronto:

- hook principal menor e mais legivel
- regras de transformacao isoladas
- testes existentes continuam passando

## Frente 3: saneamento de components-monolito

Objetivo:

- diminuir o custo de alterar modais e fluxos sensiveis

Escopo inicial:

- quebrar modais longos em secoes menores
- separar validacao, renderizacao e integracao

Prioridade interna:

1. `src/components/assistant/AgentMedicationModal.tsx`
2. `src/components/whatsapp/SummaryModal.tsx`
3. `src/components/assistant/AgentExamModal.tsx`

Criterio de pronto:

- componente central com menos responsabilidade
- subcomponentes com escopo claro
- comportamento visual preservado

## Frente 4: governanca do banco e migrations

Objetivo:

- reduzir risco estrutural antes de novas features de dados

Escopo:

- separar migrations historicas de scripts corretivos avulsos
- definir quais arquivos sao baseline oficial
- documentar o fluxo correto para replicacao do banco

Arquivos e pastas de partida:

- `migrations/`
- `combined_migrations.sql`
- `docs/database/`
- `docs/setup/GUIA_REPLICACAO_COMPLETA.md`

Criterio de pronto:

- inventario claro do que e migration oficial
- scripts manuais identificados como excecao
- caminho de replicacao documentado sem ambiguidade

## Frente 5: higiene operacional do repositorio

Objetivo:

- melhorar seguranca de trabalho e clareza de revisao

Escopo:

- remover `.env` do controle de versao caso ainda esteja rastreado
- revisar o que deve permanecer na raiz
- separar melhor alteracoes de documentacao, codigo e banco

Criterio de pronto:

- segredos fora do versionamento
- worktree mais previsivel
- convencões de commit e agrupamento mais claras

## Frente 6: encoding e consistencia textual

Objetivo:

- eliminar ruido visual e tecnico desnecessario

Escopo inicial:

- corrigir arquivos mais visiveis ao usuario
- corrigir arquivos de configuracao e docs de referencia ativa

Arquivos de partida:

- `src/pages/Login.tsx`
- `vite.config.ts`
- documentos ativos em `docs/setup/` e `docs/deploy/`

Criterio de pronto:

- textos sem caracteres corrompidos nas telas e docs principais

## Sequencia sugerida para os proximos ciclos

### Ciclo 1

- Frente 1
- inicio da Frente 5

Resultado esperado:

- ganho rapido de performance e menor risco operacional

### Ciclo 2

- Frente 2
- Frente 3

Resultado esperado:

- melhor manutencao do frontend e menor acoplamento

### Ciclo 3

- Frente 4
- Frente 6

Resultado esperado:

- base de dados mais governavel e documentacao mais confiavel

## Regra de execucao

- nao abrir varias frentes profundas ao mesmo tempo
- sempre validar com `lint`, `test` e `build` quando houver mudanca relevante
- registrar cada ciclo no worklog
- evitar refactor estrutural sem criterio de pronto definido

## Proximo passo recomendado

Comecar pela Frente 1.

Ela entrega valor rapido, tem baixo risco comparado as demais e reduz uma dor tecnica objetiva ja observada no build atual.
