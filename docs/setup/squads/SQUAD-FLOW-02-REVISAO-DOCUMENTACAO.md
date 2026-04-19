# Squad Flow 02 - Revisao de Documentacao e Troubleshooting

Fluxo operacional para revisar documentacao existente, confrontar com o estado atual do projeto e produzir um diagnostico utilizavel.

## Objetivo

Usar o squad para:

- revisar docs tecnicas ou funcionais
- identificar documentos desatualizados
- confrontar codigo, docs e historico de correcoes
- consolidar ajustes ou lacunas

## Quando usar

- quando um modulo estiver confuso
- quando houver muito troubleshooting acumulado
- quando a documentacao parecer divergente do codigo
- antes de mexer em area sensivel do sistema

Exemplos:

- "revise a documentacao de follow-up e aponte o que esta desatualizado"
- "compare docs de convenios com o estado atual do codigo"
- "organize um diagnostico do modulo de WhatsApp antes de nova implementacao"

## Agentes envolvidos

- `orquestrador`
- `pesquisador`
- `executor`
- `revisor`
- `documentador`

## Pipeline

### Etapa 1: demanda do usuario

O usuario informa:

- modulo
- objetivo da revisao
- tipo de saida esperada

### Etapa 2: coleta de fontes

O `pesquisador` deve priorizar:

- `docs/features/`
- `docs/troubleshooting/`
- `docs/delivery/`
- arquivos de `src/`
- `supabase/functions/`
- `migrations/` quando houver impacto de banco

### Etapa 3: comparacao

O `executor` organiza a revisao em:

- o que a documentacao diz
- o que o codigo atual sugere
- onde ha lacuna, risco ou desatualizacao

### Etapa 4: validacao

O `revisor` classifica:

- divergencia critica
- divergencia moderada
- melhoria documental

### Etapa 5: consolidacao

O `documentador` produz um arquivo final com:

- resumo do modulo
- estado da documentacao
- inconsistencias
- recomendacao de consolidacao

## Entregavel esperado

1. Escopo analisado
2. Fontes consultadas
3. Divergencias encontradas
4. Riscos
5. Acao recomendada
6. Proximo passo sugerido

## Checkpoint humano

Necessario antes de:

- reescrever documentacao oficial
- remover arquivo historico
- alterar fluxo tecnico com base na revisao
