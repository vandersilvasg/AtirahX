# Plano de Commits

Data: 2026-04-18

Projeto: `Atirah-IA-OS`

## Objetivo

Definir a ordem e o escopo exato dos commits recomendados para fechar a rodada atual sem misturar banco, documentacao e frontend.

## Commit 1

### Titulo sugerido

`chore(db): consolidate migrations hygiene and realtime publication docs`

### Escopo

- `migrations/57º_Migration_phase0_schema_compatibility.sql`
- `migrations/58º_Migration_crm_journey_and_automation_foundation.sql`
- `migrations/59º_Migration_harden_realtime_publication_reapply.sql`
- delecoes dos `migrations/README_*.md`
- `docs/database/**`
- `docs/troubleshooting/CORRECAO_REALTIME_CHANNEL_ERROR.md`
- `docs/troubleshooting/URGENTE_CORRECAO_REALTIME.md`
- `docs/delivery/RESUMO_DEBUG_E_CORRECAO_COMPLETA.md`
- `docs/delivery/CHECKPOINT_MIGRATIONS_2026-04-18.md`
- `docs/delivery/CHECKPOINT_CONSOLIDACAO_DIFF_2026-04-18.md`
- `docs/delivery/CHECKPOINT_FECHAMENTO_MIGRATIONS_DOCS_2026-04-18.md`
- partes correspondentes do `docs/delivery/PROCESSO_AJUSTES_E_WORKLOG_2026-03-24.md`
- `.gitignore`

### Justificativa

- fecha o bloco de banco como unidade logica unica
- preserva historico da `19º_*`
- promove a `59º_*` como trilha segura de reaplicacao
- tira scripts e READMEs auxiliares do fluxo oficial de schema

### Pendencia apos o commit

- executar a `59º_*` no ambiente Supabase
- validar com `VERIFICAR_REALTIME_TABELAS.sql`

## Commit 2

### Titulo sugerido

`refactor(frontend): split domains, add supabase loader pattern and expand tests`

### Escopo

- `package.json`
- `package-lock.json`
- `scripts/run-vitest.mjs`
- `vite.config.ts`
- `tailwind.config.ts`
- `src/**`
- `README.md`
- `docs/README.md`
- `docs/delivery/CHECKPOINT_FRONTEND_TESTES_2026-04-18.md`
- `docs/delivery/CHECKPOINT_FECHAMENTO_FRONTEND_TESTES_2026-04-18.md`
- partes correspondentes do `docs/delivery/PROCESSO_AJUSTES_E_WORKLOG_2026-03-24.md`

### Justificativa

- fecha o maior bloco tecnico como refactor estrutural coerente
- consolida lazy loading, loader do Supabase, extracao por dominio e cobertura de testes
- mantem o frontend separado do banco para facilitar revisao e rollback

### Validacao associada

- `npm run test:run`
- checagens focadas de eslint nos hooks alterados

## Ordem recomendada

1. Commitar `migrations + docs de banco`
2. Commitar `frontend + testes`

## Regra pratica

Se durante o stage surgir arquivo que mistura os dois blocos, ele deve ser decidido explicitamente antes do commit, e nao arrastado por conveniencia.
