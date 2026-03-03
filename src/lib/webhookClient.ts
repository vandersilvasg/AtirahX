import { getApiBaseUrl, getApiTimeout } from '@/lib/apiConfig';
import { supabase } from '@/lib/supabaseClient';

type WebhookRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

// URL do Supabase para chamar a função diretamente via fetch
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const buildApiUrl = (baseUrl: string, endpoint: string) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
};

const isNetworkError = (error: unknown) => {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    return /Failed to fetch|NetworkError|fetch failed|CORS/i.test(error.message);
  }
  return false;
};

const shouldUseProxy = (url: string) => {
  return typeof window !== 'undefined' && url.includes('webhook.atirahdigital.com.br');
};

const parseResponse = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Chama o proxy via fetch direto (sem supabase.functions.invoke)
async function callProxyDirect(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body: unknown
): Promise<unknown> {
  const proxyUrl = `${SUPABASE_URL}/functions/v1/webhook-proxy`;
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente para usar integrações.');
  }
  
  const payload = {
    url: targetUrl,
    method,
    headers,
    body: body ?? null,
  };
  
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[webhookClient] Erro no proxy:', response.status, errorText);
    throw new Error(`Erro no proxy: HTTP ${response.status}`);
  }

  const data = await response.json();
  
  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.data ?? data;
}

export async function webhookRequest<T>(
  endpoint: string,
  options: WebhookRequestOptions = {}
): Promise<T> {
  const apiBaseUrl = await getApiBaseUrl();
  const timeout = await getApiTimeout();
  const url = buildApiUrl(apiBaseUrl, endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Se for URL do webhook.atirahdigital, usar proxy diretamente
  if (shouldUseProxy(url)) {
    return (await callProxyDirect(
      url,
      options.method ?? 'POST',
      headers,
      options.body
    )) as T;
  }

  // Para outras URLs, tenta direto primeiro
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await parseResponse(response);
      throw new Error(
        typeof errorBody === 'string'
          ? `HTTP ${response.status}: ${errorBody}`
          : `HTTP ${response.status}`
      );
    }

    return (await parseResponse(response)) as T;
  } catch (error) {
    // Se for erro de rede/CORS, tenta via proxy
    if (isNetworkError(error)) {
      return (await callProxyDirect(
        url,
        options.method ?? 'POST',
        headers,
        options.body
      )) as T;
    }
    throw error;
  }
}

