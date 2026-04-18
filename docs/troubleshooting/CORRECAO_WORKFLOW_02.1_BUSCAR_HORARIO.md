# Correção: Erro no workflow 02.1 - AtirahX - Agenda Pré Paciente [Buscar Horário]

**Data:** 2026-02-11  
**Workflow n8n:** `02.1  - AtirahX - Agenda Pré Paciente [Buscar Horário]` (ID: `fDUr1lJ5iTbrDCKcv0Til`)

---

## Diagnóstico do erro

### Onde falha
- **Nó que quebra:** `Busca CalendarID do Médico` (Supabase – tabela `profile_calendars`)
- **Mensagem:** `invalid input syntax for type uuid: "undefined"`
- **Causa:** O nó usa `$json.id` como `profile_id` na filtragem, mas o item que chega tem **`$json` vazio** (`{}`), então `$json.id` fica `undefined` e o Supabase rejeita.

### Fluxo até o erro
1. **Webhook** – recebe o POST (sucesso).
2. **Busca ID do Médico** – Supabase: busca o médico (por especialidade ou outro critério).  
   - Na execução analisada esse nó devolveu **1 item com `json: {}`** (nenhum campo).
3. **Busca CalendarID do Médico** – Supabase: `profile_calendars` com `profile_id` = `$json.id`.  
   - Como `$json` está vazio, `$json.id` é `undefined` → erro de UUID.

Conclusão: o problema não é no nó que dá erro, e sim no **nó anterior**: **Busca ID do Médico** não está devolvendo um objeto com `id` (UUID do médico/profile).

---

## Possíveis causas no nó “Busca ID do Médico”

1. **Filtro usa campo que não existe no payload**  
   Ex.: filtro em `$json.body["especialidade do médico"]` mas o webhook envia `especialidade_do_medico` ou outro nome.

2. **Nenhuma linha encontrada**  
   A consulta ao Supabase não encontra médico para o valor enviado (ex.: “cardiologista” no body e no banco está “Cardiologia”), e o nó segue com 1 item vazio.

3. **Leitura do body errada**  
   No webhook do n8n o body costuma vir em `$json.body` ou `$json.query`. Se o nó “Busca ID do Médico” usar `$json.especialidade` em vez de `$json.body["especialidade do médico"]` (ou o nome real do campo), o filtro fica incorreto e pode não retornar linha (ou retornar vazio).

4. **Tabela/visão e coluna**  
   O nó pode estar consultando tabela ou coluna errada (ex.: sem coluna `id` no select, ou outra tabela que não tem o médico).

---

## Ajustes recomendados no n8n

### 1. Conferir saída do Webhook
- Abrir o workflow e rodar só até o **Webhook** (ou ver execução que disparou o erro).
- Ver o **JSON de saída** do Webhook (estrutura do body).
- Anotar o **nome exato** do campo da especialidade (ex.: `"especialidade do médico"`, `especialidade_do_medico`, etc.).

### 2. Ajustar “Busca ID do Médico”
- **Tabela:** a que tem o médico (ex.: `profiles` ou view com role médico).
- **Filtro:** usar exatamente o campo que vem no body, por exemplo:
  - `$json.body["especialidade do médico"]`  
  - ou o nome que aparecer no passo 1.
- Se no banco a especialidade está em outro formato (ex.: “Cardiologia”), adicionar antes um **Code** que normalize o valor (ex.: “cardiologista” → “Cardiologia”) e passe para o Supabase.
- Garantir que o nó Supabase **retorna** a coluna **`id`** (UUID do profile/médico). Se estiver em “Select columns”, incluir `id`.

### 3. Evitar `undefined` no “Busca CalendarID do Médico”
- **Opção A – IF antes do Supabase:**  
  Depois de “Busca ID do Médico”, colocar um **IF**:  
  `$json.id` existe e não é vazio.  
  - Se **sim** → segue para “Busca CalendarID do Médico”.  
  - Se **não** → ramo de “erro” (Respond to Webhook com mensagem tipo “Nenhum médico encontrado para a especialidade informada” ou similar).

- **Opção B – Continue On Fail + tratamento:**  
  Em “Busca CalendarID do Médico” ativar “Continue On Fail” e depois tratar: se `$json.id` for vazio, não chamar Supabase (ou usar outro nó que só rode quando houver `id`).

Assim você evita passar `undefined` para o Supabase e dá uma resposta controlada quando não houver médico.

### 4. Conferir “Busca CalendarID do Médico”
- Manter filtro: `profile_id` = `$json.id` (quando o item tiver `id`).
- Só será executado quando “Busca ID do Médico” realmente devolver um objeto com `id`.

---

## Resumo

| O quê | Onde | Ação |
|------|------|------|
| Payload do webhook | Webhook | Ver nomes exatos dos campos (ex.: especialidade). |
| Filtro e retorno | Busca ID do Médico | Usar campo correto do body; garantir que a query retorna coluna `id`. |
| Nenhum médico encontrado | Entre Busca ID e Busca CalendarID | Incluir IF (ou ramo) para quando `$json.id` estiver vazio e retornar mensagem de erro em vez de seguir. |

Depois desses ajustes, o erro `invalid input syntax for type uuid: "undefined"` no nó **Busca CalendarID do Médico** deixa de ocorrer, pois esse nó só receberá execução quando houver um `id` válido vindo do nó **Busca ID do Médico**.
