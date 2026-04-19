import { useEffect, useMemo, useState } from 'react';
import { getDashboardErrorMessage } from '@/lib/dashboardMetrics';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';

type JobStatusCount = {
  status: string;
  total: number;
};

export const useAutomationInteligente = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobsByStatus, setJobsByStatus] = useState<JobStatusCount[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = await getSupabaseClient();

      const { data: jobs, error: jobsError } = await supabase
        .from('appointment_automation_jobs')
        .select('status');
      if (jobsError) throw jobsError;

      const grouped = new Map<string, number>();
      (jobs ?? []).forEach((job) => {
        const status = String(job.status ?? 'unknown');
        grouped.set(status, (grouped.get(status) ?? 0) + 1);
      });

      setJobsByStatus(
        [...grouped.entries()].map(([status, total]) => ({ status, total })).sort((a, b) =>
          a.status.localeCompare(b.status)
        )
      );
    } catch (err) {
      setError(getDashboardErrorMessage(err, 'Erro ao carregar automações inteligentes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const summary = useMemo(() => {
    const pending = jobsByStatus.find((job) => job.status === 'pending')?.total ?? 0;
    const processing = jobsByStatus.find((job) => job.status === 'processing')?.total ?? 0;
    const done = jobsByStatus.find((job) => job.status === 'done')?.total ?? 0;
    const failed = jobsByStatus.find((job) => job.status === 'failed')?.total ?? 0;
    return {
      pending,
      processing,
      done,
      failed,
      total: jobsByStatus.reduce((sum, job) => sum + job.total, 0),
    };
  }, [jobsByStatus]);

  return {
    loading,
    error,
    jobsByStatus,
    summary,
    refresh: fetchData,
  };
};
