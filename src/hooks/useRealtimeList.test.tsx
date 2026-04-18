import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRealtimeList } from './useRealtimeList';

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
  const order = vi.fn();
  const limit = vi.fn();
  const subscribe = vi.fn();
  const on = vi.fn();
  const channel = vi.fn();
  const removeChannel = vi.fn();
  const from = vi.fn();

  return {
    select,
    eq,
    order,
    limit,
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
    order: mockState.order,
    limit: mockState.limit,
    then: (resolve: (value: QueryResult) => void) => Promise.resolve(resolve(result)),
  };

  mockState.eq.mockReturnValue(thenable);
  mockState.order.mockImplementation(() => thenable);
  mockState.limit.mockImplementation(() => thenable);
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
    return { id: 'channel-1' };
  });

  mockState.channel.mockReturnValue({
    on: mockState.on,
  });
}

describe('useRealtimeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.realtimeCallback = null;
    buildChannel();
  });

  it('loads the initial list with filters and count', async () => {
    const filters = [{ column: 'active', operator: 'eq', value: true }];

    buildQuery({
      data: [
        { id: 1, active: true, name: 'Ana' },
        { id: 2, active: true, name: 'Bruno' },
      ],
      error: null,
    });

    const { result } = renderHook(() =>
      useRealtimeList<{ id: number; active: boolean; name: string }>({
        table: 'profiles',
        filters,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.count).toBe(2);
    expect(mockState.eq).toHaveBeenCalledWith('active', true);
  });

  it('applies realtime insert, update and delete respecting filters', async () => {
    const filters = [{ column: 'active', operator: 'eq', value: true }];
    const order = { column: 'id', ascending: true };

    buildQuery({
      data: [{ id: 1, active: true, name: 'Ana' }],
      error: null,
    });

    const { result } = renderHook(() =>
      useRealtimeList<{ id: number; active: boolean; name: string }>({
        table: 'profiles',
        order,
        filters,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      mockState.realtimeCallback?.({
        eventType: 'INSERT',
        new: { id: 2, active: true, name: 'Bruno' },
        old: {},
      });
      mockState.realtimeCallback?.({
        eventType: 'UPDATE',
        new: { id: 1, active: false, name: 'Ana' },
        old: { id: 1, active: true, name: 'Ana' },
      });
      mockState.realtimeCallback?.({
        eventType: 'DELETE',
        new: {},
        old: { id: 2, active: true, name: 'Bruno' },
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});
