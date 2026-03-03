# Correção Estrutural — Reagendamento de Consulta

**Data:** 2026-02-13  
**Autor:** Assistente IA (Cursor)  
**Workflow afetado:** `3.0 - Recebe Paciente` (ID: `A2Tv4vdj6hQDxUZB`)

---

## Contexto

O fluxo de reagendamento apresentava problemas estruturais que causavam comportamentos inesperados:
- O agente IA não pedia CPF antes de reagendar (apenas antes de cancelar)
- O agente não sabia a especialidade do médico, pois essa informação não era fornecida no contexto
- A ferramenta de Reagendamento não recebia a nova data solicitada pelo paciente
- O campo `doctor_id` estava mapeado incorretamente para `calendar_id`

Uma tentativa anterior de correção via System Message (adição de regras obrigatórias) resultou na **truncagem acidental** do System Message completo, removendo a persona, biblioteca de respostas, Think Tool e regras de ouro do agente.

---

## Diagnóstico — 4 Causas Raiz Identificadas

### Causa 1: Especialidade do Médico ausente no contexto do agente
O campo `text` (prompt de entrada) do `AI Agent1` fornecia `Médico Responsável: {{ $json.name }}`, mas **não incluía a especialidade**. A tabela `profiles` possui o campo `specialization` com dados preenchidos para todos os médicos.

### Causa 2: Ferramenta Reagendamento sem nova data solicitada
Os `bodyParameters` da ferramenta `Reagendamento` eram **hardcoded** de nós anteriores, sem nenhum parâmetro `$fromAI()`. O workflow 03.1 espera receber `nova_data_solicitada` no corpo da requisição. Sem esse campo, o sistema reagendava para a mesma data da consulta original.

### Causa 3: Bug no `doctor_id` da ferramenta Reagendamento
O parâmetro `doctor_id` estava mapeado como:
```
={{ $('Get a row3').item.json.calendar_id }}
```
Isso é o ID do Google Calendar, **não** o UUID do médico.

### Causa 4: System Message não instruía CPF para reagendamento
Na tabela de ferramentas do System Message original (v4), o `reagendar` não mencionava validação de CPF. O `validador` dizia "Antes de cancelar ou expor dados sensíveis" — sem mencionar reagendamento.

---

## Correções Aplicadas

### 1. Especialidade adicionada ao contexto do agente
**Node:** `AI Agent1` → `parameters.text`

**Antes:**
```
Médico Responsável:{{ $json.name }}
Próxima Consulta: {{ $('Get a row').item.json.next_appointment_date }}
```

**Depois:**
```
Médico Responsável:{{ $json.name }}
Especialidade do Médico:{{ $json.specialization }}
Próxima Consulta: {{ $('Get a row').item.json.next_appointment_date }}
```

### 2. Nova data solicitada adicionada à ferramenta Reagendamento
**Node:** `Reagendamento` → `parameters.bodyParameters`

**Parâmetro adicionado:**
```json
{
  "name": "nova_data_solicitada",
  "value": "={{ $fromAI('nova_data_solicitada', 'A nova data e hora desejada para o reagendamento, no formato ISO 8601 com timezone São Paulo. Exemplo: 2026-02-15T14:00:00-03:00', 'string') }}"
}
```

### 3. Bug `doctor_id` corrigido
**Node:** `Reagendamento` → `parameters.bodyParameters`

**Antes:**
```json
{"name": "doctor_id", "value": "={{ $('Get a row3').item.json.calendar_id }}"}
```

**Depois:**
```json
{"name": "doctor_id", "value": "={{ $('Get a row3').item.json.profile_id }}"}
```

### 4. System Message restaurado e corrigido
**Node:** `AI Agent1` → `parameters.options.systemMessage`

O System Message completo da versão 4 foi restaurado (incluindo Persona Refinada, Think Tool 2.0, Biblioteca de Respostas, Ferramentas Atualizadas e Regras de Ouro).

**Alterações pontuais na versão restaurada:**

| Local | Antes (v4 original) | Depois (corrigido) |
|-------|---------------------|---------------------|
| Tabela Ferramentas → `reagendar` | `Verificar disponibilidade → confirmar novo horário → executar reagendamento + follow-up` | `Validar CPF (Validador) → Verificar disponibilidade → confirmar novo horário → executar reagendamento + follow-up` |
| Tabela Ferramentas → `validador` | `Antes de cancelar ou expor dados sensíveis` | `Antes de cancelar, reagendar ou expor dados sensíveis` |
| Seção Reagendamento | Sem menção a CPF | Adicionado CPF como primeiro passo: "Para prosseguir com o reagendamento, preciso confirmar seu CPF 💙" |
| Regras de Ouro | 6 regras | Adicionada **Regra 7**: "Sempre valide CPF antes de reagendar ou cancelar — Use o Validador antes de buscar novos horários ou executar qualquer alteração na consulta" |

---

## Verificação

Todas as 7 verificações passaram:

| # | Verificação | Status |
|---|------------|--------|
| 1 | `Especialidade do Médico:{{ $json.specialization }}` no texto do agente | ✅ PASSED |
| 2 | `doctor_id` usando `profile_id` (não `calendar_id`) | ✅ PASSED |
| 3 | `nova_data_solicitada` com `$fromAI()` adicionado | ✅ PASSED |
| 4 | System Message contém `🎭 Persona Refinada` (não truncado) | ✅ PASSED |
| 5 | System Message contém `🧠 Think Tool 2.0` | ✅ PASSED |
| 6 | Tabela reagendar com `Validar CPF (Validador) →` | ✅ PASSED |
| 7 | Regra 7 sobre CPF para reagendamento | ✅ PASSED |

---

## Correção Adicional — Referências Quebradas `Get a row4`

### Causa 5: Nó `Get a row4` inexistente (referência quebrada)

Três ferramentas do agente referenciavam `$('Get a row4')` — um nó que **não existe** no workflow. Os nós existentes são: `Get a row`, `Get a row1`, `Get a row2`, `Get a row3`.

Isso causava:
- **Validação de CPF impossível**: O nó `Validação de Paciente` não conseguia buscar o registro do paciente, tornando qualquer comparação de CPF impossível
- **Cancelamento com dados vazios**: O nó `Cancelamento` enviava `null`/`undefined` para todos os campos do paciente
- **Agendamento sem stage**: O nó `Agendar` enviava `stage` vazio

### Correção aplicada:

| Nó | Campo | Antes (quebrado) | Depois (corrigido) |
|----|-------|-------------------|---------------------|
| `Validação de Paciente` | `filters.conditions[0].keyValue` | `$('Get a row4').item.json.id` | `$('Get a row').item.json.id` |
| `Cancelamento` | `bodyParameters` (id, email, próxima consulta) | `$('Get a row4').item.json.*` | `$('Get a row').item.json.*` |
| `Agendar` | `bodyParameters.stage` | `$('Get a row4').item.json.stage` | `$('Get a row').item.json.stage` |

### Verificação:
- Nenhuma referência a `Get a row4` restante no workflow ✅
- `Validação de Paciente` → `$('Get a row').item.json.id` ✅
- `Cancelamento` → `$('Get a row').item.json.*` ✅
- `Agendar` → `$('Get a row').item.json.stage` ✅

---

## Nota sobre formato de CPF no banco

Os CPFs no banco `patients` estão armazenados em formatos **inconsistentes**:
- Com formatação: `088.162.447-04`
- Sem formatação: `50496737716`

O sistema de Validação (sub-agente Validador) instrui o LLM a aceitar qualquer formato e normalizar antes de comparar. Porém, a comparação depende do LLM, não de código. Se houver problemas persistentes, recomenda-se padronizar os CPFs no banco para um único formato.

---

## Impacto Esperado

1. **CPF validável**: A ferramenta `Validação de Paciente` agora consegue buscar o registro do paciente para comparar CPFs
2. **CPF no reagendamento**: O agente é instruído de forma estrutural a validar CPF antes de reagendar
3. **Especialidade visível**: O agente já sabe a especialidade do médico ao iniciar a conversa
4. **Nova data funcional**: O paciente pode informar uma nova data que será passada ao workflow 03.1
5. **Doctor ID correto**: O UUID do médico será enviado corretamente
6. **System Message completo**: Toda a persona, fluxos, biblioteca de respostas e regras foram restaurados
7. **Cancelamento funcional**: Os dados do paciente agora são enviados corretamente ao workflow de cancelamento
8. **Agendamento com stage**: O campo stage é populado corretamente
