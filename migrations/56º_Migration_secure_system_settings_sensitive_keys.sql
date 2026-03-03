-- Descrição: Protege chaves sensíveis em system_settings e restringe edição para owners
-- Data: 2026-03-03
-- Autor: Sistema MedX

-- Remove política antiga de leitura ampla
DROP POLICY IF EXISTS "Permitir leitura de configurações ativas" ON public.system_settings;
DROP POLICY IF EXISTS "Permitir leitura segura de configuracoes ativas" ON public.system_settings;

-- Permite apenas leitura de configurações ativas não sensíveis
CREATE POLICY "Permitir leitura segura de configuracoes ativas"
ON public.system_settings
FOR SELECT
USING (
  is_active = true
  AND key NOT IN ('gemini_api_key', 'openai_api_key', 'assemblyai_api_key')
);

-- Remove política antiga que permitia qualquer autenticado modificar configurações
DROP POLICY IF EXISTS "Apenas autenticados podem modificar configurações" ON public.system_settings;
DROP POLICY IF EXISTS "Apenas owner pode modificar configuracoes" ON public.system_settings;

-- Apenas owner pode criar/atualizar/deletar configurações
CREATE POLICY "Apenas owner pode modificar configuracoes"
ON public.system_settings
FOR ALL
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role = 'owner'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role = 'owner'
  )
);

-- Chave do Gemini não deve ficar ativa no frontend após migração para Edge Function
UPDATE public.system_settings
SET is_active = false
WHERE key = 'gemini_api_key';
