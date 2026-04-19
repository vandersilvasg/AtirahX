# Checklist de Homologacao e Go-Live

Guia curto para validar se o `Atirah-IA-OS` esta pronto para uso operacional.

## Objetivo

Dar uma resposta pratica para 3 cenarios:

- `Pode usar hoje`
- `Pode usar com acompanhamento`
- `Ainda nao deve entrar em uso`

## Pre-condicoes

- `.env.local` configurado com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- dependencias instaladas com `npm install`
- ambiente sobe com `npm run dev`
- build local passa com `npm run build`

## Gate tecnico atual

Estado conhecido em `19/04/2026`:

- `main` alinhada com remoto
- `npm run test:run` verde
- `npm run build` verde
- trilha oficial do Supabase reconciliada em `supabase/migrations/`
- Realtime validado em `pre_patients`

## Checklist de aceite

Use a tabela abaixo durante a homologacao.

| Tela/Fluxo | Teste | Status | Observacao | Bloqueia go-live |
| --- | --- | --- | --- | --- |
| Ambiente | `.env.local`, `npm run dev`, `npm run build` |  |  | Sim |
| Login | login com usuario real |  |  | Sim |
| Login | logout |  |  | Sim |
| Login | recuperacao de senha, se ativa |  |  | Nao |
| Profile | dados do usuario carregam corretamente |  |  | Nao |
| PrePatients | criar lead |  |  | Sim |
| PrePatients | editar lead |  |  | Sim |
| PrePatients | segmentar por `Quentes`, `Follow-up`, `Pedem acao`, `Convertidos` |  |  | Nao |
| PrePatients | usar `Registrar contato` na tabela |  |  | Sim |
| PrePatients | usar avancos rapidos de etapa |  |  | Sim |
| PrePatients | cards do topo atualizam apos a mudanca |  |  | Sim |
| Patients | busca por nome/telefone/convenio |  |  | Sim |
| Patients | filtros por segmento |  |  | Nao |
| Patients | abrir detalhe do paciente |  |  | Sim |
| Agenda | criar agendamento |  |  | Sim |
| Agenda | editar agendamento |  |  | Sim |
| Agenda | remover agendamento |  |  | Sim |
| FollowUp | lista carrega e mostra pendencias |  |  | Nao |
| WhatsApp | lista de conversas carrega |  |  | Sim |
| WhatsApp | contexto reage a mudancas de lead/paciente |  |  | Sim |
| Financeiro | dashboard carrega sem erro |  |  | Sim |
| Financeiro | metricas principais parecem coerentes |  |  | Sim |
| Users | usuario restrito nao acessa o que nao deve |  |  | Sim |

## Ordem recomendada de teste

1. `Ambiente`
2. `Login` e `Profile`
3. `PrePatients`
4. `Patients`
5. `Agenda`
6. `FollowUp`
7. `WhatsApp`
8. `Financeiro`
9. `Users`

## Criterio de decisao

Marque como `Pode usar hoje` se:

- todos os itens com `Bloqueia go-live = Sim` estiverem aprovados
- nao houver erro de autenticacao, persistencia ou atualizacao em tempo real nos fluxos principais

Marque como `Pode usar com acompanhamento` se:

- os fluxos principais estiverem aprovados
- existirem falhas pontuais nao bloqueantes em modulos secundarios

Marque como `Ainda nao deve entrar em uso` se:

- falhar qualquer item bloqueante
- houver divergencia de dados, erro de permissao ou tela principal quebrando

## Registro rapido de resultado

Preencha ao final:

```text
Data:
Responsavel:
Ambiente:
Resultado final: Pode usar hoje | Pode usar com acompanhamento | Ainda nao deve entrar em uso
Bloqueios encontrados:
- 
Observacoes:
- 
```

## Observacao pratica

Para o estado atual do projeto, a decisao nao depende mais de build ou estrutura do repositorio. O risco residual esta mais em validacao funcional real com dados, perfis e operacao da clinica.
