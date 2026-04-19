-- Descrição: Popular tabela patient_doctors com vínculos iniciais entre pacientes e médicos
-- Data: 2026-02-07
-- Autor: Sistema MedX

-- ============================================================================
-- NOTA: Esta migration foi aplicada automaticamente via Supabase Dashboard
-- para corrigir o problema de outputs vazios nos workflows do n8n.
-- 
-- O problema: O nó "Get a row1" no workflow "3.0 Recebe Paciente" retornava
-- dados vazios porque a tabela patient_doctors não tinha registros.
--
-- A solução: Vincular todos os pacientes existentes a médicos disponíveis.
-- ============================================================================

-- Inserir vínculos entre pacientes e médicos (distribuindo aleatoriamente)
-- Se já existir um vínculo para o paciente, ignora (ON CONFLICT DO NOTHING)
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

-- ============================================================================
-- IMPORTANTE: Para novos pacientes, o vínculo deve ser criado automaticamente:
-- 1. Via modal AssignDoctorModal quando um pré-paciente é promovido
-- 2. Via atribuição manual pelo usuário no frontend
-- 3. Via workflow do n8n quando apropriado
-- ============================================================================
