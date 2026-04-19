# Correção: Workflow "3.0 Recebe Paciente" - Output Vazio

**Data:** 2026-02-07  
**Status:** Resolvido

---

## Problema

O nó "Get a row1" no workflow "3.0 Recebe Paciente" retornava um objeto vazio `{}` no output, impedindo o fluxo de obter informações do médico vinculado ao paciente.

### Sintomas

- Output do nó "Get a row1": `{}`
- Mensagem: "This node will output an empty item if nothing would normally be returned"

---

## Causas Identificadas

### 1. Tabela `patient_doctors` Vazia

A tabela que armazena os vínculos entre pacientes e médicos não tinha nenhum registro.

### 2. SessionId Inválido (Potencial)

Em alguns casos, o `sessionId` enviado ao webhook não correspondia a nenhum paciente existente. Isso pode ocorrer quando:

- O workflow de classificação gera um novo ID via Crypto em vez de usar um paciente existente
- Problema de match no campo `phone` devido a formatos diferentes

---

## Soluções Aplicadas

### 1. Migration: Popular `patient_doctors`

Criada a migration `55º_Migration_populate_patient_doctors.sql` que vincula todos os pacientes existentes a médicos disponíveis.

```sql
INSERT INTO patient_doctors (patient_id, doctor_id, is_primary)
SELECT 
    p.id as patient_id,
    d.doctor_id,
    true as is_primary
FROM patients p
CROSS JOIN LATERAL (
    SELECT id as doctor_id 
    FROM profiles 
    WHERE role = 'doctor' 
    ORDER BY RANDOM() 
    LIMIT 1
) d
WHERE NOT EXISTS (
    SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = p.id
)
ON CONFLICT (patient_id, doctor_id) DO NOTHING;
```

### 2. Verificação de Formato de Telefone

Os telefones dos pacientes devem seguir o formato do WhatsApp:
- Formato correto: `5521991363477@s.whatsapp.net`
- Formatos incorretos para match: `21 99458-8965`, `11988887777`

---

## Boas Práticas para Evitar em Outros Nós

### 1. Sempre Usar `alwaysOutputData: true`

Configure todos os nós de busca (Supabase, Postgres, etc.) com `alwaysOutputData: true` para evitar que o fluxo pare quando não encontrar dados.

### 2. Adicionar Nó IF Após Buscas

Após cada nó de busca, adicione um nó IF para verificar se retornou dados:

```javascript
// Condição para verificar se encontrou dados
{{ $json.id }} is not empty
```

- **true**: Continua o fluxo normal
- **false**: Trata o caso (notifica, usa valor padrão, etc.)

### 3. Validar Dados no Início

Adicione um nó de validação logo após o Webhook para verificar se os dados recebidos são válidos:

```javascript
// Verificar se sessionId existe e é válido
{{ $json.body.sessionId }} is not empty
```

### 4. Usar Merge com Valores Padrão

Use o nó Merge ou Set para definir valores padrão quando dados estão ausentes:

```javascript
// Valor padrão para doctor_id se não encontrado
{{ $json.doctor_id || 'ID_MEDICO_PADRAO' }}
```

### 5. Padronizar Formato de Telefone

No workflow de classificação, normalize o formato do telefone antes de buscar:

```javascript
// Normalizar para formato WhatsApp
const phone = $json.remotejid;
// Se não tiver @s.whatsapp.net, adicionar
if (!phone.includes('@s.whatsapp.net')) {
    return phone + '@s.whatsapp.net';
}
```

---

## Fluxo Correto

```
Webhook → Get Patient → Get Patient_Doctor → Continue
                ↓               ↓
            IF Empty?       IF Empty?
                ↓               ↓
            Handle        Assign Default Doctor
```

---

## Teste de Validação

Após aplicar as correções, teste o workflow com:

```json
{
  "mensagem": "Teste",
  "remotejId": "5521991363477@s.whatsapp.net",
  "sessionId": "7d02684b-7078-4431-a480-7a13c32209b6",
  "link": null
}
```

O nó "Get a row1" deve retornar:

```json
{
  "id": "...",
  "patient_id": "7d02684b-7078-4431-a480-7a13c32209b6",
  "doctor_id": "1d9e53d2-44c9-4f30-922e-29af8903abe5",
  "is_primary": true,
  "created_at": "..."
}
```

---

## Arquivos Relacionados

- `migrations/55º_Migration_populate_patient_doctors.sql`
- `src/components/whatsapp/AssignDoctorModal.tsx`
- Workflow n8n: "3.0 Recebe Paciente" (ID: A2Tv4vdj6hQDxUZB)
- Workflow n8n: "01.2 - AtirahX - Classificação de mensagem" (ID: yDwtu4ThEU7wk8an)

---

**Versão:** 1.0  
**Autor:** Sistema MedX
