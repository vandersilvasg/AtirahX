import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  analyzeConversationWithGemini,
  analyzeExamWithGemini,
  getFileInputAccept,
  getSupportedFileExtensions,
  isSupportedFileType,
} from './geminiAnalyzer';

const mocks = vi.hoisted(() => {
  const getSystemSetting = vi.fn();
  const invoke = vi.fn();

  return {
    getSystemSetting,
    invoke,
  };
});

vi.mock('@/hooks/useSystemSettings', () => ({
  getSystemSetting: mocks.getSystemSetting,
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
  },
}));

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  onerror: null | ((error: unknown) => void) = null;

  readAsDataURL(_file: File) {
    this.result = 'data:application/pdf;base64,ZmFrZS1iYXNlNjQ=';
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }
}

describe('geminiAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('FileReader', MockFileReader);
    mocks.getSystemSetting.mockResolvedValue('gemini-2.0');
  });

  it('validates supported file helpers', () => {
    expect(isSupportedFileType('application/pdf')).toBe(true);
    expect(isSupportedFileType('text/csv')).toBe(false);
    expect(getSupportedFileExtensions()).toBe('PDF, PNG, JPG, JPEG, WEBP');
    expect(getFileInputAccept()).toContain('application/pdf');
  });

  it('analyzes an exam through the secure proxy', async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        output: '## Analise Geral\nTudo certo.',
      },
      error: null,
    });

    const file = new File(['exam'], 'exam.pdf', { type: 'application/pdf' });
    const result = await analyzeExamWithGemini(file);

    expect(result).toEqual({
      output: '## Analise Geral\nTudo certo.',
    });
    expect(mocks.getSystemSetting).toHaveBeenCalledWith('gemini_model');
    expect(mocks.invoke).toHaveBeenCalledWith('gemini-analyzer', {
      body: expect.objectContaining({
        task: 'exam',
        preferredModel: 'gemini-2.0',
        inlineData: {
          mimeType: 'application/pdf',
          data: 'ZmFrZS1iYXNlNjQ=',
        },
      }),
    });
  });

  it('rejects unsupported exam files before calling the proxy', async () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });

    await expect(analyzeExamWithGemini(file)).rejects.toThrow('Tipo de arquivo');
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it('parses a conversation summary and merges real metrics', async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        output: JSON.stringify({
          resumo_conversa: 'Paciente pediu agendamento.',
          nota_atendimento: 5,
          status_atendimento: 'Fechado',
          topicos_identificados: ['Agendamento'],
          proximas_acoes: ['Confirmar horario'],
          flags: {
            urgente: false,
            insatisfacao: false,
            financeiro: false,
            agendamento: true,
            follow_up_necessario: true,
            escalacao_sugerida: false,
            documentacao_incompleta: false,
            risco_perda: false,
          },
        }),
      },
      error: null,
    });

    const messages = [
      {
        message: { type: 'human', content: 'Oi, quero agendar' },
        data_e_hora: new Date().toISOString(),
      },
      {
        message: { type: 'ai', content: 'Claro, qual horario?' },
        data_e_hora: new Date(Date.now() + 30_000).toISOString(),
      },
    ];

    const result = await analyzeConversationWithGemini('session-1', 'ultimos_7_dias', messages);

    expect(result.resumo_conversa).toBe('Paciente pediu agendamento.');
    expect(result.metricas.total_mensagens).toBe(2);
    expect(result.metricas.mensagens_ia).toBe(1);
    expect(result.metricas.mensagens_human).toBe(1);
    expect(result.metricas.tempo_medio_resposta).toBe('30s');
    expect(result.metricas.taxa_resposta).toBe('100%');
    expect(result.flags.agendamento).toBe(true);
  });

  it('fails when the proxy returns invalid conversation JSON', async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        output: 'not-json',
      },
      error: null,
    });

    const messages = [
      {
        message: { type: 'human', content: 'Oi' },
        data_e_hora: new Date().toISOString(),
      },
    ];

    await expect(
      analyzeConversationWithGemini('session-1', 'ultimos_7_dias', messages)
    ).rejects.toThrow(/JSON inv.lido/);
  });
});
