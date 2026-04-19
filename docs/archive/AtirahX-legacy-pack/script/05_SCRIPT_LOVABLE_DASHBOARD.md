# 05_SCRIPT_LOVABLE_DASHBOARD

## Uso
Use este script no Lovable para gerar o frontend completo e depois exportar para o repositorio.

```text
Crie um sistema SaaS para clinicas com design premium clean, focado em produtividade operacional.

Estrutura da aplicacao:
- Sidebar com modulos:
  Dashboard, Agenda, Kanban CRM, Pacientes, Mensagens, Relatorios, Equipe, Financeiro, Acesso, Configuracoes.
- Topbar com filtros globais: periodo, medico, unidade, canal, modalidade.

Telas obrigatorias:
1. Dashboard gestor:
   - KPIs: comparecimento, no-show, confirmados/agendados, ocupacao, receita prevista 30d, tempo medio de resposta lead.
   - Graficos: comparecimento diario, no-show diario, ocupacao por medico, receita prevista vs realizada, funil por canal.
   - Drawer contextual com acoes rapidas.
2. Agenda:
   - visao dia/semana/lista
   - status por consulta
   - drawer com acoes de confirmar/reagendar/iniciar/concluir
3. Kanban CRM:
   - colunas de funil
   - cards com score e proxima acao
4. Pacientes:
   - tabela com filtros e busca
   - drawer com timeline e historico
5. Mensagens:
   - inbox por paciente
   - templates e status de entrega
6. Relatorios:
   - grade de graficos com drill-down visual
7. Equipe:
   - lista por role/status
8. Financeiro:
   - receita prevista vs realizada
9. Acesso:
   - matriz RBAC visual
10. Configuracoes:
   - secoes por modulo

Diretrizes visuais:
- layout moderno, claro e profissional;
- sem excesso de efeitos;
- foco em leitura de dados;
- responsivo desktop/mobile;
- acessibilidade basica;
- estados loading/empty/error.

Saida esperada:
- frontend navegavel completo;
- componentes reutilizaveis;
- pronto para exportar e integrar com backend real.
```

## Pos-Lovable
1. Exportar codigo.
2. Integrar no repositorio.
3. Conectar com backend real (Supabase/APIs).
