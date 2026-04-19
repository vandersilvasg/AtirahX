# Atualização do System Message - AI Agent 3.0 Recebe Paciente

**Workflow:** 3.0 - Recebe Paciente  
**Nó:** AI Agent1  
**Data:** 2026-02-13

## Alterações realizadas

### 1. Nova seção: REGRA OBRIGATÓRIA — REAGENDAMENTO

Adicionada antes da seção "Reagendamento de Consulta (contextualizado)":

```markdown
#### 🔒 REGRA OBRIGATÓRIA — REAGENDAMENTO

**Quando o paciente pedir REAGENDAR ou REMARCAR:**
1. **PRIMEIRO:** Peça o CPF e use a ferramenta Validador. NUNCA busque horários ou use Reagendamento antes de CPF validado.
2. **APÓS CPF CONFIRMADO:** Confirme a especialidade do médico (ex: "Você está com a Dra. X, cardiologista — está correto?")
3. **SÓ ENTÃO:** Busque horários e execute o reagendamento.
```

### 2. Tabela de Ferramentas - reagendar

**Antes:**
> Validar o CPF → Verificar disponibilidade → confirmar novo horário → confirmar a especialidade → executar reagendamento + gerar expectativa de follow-up

**Depois:**
> 1) Validar CPF (Validador) 2) Confirmar especialidade do médico 3) Verificar disponibilidade 4) confirmar novo horário 5) executar reagendamento + follow-up

### 3. Regra de Ouro 7

**Antes:**
> 7. Sempre valide o CPF quando o paciente for reagendar

**Depois:**
> 7. **Reagendamento:** SEMPRE valide o CPF antes de qualquer ação. Após CPF validado, confirme a especialidade do médico antes de prosseguir

---

## Como aplicar manualmente no n8n

1. Abra o workflow **3.0 - Recebe Paciente** no n8n
2. Clique no nó **AI Agent1**
3. Em **Options** → **System Message**, localize e altere os três pontos acima
4. Salve o workflow

---

## ⚠️ Estado atual do workflow

**Importante:** Uma atualização via API foi aplicada, mas utilizou uma versão **reduzida** do System Message (parte do conteúdo original foi removida). 

**O que fazer:** É necessário restaurar o conteúdo completo. Abra o nó AI Agent1 no n8n e:

1. **Se o System Message estiver truncado** (sem Persona, Think Tool, Biblioteca de Respostas, etc.): restaure a partir de um backup ou da versão anterior do workflow (versão 4 no histórico).

2. **Depois**, aplique as 3 alterações acima no System Message completo.

3. **Se preferir**, use o conteúdo completo do arquivo `64946f61-b961-4588-9134-94fa61fae667.txt` na pasta agent-tools (contém o System Message completo já modificado) — extraia o valor de `systemMessage` do nó AI Agent1.
