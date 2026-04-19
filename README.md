# Atirah-IA-OS

## Tipo

Produto com aplicacao web, banco, automacoes e documentacao tecnica.

## Objetivo

Sistema web para operacao clinica com modulos de autenticacao, agenda, CRM, follow-up, pacientes, convenios, WhatsApp, teleconsulta e automacoes com IA.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui + Radix UI
- Supabase para auth, banco, realtime e edge functions
- React Query para carregamento e cache

## Estrutura atual

- `src/`: frontend da aplicacao
- `supabase/functions/`: edge functions e integracoes serverless
- `migrations/`: migracoes SQL
- `seeds/`: carga inicial e dados auxiliares
- `public/`: assets publicos
- `docs/`: documentacao organizada por tema
- `scripts/`: scripts auxiliares

## Modulos principais

- Dashboard e metricas
- CRM e pre-pacientes
- Agenda e follow-up
- Pacientes e prontuarios
- Convenios por medico
- WhatsApp e automacao de contatos
- Assistente com integracoes Gemini

## Ambiente local

1. Instale as dependencias com `npm install`.
2. Configure as variaveis de ambiente locais.
3. Rode `npm run dev`.
4. Gere build com `npm run build`.

O template de ambiente foi movido para `docs/setup/TEMPLATE_ENV_LOCAL.txt`.

## Documentacao

- Guia de documentacao: `docs/README.md`
- Setup e ambiente: `docs/setup/`
- Guias operacionais de squad: `docs/setup/squads/`
- Deploy: `docs/deploy/`
- Features por modulo: `docs/features/`
- Banco e RLS: `docs/database/`
- Troubleshooting e correcoes: `docs/troubleshooting/`
- Historico de entregas e resumos: `docs/delivery/`

## Pendencias de padronizacao

- Criar arquivos operacionais complementares como `TASKS.md` e `DECISIONS.md` se o projeto continuar crescendo.
- Revisar o que deve permanecer versionado dentro da raiz do projeto.
