# Checkpoint de Migrations

Data: 2026-04-18

Projeto: `Atirah-IA-OS`

## Objetivo

Separar leitura de migrations oficiais da leitura de scripts corretivos avulsos, reduzindo ambiguidade operacional.

## Leitura consolidada

### Bloco oficial numerado

Arquivos observados nesta rodada:

- `migrations/57º_Migration_phase0_schema_compatibility.sql`
- `migrations/58º_Migration_crm_journey_and_automation_foundation.sql`
- `migrations/19º_Migration_fix_realtime_appointments_patients.sql` (historica, preservada)
- `migrations/59º_Migration_harden_realtime_publication_reapply.sql`

Leitura pragmatica:

- `57` e `58` seguem o padrao de migration oficial
- `59` passa a concentrar a reaplicacao resiliente do realtime sem reescrever historico
- ambas sao amplas, orientadas a compatibilidade estrutural, CRM de jornada e fundacao de automacoes
- esse bloco deve ser revisado como trilha oficial de schema

### Scripts corretivos avulsos

Arquivos observados:

- `docs/database/manual-sql/fix_missing_profile_vander.sql`
- `docs/database/manual-sql/fix_missing_profile_vander_hotmail.sql`
- `docs/database/manual-sql/fix_profile_force_id.sql`

Leitura pragmatica:

- esses arquivos nao seguem o padrao numerado
- sao scripts pontuais de reparo/manual intervention
- referenciam usuarios e emails especificos
- um deles altera politica de RLS de forma debug/permissiva

## Classificacao recomendada

### Manter como migration oficial

- apenas arquivos numerados no padrao `NNº_Migration_*.sql`

### Tratar como script manual ou incidente

- todos os arquivos `fix_*.sql`
- scripts com email, usuario ou ID hardcoded
- scripts que alteram RLS para diagnostico temporario

## Riscos identificados

- mistura de migrations oficiais com scripts pessoais aumenta risco de replicacao indevida
- `fix_profile_force_id.sql` e especialmente sensivel por mexer em politica de leitura de `profiles`
- ha ruido de encoding nos scripts corretivos, o que reduz confiabilidade de revisao
- existe duplicidade numerica em migrations `46º_*`, o que enfraquece a leitura cronologica da trilha oficial
- a duplicidade numerica em `46º_*` continua exigindo leitura assistida por documentacao

## Higiene executada nesta rodada

- arquivos `README_*.md` de apoio foram movidos para `docs/database/migration-notes/`
- scripts `fix_*.sql` foram movidos para `docs/database/manual-sql/`
- a pasta `migrations/` ficou reservada para a trilha SQL numerada
- a edicao aberta em `migrations/19º_Migration_fix_realtime_appointments_patients.sql` foi retirada do historico e promovida para `migrations/59º_Migration_harden_realtime_publication_reapply.sql`
- a duplicidade `46º_*` foi documentada em `docs/database/MIGRATION_NUMERACAO_EXCECOES.md`

## Proximo passo recomendado

1. Nao aplicar `fix_*.sql` automaticamente em fluxo padrao de banco.
2. Manter `57`, `58` e `59` como bloco de revisao da trilha oficial.
3. Usar `docs/database/MIGRATION_NUMERACAO_EXCECOES.md` como referencia ao revisar a faixa historica com duplicidade `46º_*`.
4. Nao voltar a editar migrations historicas quando a necessidade puder ser resolvida com migration incremental.
## Revisao da `59º_*`

Leitura final desta rodada:

- a `59º_*` resolve o problema certo no lugar certo: nova migration, sem reescrever a `19º_*`
- a logica de reaplicacao ficou concentrada e reutilizavel durante a propria execucao
- o helper e removido ao final da migration, evitando residuo estrutural permanente
- nao foi identificado bloqueio estrutural no SQL por leitura estatica

Pendencia real:

- a validacao definitiva depende de execucao no ambiente Supabase e conferencia com `VERIFICAR_REALTIME_TABELAS.sql`
