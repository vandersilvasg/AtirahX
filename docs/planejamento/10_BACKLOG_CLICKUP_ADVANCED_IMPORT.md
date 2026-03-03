# 10_BACKLOG_CLICKUP_ADVANCED_IMPORT

## Arquivos Gerados
- `10_BACKLOG_CLICKUP_ADVANCED_BY_LIST.csv`
- `10_BACKLOG_CLICKUP_ADVANCED_BY_FOLDER.csv`

## Qual Arquivo Usar
1. `ADVANCED_BY_LIST`:
Use quando as listas de sprint ja existem no ClickUp e voce quer apenas criar tarefas nelas.
2. `ADVANCED_BY_FOLDER`:
Use quando voce quer importar com a estrutura completa `Folder + Lists` em uma passada.

## Mapeamento Recomendado no Import CSV (ClickUp)
- `Task Name` -> Task Name
- `Folder Name` -> Folder (somente no arquivo BY_FOLDER)
- `List Name` -> List
- `Status` -> Status
- `Priority` -> Priority
- `Start Date` -> Start Date
- `Due Date` -> Due Date
- `Tags` -> Tags
- `Description` -> Description

## Campos Custom
Crie (ou mapeie) estes custom fields:
1. `Backlog ID` (Text)
2. `Sprint` (Dropdown ou Text)
3. `Work Type` (Dropdown: Epic, Story, Task)
4. `Story Points` (Number)
5. `Depends On IDs` (Text)

## Observacoes
- Datas estao em `YYYY-MM-DD`.
- Dependencias estao por ID textual (`BK-xxx`); apos import, converta para dependencies nativas do ClickUp.
- Prioridades usadas: `urgent`, `high`, `normal`.
