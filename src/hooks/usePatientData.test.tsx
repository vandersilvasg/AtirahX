import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePatientData } from './usePatientData';

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

const mockState = vi.hoisted(() => {
  const from = vi.fn();
  return { from };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mockState.from,
  },
}));

function createTableQuery(result: QueryResult) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    then: (resolve: (value: QueryResult) => void) => Promise.resolve(resolve(result)),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockResolvedValue(result);
  query.single.mockResolvedValue(result);

  return query;
}

describe('usePatientData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the aggregated patient data from all related tables', async () => {
    const tableResults = {
      patients: createTableQuery({
        data: { id: 'patient-1', name: 'Ana', created_at: '2026-01-01', updated_at: '2026-01-02' },
        error: null,
      }),
      medical_records: createTableQuery({
        data: [{ id: 'record-1', patient_id: 'patient-1', doctor_id: 'doc-1', appointment_date: '2026-03-01', created_at: '2026-03-01', updated_at: '2026-03-01' }],
        error: null,
      }),
      anamnesis: createTableQuery({
        data: [{ id: 'anam-1', patient_id: 'patient-1', doctor_id: 'doc-1', created_at: '2026-03-02', updated_at: '2026-03-02' }],
        error: null,
      }),
      clinical_data: createTableQuery({
        data: [{ id: 'clinical-1', patient_id: 'patient-1', measurement_date: '2026-03-03', created_at: '2026-03-03', updated_at: '2026-03-03' }],
        error: null,
      }),
      exam_history: createTableQuery({
        data: [{ id: 'exam-1', patient_id: 'patient-1', exam_type: 'blood', exam_name: 'Hemograma', exam_date: '2026-03-04', created_at: '2026-03-04', updated_at: '2026-03-04' }],
        error: null,
      }),
      medical_attachments: createTableQuery({
        data: [{ id: 'attachment-1', patient_id: 'patient-1', file_name: 'laudo.pdf', file_path: '/laudo.pdf', created_at: '2026-03-05' }],
        error: null,
      }),
      agent_consultations: createTableQuery({
        data: [{ id: 'agent-1', patient_id: 'patient-1', doctor_id: 'doc-1', agent_type: 'exams', consultation_input: {}, consultation_output: {}, consultation_date: '2026-03-06', created_at: '2026-03-06' }],
        error: null,
      }),
      patient_doctors: createTableQuery({
        data: [{ id: 'rel-1', patient_id: 'patient-1', doctor_id: 'doc-1', doctor: { id: 'doc-1', name: 'Dr. Bruno' } }],
        error: null,
      }),
    };

    mockState.from.mockImplementation((table: keyof typeof tableResults) => {
      const query = tableResults[table];
      if (!query) {
        throw new Error(`Unexpected table ${table}`);
      }
      return query;
    });

    const { result } = renderHook(() => usePatientData('patient-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.patient?.name).toBe('Ana');
    expect(result.current.medicalRecords).toHaveLength(1);
    expect(result.current.anamnesis).toHaveLength(1);
    expect(result.current.clinicalData).toHaveLength(1);
    expect(result.current.examHistory).toHaveLength(1);
    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.agentExams).toHaveLength(1);
    expect(result.current.doctors).toHaveLength(1);
  });

  it('surfaces fetch errors and keeps the hook in a safe state', async () => {
    const patientQuery = createTableQuery({
      data: null,
      error: { message: 'patient fetch failed' },
    });

    mockState.from.mockImplementation((table: string) => {
      if (table !== 'patients') {
        throw new Error(`Unexpected table ${table}`);
      }
      return patientQuery;
    });

    const { result } = renderHook(() => usePatientData('patient-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erro ao carregar dados');
    expect(result.current.patient).toBeNull();
    expect(result.current.medicalRecords).toEqual([]);
  });

  it('resets to empty data when no patient id is provided', async () => {
    const { result } = renderHook(() => usePatientData(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.patient).toBeNull();
    expect(result.current.medicalRecords).toEqual([]);
    expect(mockState.from).not.toHaveBeenCalled();

    await act(async () => {
      result.current.refetch();
    });

    expect(mockState.from).not.toHaveBeenCalled();
  });
});
