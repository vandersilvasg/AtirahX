# 03_SCRIPT_GEMINI_DASHBOARD

## Uso
Cole este prompt no Gemini (AI Studio/CLI) para gerar plano + implementacao orientada.

```text
Voce vai gerar e implementar um dashboard completo para SaaS de clinicas.

Arquivos de referencia:
- AtirahX/dashboard/11_DASHBOARD_BLUEPRINT_V1_GESTAO_CLINICAS.md
- AtirahX/dashboard/11_DASHBOARD_GRAFICOS_KPIS_V1.csv
- AtirahX/telas/12_TELAS_V1_INDEX.md
- AtirahX/telas/13_TELA_PACIENTES_V1.md ate AtirahX/telas/21_TELA_ACESSO_RBAC_V1.md
- AtirahX/planejamento/23_BACKLOG_TECNICO_SPRINTS_EXECUCAO_V1.md

Tarefa:
1) Criar plano tecnico enxuto (arquitetura, componentes, rotas, dados).
2) Implementar frontend das telas principais.
3) Definir camada de dados com hooks e contratos de API.
4) Preparar pontos de integracao com backend (Supabase/RPCs).

Requisitos funcionais:
- Dashboard gestor com filtros globais e graficos G01 G02 G04 G05 G06.
- Agenda operacional com status de atendimento.
- Kanban CRM com etapas e score.
- Pacientes com busca e drawer.
- Mensagens com inbox e templates.
- Relatorios com exportacao (stub frontend se necessario).
- RBAC visual (matriz de acesso).

Requisitos nao funcionais:
- responsivo;
- acessibilidade basica;
- tempo de render inicial otimizado;
- componentes reutilizaveis;
- estados loading/empty/error.

Entrega:
- codigo ou patch completo por modulo,
- breve racional tecnico por decisao critica,
- lista de TODOs para dependencia externa.
```
