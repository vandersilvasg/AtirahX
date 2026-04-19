import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePatientTimeline } from './usePatientTimeline';

type QueryResult = {
  data: unknown;
  error?: { message: string } | null;
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
  };

  query.select.mockReturnValue(query);
  query.eq.mockResolvedValue(result);

  return query;
}

describe('usePatientTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a sorted patient timeline from multiple sources', async () => {
    const tableResults = {
      medical_records: createTableQuery({
        data: [{ id: 'record-1', appointment_date: '2026-03-01', chief_complaint: 'Dor', doctor: { name: 'Dr. A' } }],
      }),
      appointments: createTableQuery({
        data: [{ id: 'appt-1', appointment_date: '2026-03-06', status: 'confirmada', type: 'Retorno', notes: 'Trazer exames', doctor: { name: 'Dr. B' } }],
      }),
      anamnesis: createTableQuery({
        data: [{ id: 'anam-1', created_at: '2026-03-02', chief_complaint: 'Febre', doctor: { name: 'Dr. A' } }],
      }),
      clinical_data: createTableQuery({
        data: [{ id: 'clinical-1', measurement_date: '2026-03-03', weight_kg: 70, height_cm: 175, blood_pressure_systolic: 12, blood_pressure_diastolic: 8 }],
      }),
      exam_history: createTableQuery({
        data: [{ id: 'exam-1', exam_date: '2026-03-04', exam_name: 'Hemograma', exam_type: 'sangue', result_summary: 'Normal' }],
      }),
      medical_attachments: createTableQuery({
        data: [{ id: 'attachment-1', created_at: '2026-03-05', file_name: 'resultado.pdf', description: 'Resultado anexado' }],
      }),
      agent_consultations: createTableQuery({
        data: [{ id: 'agent-1', consultation_date: '2026-03-07', agent_type: 'cid', cid_code: 'A00', cid_description: 'Teste CID', confidence_level: 'alta', doctor: { name: 'Dr. C' } }],
      }),
    };

    mockState.from.mockImplementation((table: keyof typeof tableResults) => {
      const query = tableResults[table];
      if (!query) {
        throw new Error(`Unexpected table ${table}`);
      }
      return query;
    });

    const { result } = renderHook(() => usePatientTimeline('patient-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.events).toHaveLength(7);
    expect(result.current.events[0]).toMatchObject({
      id: 'agent-1',
      type: 'agent_consultation',
      title: 'CID: A00',
    });
    expect(result.current.events[1]).toMatchObject({
      id: 'appt-1',
      type: 'appointment',
      title: 'Retorno',
    });
  });

  it('returns a safe error when one of the timeline fetches rejects', async () => {
    const medicalRecordsQuery = {
      select: vi.fn(),
      eq: vi.fn(),
    };
    medicalRecordsQuery.select.mockReturnValue(medicalRecordsQuery);
    medicalRecordsQuery.eq.mockRejectedValue(new Error('timeline failed'));

    mockState.from.mockImplementation((table: string) => {
      if (table !== 'medical_records') {
        throw new Error(`Unexpected table ${table}`);
      }
      return medicalRecordsQuery;
    });

    const { result } = renderHook(() => usePatientTimeline('patient-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('timeline failed');
    expect(result.current.events).toEqual([]);
  });
});
