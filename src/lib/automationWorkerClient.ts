import { getSupabaseClient } from '@/lib/supabaseClientLoader';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type RunAutomationWorkerPayload = {
  limit?: number;
  dryRun?: boolean;
  jobIds?: string[];
  onlyChannel?: 'whatsapp' | 'phone';
};

export type RunAutomationWorkerResult = {
  ok: boolean;
  processed: number;
  sent?: number;
  failed?: number;
  skipped?: number;
  jobs: Array<Record<string, unknown>>;
  dryRun?: boolean;
};

export async function runAutomationWorker(
  payload: RunAutomationWorkerPayload = {}
): Promise<RunAutomationWorkerResult> {
  const supabase = await getSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Sessao expirada. Faca login novamente para executar automacoes.');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/appointment-automation-worker`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsed: unknown = rawText;
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    parsed = { error: rawText };
  }

  if (!response.ok) {
    const errorMessage =
      parsed && typeof parsed === 'object' && 'error' in parsed
        ? String((parsed as Record<string, unknown>).error)
        : `Erro ao executar worker: HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return parsed as RunAutomationWorkerResult;
}
