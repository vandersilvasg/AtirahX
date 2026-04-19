-- Descrição: Adiciona coluna stage na tabela pre_patients com valor padrão 'pre'
-- Data: 2026-01-22
-- Autor: Sistema MedX

ALTER TABLE public.pre_patients
  ADD COLUMN IF NOT EXISTS stage TEXT;

UPDATE public.pre_patients
SET stage = 'pre'
WHERE stage IS NULL;

ALTER TABLE public.pre_patients
  ALTER COLUMN stage SET DEFAULT 'pre',
  ALTER COLUMN stage SET NOT NULL;
