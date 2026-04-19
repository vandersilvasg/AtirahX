# Excecoes de Numeracao das Migrations

Data: 2026-04-18

Projeto: `Atirah-IA-OS`

## Objetivo

Registrar excecoes historicas na numeracao das migrations sem renomear arquivos ja existentes no worktree.

## Excecao identificada

Existe duplicidade numerica no prefixo `46º_`:

- `migrations/46º_Migration_fix_infinite_recursion_rls_profiles.sql`
- `migrations/46º_Migration_melhorias_foreign_key_cascade.sql`

## Decisao aplicada

- nao renumerar arquivos historicos nesta rodada
- manter ambos os arquivos como estao para evitar reescrita de historico e referencias difusas
- tratar essa duplicidade como excecao documentada da trilha

## Leitura pragmatica

- a trilha numerada continua utilizavel, mas com uma anomalia conhecida em `46º_*`
- qualquer leitura cronologica ou auditoria deve considerar os dois arquivos como parte da mesma faixa historica
- novas migrations devem seguir numeracao sequencial normal a partir do maior prefixo disponivel

## Estado atual

- `19º_*` voltou a ser tratada como migration historica
- a logica resiliente que estava aberta em `19º_*` foi promovida para `59º_Migration_harden_realtime_publication_reapply.sql`
- a duplicidade `46º_*` ficou documentada explicitamente neste arquivo
