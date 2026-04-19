# 10_BACKLOG_CLICKUP_IMPORT

## Arquivo
- `10_BACKLOG_CLICKUP_3_SPRINTS.csv`

## Como importar no ClickUp
1. Abra o Space/Folder/List no ClickUp.
2. Clique em `Import/Export` -> `CSV`.
3. Selecione `10_BACKLOG_CLICKUP_3_SPRINTS.csv`.
4. Faça o mapeamento de colunas:
- `Task Name` -> `Task Name`
- `List Name` -> `List` (ou use como campo e depois mover por filtro)
- `Status` -> `Status`
- `Priority` -> `Priority`
- `Start Date` -> `Start Date`
- `Due Date` -> `Due Date`
- `Tags` -> `Tags`
- `Description` -> `Description`
- `Story Points` -> `Custom Field (Number)`
- `Dependencies` -> manter como texto e converter em dependencias apos import

## Observacoes
- Datas estao em formato `YYYY-MM-DD`.
- Prioridades usadas: `urgent`, `high`, `normal`.
- IDs `BK-001...BK-024` servem para rastreio entre Jira/Trello/ClickUp.
