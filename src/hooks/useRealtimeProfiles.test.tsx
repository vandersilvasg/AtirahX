import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRealtimeProfiles } from './useRealtimeProfiles';

type QueryResult = {
  data: Array<Record<string, unknown>>;
  error: { message: string } | null;
};

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

const mockState = vi.hoisted(() => {
  const select = vi.fn();
  const eq = vi.fn();
  const neq = vi.fn();
  const inFilter = vi.fn();
  const order = vi.fn();
  const subscribe = vi.fn();
  const on = vi.fn();
  const channel = vi.fn();
  const removeChannel = vi.fn();
  const from = vi.fn();

  return {
    select,
    eq,
    neq,
    inFilter,
    order,
    subscribe,
    on,
    channel,
    removeChannel,
    from,
    realtimeCallback: null as ((payload: RealtimePayload) => void) | null,
  };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mockState.from,
    channel: mockState.channel,
    removeChannel: mockState.removeChannel,
  },
}));

function buildQuery(result: QueryResult) {
  const thenable = {
    eq: mockState.eq,
    neq: mockState.neq,
    in: mockState.inFilter,
    order: mockState.order,
    then: (resolve: (value: QueryResult) => void) => Promise.resolve(resolve(result)),
  };

  mockState.eq.mockImplementation(() => thenable);
  mockState.neq.mockImplementation(() => thenable);
  mockState.inFilter.mockImplementation(() => thenable);
  mockState.order.mockImplementation(() => thenable);
  mockState.select.mockReturnValue(thenable);
  mockState.from.mockReturnValue({
    select: mockState.select,
  });
}

function buildChannel() {
  mockState.on.mockImplementation((_type, _config, callback) => {
    mockState.realtimeCallback = callback;
    return {
      subscribe: mockState.subscribe,
    };
  });

  mockState.subscribe.mockImplementation((statusCallback?: (status: string) => void) => {
    statusCallback?.('SUBSCRIBED');
    return { id: 'profiles-channel' };
  });

  mockState.channel.mockReturnValue({
    on: mockState.on,
  });
}

describe('useRealtimeProfiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.realtimeCallback = null;
    buildChannel();
  });

  it('loads profiles using the filter syntax from options', async () => {
    buildQuery({
      data: [
        { id: '1', auth_user_id: 'auth-1', name: 'Ana', role: 'doctor' },
      ],
      error: null,
    });

    const { result } = renderHook(() =>
      useRealtimeProfiles([], {
        channelName: 'profiles:doctors',
        filter: 'role.eq.doctor',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(1);
    expect(mockState.eq).toHaveBeenCalledWith('role', 'doctor');
  });

  it('updates the collection from realtime events and supports refetch', async () => {
    buildQuery({
      data: [{ id: '1', auth_user_id: 'auth-1', name: 'Ana', role: 'doctor' }],
      error: null,
    });

    const { result } = renderHook(() =>
      useRealtimeProfiles([], {
        channelName: 'profiles:all',
      })
    );

    await waitFor(() => {
      expect(result.current.count).toBe(1);
    });

    act(() => {
      mockState.realtimeCallback?.({
        eventType: 'INSERT',
        new: { id: '2', auth_user_id: 'auth-2', name: 'Bruno', role: 'secretary' },
        old: {},
      });
    });

    expect(result.current.count).toBe(2);

    buildQuery({
      data: [{ id: '3', auth_user_id: 'auth-3', name: 'Carla', role: 'owner' }],
      error: null,
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.profiles).toEqual([
      { id: '3', auth_user_id: 'auth-3', name: 'Carla', role: 'owner' },
    ]);
  });
});
