# Squad Uso Rapido

Guia curto para acionar os squads do piloto no `Atirah-IA-OS`.

## Regra principal

Voce inicia a tarefa. O squad executa o fluxo. O processo para nos checkpoints sensiveis.

## Fluxos disponiveis

### 1. Planejamento de feature

Arquivo:

- `docs/setup/squads/SQUAD-FLOW-01-PLANEJAMENTO-FEATURE.md`

Use para:

- backlog
- refinamento de feature
- impacto tecnico
- planejamento de sprint

Exemplo de pedido:

```text
Analise o modulo de teleconsulta no projeto Atirah-IA-OS e gere um backlog tecnico inicial.

Objetivo:
Melhorar estabilidade e experiencia do medico.

Foco:
Fluxo principal de atendimento.

Restricoes:
Nao alterar automacoes ativas sem checkpoint humano.
```

### 2. Revisao de documentacao

Arquivo:

- `docs/setup/squads/SQUAD-FLOW-02-REVISAO-DOCUMENTACAO.md`

Use para:

- diagnostico de modulo
- comparacao entre docs e codigo
- consolidacao de troubleshooting

Exemplo de pedido:

```text
Revise a documentacao do modulo de follow-up no projeto Atirah-IA-OS e aponte divergencias entre docs, historico de correcoes e estado atual do sistema.
```

### 3. Marketing e copy

Arquivo:

- `docs/setup/squads/SQUAD-FLOW-03-MARKETING-COPY.md`

Use para:

- landing page
- emails
- proposta de valor
- textos de apresentacao

Exemplo de pedido:

```text
Crie a copy da landing page do Atirah-IA-OS para clinicas, com foco em operacao, automacao e atendimento.
```

## Agentes base do piloto

- `03-AGENTS/orquestrador.md`
- `03-AGENTS/pesquisador.md`
- `03-AGENTS/estrategista.md`
- `03-AGENTS/executor.md`
- `03-AGENTS/revisor.md`
- `03-AGENTS/documentador.md`

## Checkpoints obrigatorios

- antes de publicar algo
- antes de implementar mudanca sensivel
- antes de alterar automacao ativa
- antes de mexer em banco, credenciais ou integracoes
- antes de promover artefato para biblioteca reutilizavel
