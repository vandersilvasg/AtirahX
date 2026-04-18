import { getSystemSetting } from '@/hooks/useSystemSettings';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';

/**
 * Interface para o resultado da análise do Gemini
 */
export interface GeminiExamAnalysis {
  output: string; // Conteúdo completo em Markdown
  analise?: string;
  valores_encontrados?: string[];
  valores_alterados?: string[];
  interpretacao?: string;
  recomendacoes?: string[];
  observacoes?: string;
}

/**
 * Tipos de arquivo suportados
 */
export type SupportedFileType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp';

/**
 * Mapeamento de tipos MIME para tipos do Gemini
 */
const MIME_TYPE_MAP: Record<string, string> = {
  'application/pdf': 'application/pdf',
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/webp': 'image/webp',
};

type GeminiProxyTask = 'exam' | 'conversation';

interface GeminiProxyRequest {
  task: GeminiProxyTask;
  prompt: string;
  preferredModel?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiProxyResponse {
  output: string;
  modelUsed?: string;
}

type ConversationContentPart = {
  text?: string;
};

type ConversationMessagePayload = {
  type?: string;
  content?: string | ConversationContentPart[] | unknown;
};

type ConversationMessage = {
  message: string | ConversationMessagePayload;
  data_e_hora?: string;
};

type ParsedConversationSummary = Partial<ConversationSummary> & Record<string, unknown>;

async function invokeGeminiProxy(request: GeminiProxyRequest): Promise<GeminiProxyResponse> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('gemini-analyzer', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Falha ao chamar serviço Gemini seguro');
  }

  if (!data || typeof data.output !== 'string' || data.output.trim() === '') {
    throw new Error('Resposta inválida do serviço Gemini');
  }

  return data as GeminiProxyResponse;
}

/**
 * Converte um arquivo para base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:mime/type;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Analisa um exame (PDF ou imagem) usando o Gemini Flash
 * 
 * @param file - Arquivo do exame (PDF ou imagem)
 * @returns Análise detalhada do exame
 * 
 * @example
 * const file = document.getElementById('input').files[0];
 * const analysis = await analyzeExamWithGemini(file);
 * console.log(analysis.output);
 */
export async function analyzeExamWithGemini(file: File): Promise<GeminiExamAnalysis> {
  try {
    // 1. Validar tipo de arquivo
    if (!MIME_TYPE_MAP[file.type]) {
      throw new Error(`Tipo de arquivo não suportado: ${file.type}. Suportados: PDF, PNG, JPEG, JPG, WEBP`);
    }

    // 2. Buscar configuração opcional de modelo preferido
    const preferredModel = await getSystemSetting('gemini_model');

    // 3. Converter arquivo para base64
    const base64Data = await fileToBase64(file);

    // 4. Preparar o prompt para análise de exames
    const prompt = `Você é um assistente médico especializado em análise de exames laboratoriais e de imagem.

Analise o documento/imagem fornecido e retorne uma análise detalhada em formato Markdown seguindo a estrutura abaixo:

## 📋 Análise Geral
[Faça um resumo geral do que foi identificado no exame]

## 🔬 Valores Encontrados
[Liste todos os valores/parâmetros encontrados com seus resultados]
- **Parâmetro**: Valor - Status: [Normal/Alterado] - Significado: [breve explicação]

## ⚠️ Valores Alterados
[Se houver valores fora da normalidade, liste-os aqui com ênfase]
- **Parâmetro Alterado**: Valor encontrado (Referência: X-Y) - ⚠️ [Explicação do significado clínico]

## 💡 Interpretação Clínica
[Forneça uma interpretação clínica dos resultados, considerando o conjunto dos achados]

## ✅ Recomendações
[Sugira ações, exames complementares ou observações importantes]
- [Recomendação 1]
- [Recomendação 2]

## 📝 Observações
[Observações adicionais importantes, limitações da análise, ou avisos]

**IMPORTANTE:**
- Use emojis para facilitar a visualização
- Destaque valores alterados com ⚠️
- Use **negrito** para termos importantes
- Seja claro e objetivo
- Se não conseguir identificar algum valor, mencione isso
- Esta análise é um auxílio, não substitui a avaliação médica completa

Analise agora o documento/imagem fornecido:`;

    // 5. Fazer requisição para Edge Function segura (sem expor API key no frontend)
    const geminiMimeType = MIME_TYPE_MAP[file.type];
    const response = await invokeGeminiProxy({
      task: 'exam',
      prompt,
      preferredModel: preferredModel || undefined,
      inlineData: {
        mimeType: geminiMimeType,
        data: base64Data,
      },
    });

    // 6. Extrair o texto da resposta
    const generatedText = response.output;

    if (!generatedText || generatedText.trim() === '') {
      throw new Error('O Gemini não conseguiu gerar uma análise para este arquivo');
    }

    // 7. Retornar análise no formato esperado
    const analysis: GeminiExamAnalysis = {
      output: generatedText,
    };

    return analysis;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Erro desconhecido ao analisar exame');
  }
}

/**
 * Valida se um tipo de arquivo é suportado
 */
export function isSupportedFileType(fileType: string): fileType is SupportedFileType {
  return fileType in MIME_TYPE_MAP;
}

/**
 * Obtém a lista de extensões suportadas para exibição ao usuário
 */
export function getSupportedFileExtensions(): string {
  return 'PDF, PNG, JPG, JPEG, WEBP';
}

/**
 * Obtém o accept para input de arquivo
 */
export function getFileInputAccept(): string {
  return 'application/pdf,image/png,image/jpeg,image/jpg,image/webp';
}

/**
 * Interface para o resultado da análise de conversa
 */
export interface ConversationSummary {
  resumo_conversa: string;
  nota_atendimento: number;
  status_atendimento: 'Aberto' | 'Fechado' | 'Pendente';
  metricas: {
    total_mensagens: number;
    mensagens_ia: number;
    mensagens_human: number;
    tempo_medio_resposta?: string;
    duracao_total?: string;
    taxa_resposta?: string;
  };
  qualidade: {
    clareza: number;
    empatia: number;
    eficiencia: number;
    completude: number;
    profissionalismo: number;
    cordialidade: number;
    objetividade: number;
    personalizacao: number;
  };
  sentimento: {
    paciente: 'Positivo' | 'Neutro' | 'Negativo';
    ia: 'Positivo' | 'Neutro' | 'Negativo';
    evolucao: string;
    score_satisfacao: number; // 0-10
  };
  topicos_identificados: string[];
  momentos_criticos: Array<{
    tipo: string;
    descricao: string;
    gravidade: 'Alta' | 'Média' | 'Baixa';
  }>;
  analise_detalhada: {
    pontos_fortes: string[];
    pontos_melhorar: string[];
    oportunidades: string[];
    riscos: string[];
  };
  comportamento_paciente: {
    engajamento: 'Alto' | 'Médio' | 'Baixo';
    clareza_demanda: 'Clara' | 'Moderada' | 'Confusa';
    urgencia_percebida: 'Alta' | 'Média' | 'Baixa';
    satisfacao_aparente: 'Satisfeito' | 'Neutro' | 'Insatisfeito';
  };
  compliance: {
    seguiu_protocolo: boolean;
    informacoes_coletadas: string[];
    informacoes_faltantes: string[];
    score_compliance: number; // 0-10
  };
  proximas_acoes: string[];
  pendencias: string[];
  recomendacoes_especificas: string[];
  flags: {
    urgente: boolean;
    insatisfacao: boolean;
    financeiro: boolean;
    agendamento: boolean;
    follow_up_necessario: boolean;
    escalacao_sugerida: boolean;
    documentacao_incompleta: boolean;
    risco_perda: boolean;
  };
  timeline: Array<{
    momento: string;
    evento: string;
    tipo: 'info' | 'warning' | 'success' | 'error';
  }>;
}

/**
 * Tipo de período para análise de conversa
 */
export type AnalysisPeriod = 'dia_atual' | 'ultimos_7_dias' | 'ultimos_15_dias' | 'ultimos_30_dias';

/**
 * Analisa uma conversa do WhatsApp usando o Gemini
 * 
 * @param sessionId - ID da sessão (patient/pre_patient ID)
 * @param period - Período de análise
 * @param messages - Array de mensagens da conversa
 * @returns Análise detalhada da conversa com métricas
 * 
 * @example
 * const summary = await analyzeConversationWithGemini(sessionId, 'dia_atual', messages);
 * console.log(summary.resumo_conversa);
 */
export async function analyzeConversationWithGemini(
  _sessionId: string,
  period: AnalysisPeriod,
  messages: ConversationMessage[]
): Promise<ConversationSummary> {
  try {
    // 1. Filtrar mensagens por período
    const filteredMessages = filterMessagesByPeriod(messages, period);

    if (filteredMessages.length === 0) {
      throw new Error('Nenhuma mensagem encontrada no período selecionado.');
    }

    // 2. Formatar mensagens para o prompt
    const conversationText = formatMessagesForAnalysis(filteredMessages);

    // 3. Calcular métricas básicas
    const metricas = calculateBasicMetrics(filteredMessages);

    // 4. Preparar o prompt para análise de conversa
    const prompt = `Você é um assistente avançado de análise de conversas médicas via WhatsApp. Realize uma análise PROFUNDA e DETALHADA.

Analise a conversa abaixo e retorne um JSON estruturado seguindo EXATAMENTE este formato:

{
  "resumo_conversa": "Resumo executivo completo da conversa",
  "nota_atendimento": 4.5,
  "status_atendimento": "Fechado",
  "qualidade": {
    "clareza": 5,
    "empatia": 4,
    "eficiencia": 4,
    "completude": 5,
    "profissionalismo": 5,
    "cordialidade": 5,
    "objetividade": 4,
    "personalizacao": 4
  },
  "sentimento": {
    "paciente": "Positivo",
    "ia": "Positivo",
    "evolucao": "Paciente iniciou neutro e terminou satisfeito",
    "score_satisfacao": 8
  },
  "topicos_identificados": [
    "Agendamento de consulta",
    "Dúvidas sobre procedimento",
    "Questões financeiras"
  ],
  "momentos_criticos": [
    {
      "tipo": "Insatisfação",
      "descricao": "Paciente demonstrou frustração com tempo de espera",
      "gravidade": "Média"
    }
  ],
  "analise_detalhada": {
    "pontos_fortes": [
      "Resposta rápida e objetiva",
      "Linguagem empática e acolhedora"
    ],
    "pontos_melhorar": [
      "Poderia ter antecipado a dúvida sobre valores",
      "Faltou oferecer alternativas de horário"
    ],
    "oportunidades": [
      "Oferecer agendamento online para próximas vezes",
      "Enviar material educativo sobre o procedimento"
    ],
    "riscos": [
      "Paciente pode desistir se não receber confirmação em 24h",
      "Competidores podem oferecer condições melhores"
    ]
  },
  "comportamento_paciente": {
    "engajamento": "Alto",
    "clareza_demanda": "Clara",
    "urgencia_percebida": "Média",
    "satisfacao_aparente": "Satisfeito"
  },
  "compliance": {
    "seguiu_protocolo": true,
    "informacoes_coletadas": [
      "Nome completo",
      "Telefone",
      "Preferência de horário"
    ],
    "informacoes_faltantes": [
      "Email",
      "Data de nascimento",
      "Convênio médico"
    ],
    "score_compliance": 7
  },
  "proximas_acoes": [
    "Confirmar agendamento em até 2 horas",
    "Enviar lembrete 24h antes da consulta"
  ],
  "pendencias": [
    "Aguardando confirmação de disponibilidade do médico",
    "Enviar orçamento detalhado"
  ],
  "recomendacoes_especificas": [
    "Implementar resposta automática para horários de atendimento",
    "Criar FAQ sobre procedimentos mais perguntados"
  ],
  "flags": {
    "urgente": false,
    "insatisfacao": false,
    "financeiro": true,
    "agendamento": true,
    "follow_up_necessario": true,
    "escalacao_sugerida": false,
    "documentacao_incompleta": true,
    "risco_perda": false
  },
  "timeline": [
    {
      "momento": "Início",
      "evento": "Paciente iniciou contato solicitando agendamento",
      "tipo": "info"
    },
    {
      "momento": "10:30",
      "evento": "IA respondeu com opções de horário",
      "tipo": "success"
    },
    {
      "momento": "10:45",
      "evento": "Paciente questionou valores - momento crítico",
      "tipo": "warning"
    }
  ]
}

**INSTRUÇÕES DETALHADAS:**

1. **QUALIDADE (1-5 cada):**
   - Clareza: Comunicação clara e objetiva?
   - Empatia: Demonstrou compreensão e cuidado?
   - Eficiência: Resolveu rapidamente sem enrolação?
   - Completude: Cobriu todos os pontos necessários?
   - Profissionalismo: Manteve tom adequado?
   - Cordialidade: Foi gentil e acolhedor?
   - Objetividade: Foi direto ao ponto quando necessário?
   - Personalização: Tratamento personalizado ou genérico?

2. **SENTIMENTO:**
   - Analise o tom emocional do paciente e da IA
   - score_satisfacao: 0-10 baseado na satisfação geral

3. **MOMENTOS CRÍTICOS:**
   - Identifique pontos de tensão, dúvidas críticas, reclamações
   - gravidade: "Alta", "Média" ou "Baixa"

4. **ANÁLISE SWOT SIMPLIFICADA:**
   - Pontos fortes: O que foi bem feito
   - Pontos a melhorar: O que poderia ser melhor
   - Oportunidades: Chances de upsell, fidelização
   - Riscos: O que pode dar errado se não for tratado

5. **COMPORTAMENTO DO PACIENTE:**
   - Engajamento: Participação ativa na conversa
   - Clareza demanda: Soube explicar o que queria
   - Urgência percebida: Quão urgente é para o paciente
   - Satisfação aparente: Como parece estar se sentindo

6. **COMPLIANCE (0-10):**
   - Seguiu protocolo de atendimento?
   - Coletou informações necessárias?
   - O que faltou coletar?

7. **TIMELINE:**
   - Principais marcos da conversa
   - Tipo: "info" (normal), "warning" (atenção), "success" (positivo), "error" (problema)

**CONVERSA A ANALISAR:**
Total de mensagens: ${metricas.total_mensagens}
Mensagens da IA: ${metricas.mensagens_ia}
Mensagens do usuário: ${metricas.mensagens_human}

${conversationText}

**IMPORTANTE:**
- Seja DETALHADO e ESPECÍFICO nas análises
- Use exemplos concretos da conversa
- Identifique padrões de comportamento
- Sugira melhorias ACIONÁVEIS
- Retorne APENAS o JSON válido, sem markdown, sem explicações adicionais.`;

    // 5. Fazer requisição para Edge Function segura (sem expor API key no frontend)
    const response = await invokeGeminiProxy({
      task: 'conversation',
      prompt,
    });

    // 6. Extrair o JSON da resposta
    let generatedText = response.output;

    if (!generatedText || generatedText.trim() === '') {
      throw new Error('O Gemini não conseguiu gerar uma análise para esta conversa');
    }

    // Limpar possíveis markdown do JSON
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // 7. Parsear o JSON
    let parsedResult: ParsedConversationSummary;
    try {
      parsedResult = JSON.parse(generatedText) as ParsedConversationSummary;
    } catch {
      throw new Error('Erro ao processar resposta da IA. JSON inválido.');
    }

    // 8. Montar resultado final com métricas reais
    const summary: ConversationSummary = {
      resumo_conversa: parsedResult.resumo_conversa || 'Resumo não disponível',
      nota_atendimento: Number(parsedResult.nota_atendimento) || 3,
      status_atendimento: parsedResult.status_atendimento || 'Aberto',
      metricas: {
        ...metricas,
        tempo_medio_resposta: calculateAverageResponseTime(filteredMessages),
        duracao_total: calculateTotalDuration(filteredMessages),
        taxa_resposta: calculateResponseRate(filteredMessages),
      },
      qualidade: parsedResult.qualidade || {
        clareza: 3,
        empatia: 3,
        eficiencia: 3,
        completude: 3,
        profissionalismo: 3,
        cordialidade: 3,
        objetividade: 3,
        personalizacao: 3,
      },
      sentimento: parsedResult.sentimento || {
        paciente: 'Neutro',
        ia: 'Positivo',
        evolucao: 'Não foi possível analisar',
        score_satisfacao: 5,
      },
      topicos_identificados: Array.isArray(parsedResult.topicos_identificados) ? parsedResult.topicos_identificados : [],
      momentos_criticos: Array.isArray(parsedResult.momentos_criticos) ? parsedResult.momentos_criticos : [],
      analise_detalhada: parsedResult.analise_detalhada || {
        pontos_fortes: [],
        pontos_melhorar: [],
        oportunidades: [],
        riscos: [],
      },
      comportamento_paciente: parsedResult.comportamento_paciente || {
        engajamento: 'Médio',
        clareza_demanda: 'Moderada',
        urgencia_percebida: 'Média',
        satisfacao_aparente: 'Neutro',
      },
      compliance: parsedResult.compliance || {
        seguiu_protocolo: true,
        informacoes_coletadas: [],
        informacoes_faltantes: [],
        score_compliance: 5,
      },
      proximas_acoes: Array.isArray(parsedResult.proximas_acoes) ? parsedResult.proximas_acoes : [],
      pendencias: Array.isArray(parsedResult.pendencias) ? parsedResult.pendencias : [],
      recomendacoes_especificas: Array.isArray(parsedResult.recomendacoes_especificas) ? parsedResult.recomendacoes_especificas : [],
      flags: parsedResult.flags || {
        urgente: false,
        insatisfacao: false,
        financeiro: false,
        agendamento: false,
        follow_up_necessario: false,
        escalacao_sugerida: false,
        documentacao_incompleta: false,
        risco_perda: false,
      },
      timeline: Array.isArray(parsedResult.timeline) ? parsedResult.timeline : [],
    };

    return summary;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Erro desconhecido ao analisar conversa');
  }
}

/**
 * Filtra mensagens por período
 */
function filterMessagesByPeriod(
  messages: ConversationMessage[],
  period: AnalysisPeriod
): ConversationMessage[] {
  const now = new Date();
  let cutoffDate: Date;

  switch (period) {
    case 'dia_atual':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case 'ultimos_7_dias':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'ultimos_15_dias':
      cutoffDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      break;
    case 'ultimos_30_dias':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffDate = new Date(0); // Todas as mensagens
  }

  return messages.filter((msg) => {
    if (!msg.data_e_hora) return true; // Incluir mensagens sem data
    const msgDate = new Date(msg.data_e_hora);
    return msgDate >= cutoffDate;
  });
}

/**
 * Formata mensagens para análise
 */
function formatMessagesForAnalysis(messages: ConversationMessage[]): string {
  return messages
    .map((msg, idx) => {
      const type = typeof msg.message === 'string' ? 'unknown' : msg.message?.type || 'unknown';
      const isAI = type.toLowerCase() === 'ai';
      const isHuman = type.toLowerCase() === 'human';
      
      let content = '';
      if (typeof msg.message === 'string') {
        content = msg.message;
      } else if (typeof msg.message?.content === 'string') {
        content = msg.message.content;
      } else if (Array.isArray(msg.message?.content)) {
        const first = msg.message.content.find(
          (contentPart): contentPart is string | ConversationContentPart =>
            typeof contentPart === 'string' ||
            (typeof contentPart === 'object' &&
              contentPart !== null &&
              typeof (contentPart as ConversationContentPart).text === 'string')
        );
        content = typeof first === 'string' ? first : (first?.text || '');
      } else {
        content = JSON.stringify(msg.message);
      }

      const timestamp = msg.data_e_hora ? new Date(msg.data_e_hora).toLocaleString('pt-BR') : 'Sem data';
      const sender = isAI ? '🤖 IA' : isHuman ? '👤 Paciente' : '❓ Sistema';
      
      return `[${idx + 1}] ${sender} (${timestamp}):\n${content}`;
    })
    .join('\n\n');
}

/**
 * Calcula métricas básicas
 */
function getMessageType(message: ConversationMessage['message']): string {
  if (typeof message === 'string') {
    return '';
  }

  return (message?.type || '').toLowerCase();
}

function calculateBasicMetrics(messages: ConversationMessage[]): {
  total_mensagens: number;
  mensagens_ia: number;
  mensagens_human: number;
} {
  const total = messages.length;
  let ia = 0;
  let human = 0;

  messages.forEach((msg) => {
    const type = getMessageType(msg.message);
    if (type === 'ai') ia++;
    else if (type === 'human') human++;
  });

  return {
    total_mensagens: total,
    mensagens_ia: ia,
    mensagens_human: human,
  };
}

/**
 * Calcula tempo médio de resposta (simplificado)
 */
function calculateAverageResponseTime(messages: ConversationMessage[]): string {
  const intervals: number[] = [];
  
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];
    
    if (prev.data_e_hora && curr.data_e_hora) {
      const prevType = getMessageType(prev.message);
      const currType = getMessageType(curr.message);
      
      // Calcular tempo entre mensagem do usuário e resposta da IA
      if (prevType === 'human' && currType === 'ai') {
        const prevDate = new Date(prev.data_e_hora);
        const currDate = new Date(curr.data_e_hora);
        const diff = currDate.getTime() - prevDate.getTime();
        
        if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
          intervals.push(diff);
        }
      }
    }
  }

  if (intervals.length === 0) return 'N/A';

  const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const avgSeconds = Math.floor(avgMs / 1000);
  
  if (avgSeconds < 60) return `${avgSeconds}s`;
  if (avgSeconds < 3600) return `${Math.floor(avgSeconds / 60)}min`;
  return `${Math.floor(avgSeconds / 3600)}h`;
}

/**
 * Calcula duração total da conversa
 */
function calculateTotalDuration(messages: ConversationMessage[]): string {
  if (messages.length < 2) return 'N/A';
  
  const sortedMessages = messages
    .filter(m => m.data_e_hora)
    .sort((a, b) => new Date(a.data_e_hora!).getTime() - new Date(b.data_e_hora!).getTime());
  
  if (sortedMessages.length < 2) return 'N/A';
  
  const first = new Date(sortedMessages[0].data_e_hora!);
  const last = new Date(sortedMessages[sortedMessages.length - 1].data_e_hora!);
  
  const diffMs = last.getTime() - first.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}min`;
  if (diffMinutes > 0) return `${diffMinutes}min`;
  return `${Math.floor(diffMs / 1000)}s`;
}

/**
 * Calcula taxa de resposta da IA
 */
function calculateResponseRate(messages: ConversationMessage[]): string {
  let humanMessages = 0;
  let iaResponses = 0;
  
  for (let i = 0; i < messages.length; i++) {
    const type = getMessageType(messages[i].message);
    if (type === 'human') {
      humanMessages++;
      // Verificar se há resposta da IA na próxima mensagem
      if (i + 1 < messages.length) {
        const nextType = getMessageType(messages[i + 1].message);
        if (nextType === 'ai') {
          iaResponses++;
        }
      }
    }
  }
  
  if (humanMessages === 0) return '0%';
  
  const rate = Math.floor((iaResponses / humanMessages) * 100);
  return `${rate}%`;
}


