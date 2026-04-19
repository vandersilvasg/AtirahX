# Documentacao

Este diretorio concentra a documentacao operacional e tecnica do projeto, separada por objetivo.

## Estrutura

- `setup/`: onboarding, configuracao local, replicacao e ambiente
- `setup/squads/`: fluxos operacionais e guias de uso dos squads do projeto
- `deploy/`: guias de deploy e checklists
- `features/`: documentacao funcional por modulo
- `database/`: banco, migracoes, RLS, auditorias e queries
- `troubleshooting/`: correcoes, debug, diagnosticos e solucoes
- `delivery/`: historico de entregas, ajustes, resumos e validacoes
- `archive/`: reservado para material supersedido ou obsoleto

## Features

- `features/convenios/`
- `features/followup/`
- `features/whatsapp/`
- `features/gemini/`
- `features/metrics/`
- `features/patients/`
- `features/crm/`
- `features/assistant/`
- `features/integration/`

## Regra de Organizacao

- Documentacao ativa e reutilizavel deve ficar em `setup/`, `deploy/`, `features/` ou `database/`
- Fluxos operacionais de squad e guias de acionamento devem ficar em `setup/squads/`
- Material de incidente, depuracao ou correcao deve ficar em `troubleshooting/`
- Entregas, resumos executivos e historico incremental devem ficar em `delivery/`
- A raiz do repositorio deve manter apenas codigo, configuracoes principais e o `README.md`
