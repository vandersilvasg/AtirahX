import { useEffect, useState } from 'react';
import {
  getDashboardDateRanges,
  getDashboardErrorMessage,
  isMissingColumnError,
} from '@/lib/dashboardMetrics';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';

type FinancialEntryType = 'income' | 'expense';

export type FinancialEntry = {
  id: string;
  type: FinancialEntryType;
  category: string;
  amount: number;
  description: string | null;
  occurred_at: string;
  created_at: string;
};

type AppointmentRow = {
  doctor_id: string | null;
  status: string | null;
  journey_stage: string | null;
  scheduled_at: string | null;
  appointment_date: string | null;
};

type DoctorPriceRow = {
  id: string;
  consultation_price: number | null;
};

type FinancialEntryRow = {
  id: string;
  type: FinancialEntryType;
  category: string;
  amount: number;
  description: string | null;
  occurred_at: string;
  created_at: string;
};

type FinancialSummary = {
  projectedRevenue: number;
  realizedIncome: number;
  manualIncome: number;
  manualExpense: number;
  totalIncome: number;
  balance: number;
  entries: FinancialEntry[];
};

type FinancialState = FinancialSummary & {
  loading: boolean;
  submitting: boolean;
  error: string | null;
};

type CreateFinancialEntryInput = {
  type: FinancialEntryType;
  category: string;
  amount: number;
  description?: string;
  occurredAt?: string;
};

const EMPTY_FINANCIAL_STATE: FinancialSummary = {
  projectedRevenue: 0,
  realizedIncome: 0,
  manualIncome: 0,
  manualExpense: 0,
  totalIncome: 0,
  balance: 0,
  entries: [],
};

const COMPLETED_STATUSES = new Set(['completed']);
const PENDING_STATUSES = new Set(['scheduled', 'confirmed', 'pending']);

const toIsoWithTime = (dateInput?: string) => {
  if (!dateInput) return undefined;
  return `${dateInput}T00:00:00.000Z`;
};

const getSupabaseErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return getDashboardErrorMessage(error, 'Erro ao carregar dados financeiros.');
};

const isMissingFinancialEntriesTable = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const code =
    'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
  const message = getSupabaseErrorMessage(error).toLowerCase();
  return code === '42P01' || message.includes('financial_entries');
};

export const useFinancialDashboardMetrics = () => {
  const [state, setState] = useState<FinancialState>({
    ...EMPTY_FINANCIAL_STATE,
    loading: true,
    submitting: false,
    error: null,
  });

  const fetchMetrics = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const supabase = await getSupabaseClient();
      const { startCurrentMonthIso, startNextMonthIso } = getDashboardDateRanges();
      const nowIso = new Date().toISOString();

      const [appointmentsResult, doctorsResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('doctor_id, status, journey_stage, scheduled_at, appointment_date')
          .gte('scheduled_at', startCurrentMonthIso)
          .lt('scheduled_at', startNextMonthIso),
        supabase.from('profiles').select('id, consultation_price').eq('role', 'doctor'),
      ]);

      if (appointmentsResult.error) throw appointmentsResult.error;

      const appointments = (appointmentsResult.data ?? []) as AppointmentRow[];
      let doctorPrices = (doctorsResult.data ?? []) as DoctorPriceRow[];
      if (doctorsResult.error) {
        if (isMissingColumnError(doctorsResult.error, 'consultation_price')) {
          const fallbackDoctors = await supabase.from('profiles').select('id').eq('role', 'doctor');
          if (fallbackDoctors.error) throw fallbackDoctors.error;
          doctorPrices = ((fallbackDoctors.data ?? []) as Array<{ id: string }>).map((doctor) => ({
            id: doctor.id,
            consultation_price: 0,
          }));
        } else {
          throw doctorsResult.error;
        }
      }
      const entriesResult = await supabase
        .from('financial_entries')
        .select('id, type, category, amount, description, occurred_at, created_at')
        .gte('occurred_at', startCurrentMonthIso)
        .lt('occurred_at', startNextMonthIso)
        .order('occurred_at', { ascending: false })
        .limit(10);

      const entriesError = entriesResult.error;
      const entries: FinancialEntryRow[] = entriesError ? [] : (entriesResult.data ?? []);

      const doctorPriceMap = new Map(
        doctorPrices.map((doctor) => [doctor.id, Number(doctor.consultation_price ?? 0)])
      );

      const projectedRevenue = appointments.reduce((sum, appointment) => {
        const referenceDate = appointment.scheduled_at ?? appointment.appointment_date;
        if (!referenceDate) return sum;
        if (referenceDate < nowIso) return sum;
        if (appointment.journey_stage === 'cancelado' || appointment.journey_stage === 'finalizado') {
          return sum;
        }
        if (appointment.status && !PENDING_STATUSES.has(appointment.status)) return sum;
        const price = appointment.doctor_id ? doctorPriceMap.get(appointment.doctor_id) ?? 0 : 0;
        return sum + price;
      }, 0);

      const realizedIncome = appointments.reduce((sum, appointment) => {
        const isFinalizedJourney = appointment.journey_stage === 'finalizado';
        const isCompletedStatus = appointment.status ? COMPLETED_STATUSES.has(appointment.status) : false;
        if (!isFinalizedJourney && !isCompletedStatus) return sum;
        const price = appointment.doctor_id ? doctorPriceMap.get(appointment.doctor_id) ?? 0 : 0;
        return sum + price;
      }, 0);

      const manualIncome = entries
        .filter((entry) => entry.type === 'income')
        .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
      const manualExpense = entries
        .filter((entry) => entry.type === 'expense')
        .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);

      const totalIncome = realizedIncome + manualIncome;
      const balance = totalIncome - manualExpense;

      setState({
        projectedRevenue,
        realizedIncome,
        manualIncome,
        manualExpense,
        totalIncome,
        balance,
        entries,
        loading: false,
        submitting: false,
        error:
          entriesError && isMissingFinancialEntriesTable(entriesError)
            ? 'A tabela financeira ainda nao existe no banco. Execute a migration 60 para habilitar entradas e saidas.'
            : entriesError
              ? getSupabaseErrorMessage(entriesError)
              : null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: getSupabaseErrorMessage(error),
      }));
    }
  };

  useEffect(() => {
    void fetchMetrics();
  }, []);

  const createEntry = async (payload: CreateFinancialEntryInput) => {
    try {
      setState((prev) => ({ ...prev, submitting: true, error: null }));
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from('financial_entries').insert({
        type: payload.type,
        category: payload.category,
        amount: Number(payload.amount),
        description: payload.description?.trim() || null,
        occurred_at: toIsoWithTime(payload.occurredAt),
      });

      if (error) throw error;
      await fetchMetrics();
      return { ok: true as const };
    } catch (error) {
      const message = isMissingFinancialEntriesTable(error)
        ? 'Nao foi possivel salvar: a tabela financeira ainda nao existe no banco. Execute a migration 60.'
        : getSupabaseErrorMessage(error);
      setState((prev) => ({
        ...prev,
        submitting: false,
        error: message,
      }));
      return { ok: false as const, error: message };
    }
  };

  return {
    ...state,
    createEntry,
    refresh: fetchMetrics,
  };
};
