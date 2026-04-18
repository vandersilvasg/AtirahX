import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useWhatsAppMessaging } from './useWhatsAppMessaging';

const webhookMocks = vi.hoisted(() => ({
  webhookRequest: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@/lib/webhookClient', () => ({
  webhookRequest: webhookMocks.webhookRequest,
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useWhatsAppMessaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends text messages and invalidates message/session queries', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    webhookMocks.webhookRequest.mockResolvedValue({});

    const { result } = renderHook(
      () =>
        useWhatsAppMessaging({
          patientPhone: '5511999999999',
          queryClient,
          selectedSessionId: 'session-1',
          userName: 'Vander',
        }),
      { wrapper: createWrapper(queryClient) }
    );

    act(() => {
      result.current.setMessageText('Ola paciente');
    });

    await act(async () => {
      await result.current.handleSendMessage('text');
    });

    expect(webhookMocks.webhookRequest).toHaveBeenCalledWith('/enviar-mensagem', {
      method: 'POST',
      body: {
        session_id: 'session-1',
        numero_paciente: '5511999999999',
        nome_login: 'Vander',
        funcao: 'text',
        texto: 'Ola paciente',
      },
    });
    expect(toastMocks.success).toHaveBeenCalledWith('Mensagem enviada com sucesso!');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['medx_messages', 'session-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['medx_sessions'] });
    expect(result.current.messageText).toBe('');
  });

  it('blocks sending when no text is provided', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { result } = renderHook(
      () =>
        useWhatsAppMessaging({
          patientPhone: '5511999999999',
          queryClient,
          selectedSessionId: 'session-1',
          userName: 'Vander',
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.handleSendMessage('text');
    });

    expect(webhookMocks.webhookRequest).not.toHaveBeenCalled();
    expect(toastMocks.error).toHaveBeenCalledWith('Digite uma mensagem antes de enviar');
  });
});
