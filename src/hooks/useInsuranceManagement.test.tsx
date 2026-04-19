import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInsuranceManagement } from './useInsuranceManagement';

type QueryResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

const mockState = vi.hoisted(() => {
  const toast = vi.fn();
  const getSupabaseClient = vi.fn();

  return {
    toast,
    getSupabaseClient,
    user: { id: 'doctor-1', role: 'doctor' as const },
    queries: {
      companies: { data: [], error: null } as QueryResult,
      plans: { data: [], error: null } as QueryResult,
      accepted: { data: [], error: null } as QueryResult,
      insert: { error: null } as { error: { code?: string; message?: string } | null },
      delete: { error: null } as { error: { code?: string; message?: string } | null },
    },
    acceptedDoctorFilter: [] as string[],
    insertedPayloads: [] as Array<Record<string, unknown>>,
    deletedPlanIds: [] as string[],
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockState.toast,
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockState.user,
  }),
}));

vi.mock('@/lib/supabaseClientLoader', () => ({
  getSupabaseClient: mockState.getSupabaseClient,
}));

function createAwaitableQuery(result: QueryResult) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column: string, value: unknown) => {
      if (column === 'doctor_id' && typeof value === 'string') {
        mockState.acceptedDoctorFilter.push(value);
      }
      return query;
    }),
    order: vi.fn(() => query),
    delete: vi.fn(() => query),
    insert: vi.fn((payload: Record<string, unknown>) => {
      mockState.insertedPayloads.push(payload);
      return Promise.resolve(mockState.queries.insert);
    }),
    then: (resolve: (value: QueryResult) => void) => Promise.resolve(resolve(result)),
  };

  return query;
}

function createDeleteQuery() {
  const result = mockState.queries.delete;
  const query = {
    delete: vi.fn(() => query),
    eq: vi.fn((column: string, value: unknown) => {
      if (column === 'insurance_plan_id' && typeof value === 'string') {
        mockState.deletedPlanIds.push(value);
      }
      return query;
    }),
    then: (resolve: (value: typeof result) => void) => Promise.resolve(resolve(result)),
  };

  return query;
}

function createAcceptedInsuranceTable(result: QueryResult) {
  return {
    select: vi.fn(() => createAwaitableQuery(result)),
    insert: vi.fn((payload: Record<string, unknown>) => {
      mockState.insertedPayloads.push(payload);
      return Promise.resolve(mockState.queries.insert);
    }),
    delete: vi.fn(() => createDeleteQuery()),
  };
}

describe('useInsuranceManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.user = { id: 'doctor-1', role: 'doctor' };
    mockState.acceptedDoctorFilter = [];
    mockState.insertedPayloads = [];
    mockState.deletedPlanIds = [];
    mockState.queries = {
      companies: {
        data: [
          {
            id: 'company-1',
            name: 'Unimed',
            short_name: 'UNI',
            market_share: 20,
            beneficiaries: 1000,
            headquarters: 'SP',
            is_active: true,
          },
        ],
        error: null,
      },
      plans: {
        data: [
          {
            id: 'plan-1',
            insurance_company_id: 'company-1',
            name: 'Basico',
            plan_type: 'Basico',
            coverage_type: 'regional',
            is_active: true,
          },
          {
            id: 'plan-2',
            insurance_company_id: 'company-1',
            name: 'Premium',
            plan_type: 'Premium',
            coverage_type: 'nacional',
            is_active: true,
          },
        ],
        error: null,
      },
      accepted: {
        data: [
          {
            id: 'accepted-1',
            insurance_plan_id: 'plan-2',
            doctor_id: 'doctor-1',
            is_active: true,
          },
        ],
        error: null,
      },
      insert: { error: null },
      delete: { error: null },
    };

    mockState.getSupabaseClient.mockResolvedValue({
      from: (table: string) => {
        if (table === 'insurance_companies') {
          return createAwaitableQuery(mockState.queries.companies);
        }
        if (table === 'insurance_plans') {
          return createAwaitableQuery(mockState.queries.plans);
        }
        if (table === 'clinic_accepted_insurances') {
          return createAcceptedInsuranceTable(mockState.queries.accepted);
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });
  });

  it('loads companies, plans and accepted plan ids for the authenticated doctor', async () => {
    const { result } = renderHook(() => useInsuranceManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.companies).toHaveLength(1);
    expect(result.current.companies[0]?.acceptedPlanIds).toEqual(['plan-2']);
    expect(result.current.totalAcceptedPlans).toBe(1);
    expect(result.current.acceptedCompaniesCount).toBe(1);
    expect(mockState.acceptedDoctorFilter).toContain('doctor-1');

    act(() => {
      result.current.setSearchTerm('uni');
    });

    expect(result.current.filteredCompanies).toHaveLength(1);
    expect(result.current.getPlanTypeBadgeColor('Basico')).toContain('bg-blue-500/10');
  });

  it('creates a new accepted plan and refreshes the list', async () => {
    const acceptedStates: QueryResult[] = [
      mockState.queries.accepted,
      {
        data: [
          {
            id: 'accepted-1',
            insurance_plan_id: 'plan-2',
            doctor_id: 'doctor-1',
            is_active: true,
          },
          {
            id: 'accepted-2',
            insurance_plan_id: 'plan-1',
            doctor_id: 'doctor-1',
            is_active: true,
          },
        ],
        error: null,
      },
    ];

    mockState.getSupabaseClient.mockResolvedValue({
      from: (table: string) => {
        if (table === 'insurance_companies') {
          return createAwaitableQuery(mockState.queries.companies);
        }
        if (table === 'insurance_plans') {
          return createAwaitableQuery(mockState.queries.plans);
        }
        if (table === 'clinic_accepted_insurances') {
          return {
            select: vi.fn(() =>
              createAwaitableQuery(acceptedStates.shift() ?? mockState.queries.accepted)
            ),
            insert: vi.fn((payload: Record<string, unknown>) => {
              mockState.insertedPayloads.push(payload);
              return Promise.resolve(mockState.queries.insert);
            }),
            delete: vi.fn(() => createDeleteQuery()),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });

    const { result } = renderHook(() => useInsuranceManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.togglePlanAcceptance('plan-1', false);
    });

    await waitFor(() => {
      expect(result.current.totalAcceptedPlans).toBe(2);
    });

    expect(mockState.insertedPayloads).toContainEqual({
      insurance_plan_id: 'plan-1',
      doctor_id: 'doctor-1',
      is_active: true,
    });
    expect(mockState.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Convenio adicionado' })
    );
  });

  it('surfaces permission errors when removal fails', async () => {
    mockState.queries.delete = {
      error: { code: '42501', message: 'permission denied' },
    };

    const { result } = renderHook(() => useInsuranceManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.togglePlanAcceptance('plan-2', true);
    });

    expect(mockState.deletedPlanIds).toContain('plan-2');
    expect(mockState.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Erro',
        description: 'Voce nao tem permissao para realizar esta acao.',
        variant: 'destructive',
      })
    );
  });
});
