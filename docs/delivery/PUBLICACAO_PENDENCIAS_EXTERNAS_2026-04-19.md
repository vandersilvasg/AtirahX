# Publicacao - Pendencias Externas

Data: 2026-04-19

## Status local concluido

Foi concluido localmente:

- branch criada: `feat-premium-product-evolution-2026-04-19`
- commit principal: `931670b`
- commit corretivo de limpeza: `968250d`
- `npm run build` validado
- `npm run test:run` validado
- `npm run lint` validado
- `npm run validate` validado

## Bloqueios externos encontrados

### 1. Supabase CLI sem autenticacao

Tentativa de vincular e aplicar migrations:

```bash
supabase link --project-ref epyreefmaeajfltltpwa
```

Erro encontrado:

```text
Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable.
```

Conclusao:

- o projeto Supabase foi identificado: `epyreefmaeajfltltpwa`
- falta login ativo no Supabase CLI ou variavel `SUPABASE_ACCESS_TOKEN`

### 2. Remote Git invalido ou inacessivel

Remote atual encontrado:

```text
origin https://github.com/n8nlabz/aura-clinic-vue.git
```

Erro ao publicar branch:

```text
remote: Repository not found.
fatal: repository 'https://github.com/n8nlabz/aura-clinic-vue.git/' not found
```

Conclusao:

- o `origin` atual nao esta publicavel neste ambiente
- existe referencia historica local ao nome `aura-clinic-vue`
- nao foi feita troca de remoto automaticamente para evitar publicar em repositorio errado

## Comandos prontos para concluir

### Banco

Se o acesso Supabase for o correto:

```bash
supabase login
supabase link --project-ref epyreefmaeajfltltpwa
supabase db push
```

### Git

Se o `origin` estiver correto e acessivel:

```bash
git push -u origin feat-premium-product-evolution-2026-04-19
```

Se o remoto precisar ser corrigido primeiro:

```bash
git remote set-url origin https://github.com/OWNER/REPO.git
git push -u origin feat-premium-product-evolution-2026-04-19
```

## Migrations desta entrega

- `migrations/60º_Migration_create_financial_entries.sql`
- `migrations/61º_Migration_expand_pre_patients_growth_fields.sql`

## Observacao operacional

Nao foi alterado o `origin` automaticamente porque nao houve confirmacao tecnica suficiente de que o repositorio acessivel `vandersilvasg/AtirahX` corresponde a este projeto.
