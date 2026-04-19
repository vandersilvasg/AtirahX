-- Descrição: Cria tabela de lançamentos financeiros com RLS para dashboard financeiro
-- Data: 2026-04-18
-- Autor: Codex

BEGIN;

CREATE TABLE IF NOT EXISTS public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinic_info(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_type
  ON public.financial_entries(type);

CREATE INDEX IF NOT EXISTS idx_financial_entries_occurred_at
  ON public.financial_entries(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_entries_clinic
  ON public.financial_entries(clinic_id);

DROP TRIGGER IF EXISTS trg_financial_entries_updated_at ON public.financial_entries;
CREATE TRIGGER trg_financial_entries_updated_at
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff pode ver lancamentos financeiros" ON public.financial_entries;
CREATE POLICY "Staff pode ver lancamentos financeiros"
ON public.financial_entries
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff autorizado pode inserir lancamentos financeiros" ON public.financial_entries;
CREATE POLICY "Staff autorizado pode inserir lancamentos financeiros"
ON public.financial_entries
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'secretary')
  )
);

DROP POLICY IF EXISTS "Staff autorizado pode atualizar lancamentos financeiros" ON public.financial_entries;
CREATE POLICY "Staff autorizado pode atualizar lancamentos financeiros"
ON public.financial_entries
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'secretary')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role IN ('owner', 'secretary')
  )
);

DROP POLICY IF EXISTS "Apenas owner pode remover lancamentos financeiros" ON public.financial_entries;
CREATE POLICY "Apenas owner pode remover lancamentos financeiros"
ON public.financial_entries
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.auth_user_id
    FROM public.profiles p
    WHERE p.role = 'owner'
  )
);

COMMENT ON TABLE public.financial_entries IS 'Lancamentos financeiros manuais para consolidacao de entradas e saidas';
COMMENT ON COLUMN public.financial_entries.type IS 'Tipo do lancamento: income (entrada) ou expense (saida)';
COMMENT ON COLUMN public.financial_entries.amount IS 'Valor monetario do lancamento em BRL';
COMMENT ON COLUMN public.financial_entries.occurred_at IS 'Data de competencia do lancamento';

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_entries;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

COMMIT;
