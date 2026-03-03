const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type GeminiTask = 'exam' | 'conversation';

type GeminiRequest = {
  task: GeminiTask;
  prompt: string;
  preferredModel?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

const DEFAULT_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro-vision',
  'gemini-pro',
];

const ALLOWED_EXAM_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

function parseModelListFromEnv(): string[] {
  const raw = Deno.env.get('GEMINI_MODEL_LIST');
  if (!raw) return DEFAULT_MODELS;

  const models = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return models.length > 0 ? models : DEFAULT_MODELS;
}

function buildModelOrder(preferredModel?: string): string[] {
  const base = parseModelListFromEnv();
  if (!preferredModel) return base;

  const normalizedPreferred = preferredModel.trim();
  if (!normalizedPreferred) return base;

  if (base.includes(normalizedPreferred)) {
    return [normalizedPreferred, ...base.filter((model) => model !== normalizedPreferred)];
  }

  return [normalizedPreferred, ...base];
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const candidates = (payload as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';

  const firstCandidate = candidates[0];
  if (!firstCandidate || typeof firstCandidate !== 'object') return '';

  const content = (firstCandidate as Record<string, unknown>).content;
  if (!content || typeof content !== 'object') return '';

  const parts = (content as Record<string, unknown>).parts;
  if (!Array.isArray(parts) || parts.length === 0) return '';

  return parts
    .map((part) => (part && typeof part === 'object' ? (part as Record<string, unknown>).text : ''))
    .filter((text): text is string => typeof text === 'string')
    .join('')
    .trim();
}

function buildGeminiRequestBody(payload: GeminiRequest) {
  const parts: Array<Record<string, unknown>> = [{ text: payload.prompt }];

  if (payload.task === 'exam' && payload.inlineData) {
    parts.push({
      inline_data: {
        mime_type: payload.inlineData.mimeType,
        data: payload.inlineData.data,
      },
    });
  }

  return {
    contents: [{ parts }],
    generationConfig:
      payload.task === 'conversation'
        ? {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        : {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          },
  };
}

async function callGeminiWithFallback(payload: GeminiRequest, apiKey: string): Promise<{ output: string; modelUsed: string }> {
  const modelsToTry = buildModelOrder(payload.preferredModel);
  let lastError = 'Nenhum modelo do Gemini respondeu com sucesso.';

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildGeminiRequestBody(payload)),
      });

      if (response.status === 404) {
        continue;
      }

      const rawText = await response.text();
      const parsedBody = safeParseJson(rawText);

      if (!response.ok) {
        const message =
          parsedBody && typeof parsedBody === 'object'
            ? JSON.stringify(parsedBody)
            : rawText || `HTTP ${response.status}`;
        lastError = `Modelo ${model} falhou: ${message}`;
        continue;
      }

      const output = extractGeminiText(parsedBody);
      if (!output) {
        lastError = `Modelo ${model} retornou payload sem texto.`;
        continue;
      }

      return { output, modelUsed: model };
    } catch (error) {
      lastError = `Erro de rede ao usar modelo ${model}: ${
        error instanceof Error ? error.message : 'erro desconhecido'
      }`;
    }
  }

  throw new Error(lastError);
}

function validatePayload(raw: unknown): GeminiRequest {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Payload invÃ¡lido.');
  }

  const payload = raw as Record<string, unknown>;
  const task = payload.task;
  const prompt = payload.prompt;
  const preferredModel = payload.preferredModel;
  const inlineData = payload.inlineData;

  if (task !== 'exam' && task !== 'conversation') {
    throw new Error('Campo "task" invÃ¡lido. Use "exam" ou "conversation".');
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Campo "prompt" Ã© obrigatÃ³rio.');
  }

  if (task === 'exam') {
    if (!inlineData || typeof inlineData !== 'object') {
      throw new Error('Campo "inlineData" Ã© obrigatÃ³rio para task "exam".');
    }

    const typedInlineData = inlineData as Record<string, unknown>;
    const mimeType = typedInlineData.mimeType;
    const data = typedInlineData.data;

    if (typeof mimeType !== 'string' || !ALLOWED_EXAM_MIME_TYPES.has(mimeType)) {
      throw new Error('Tipo MIME nÃ£o suportado para anÃ¡lise de exame.');
    }

    if (typeof data !== 'string' || data.trim().length === 0) {
      throw new Error('Arquivo base64 invÃ¡lido para anÃ¡lise de exame.');
    }
  }

  return {
    task,
    prompt: prompt.trim(),
    preferredModel: typeof preferredModel === 'string' ? preferredModel : undefined,
    inlineData:
      task === 'exam' && inlineData && typeof inlineData === 'object'
        ? {
            mimeType: (inlineData as Record<string, unknown>).mimeType as string,
            data: (inlineData as Record<string, unknown>).data as string,
          }
        : undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'MÃ©todo nÃ£o permitido.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY nÃ£o configurada na Edge Function.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = validatePayload(await req.json());
    const result = await callGeminiWithFallback(payload, apiKey);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro interno ao processar anÃ¡lise Gemini.',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
