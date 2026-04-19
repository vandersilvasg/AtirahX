import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, getSupabaseModule } from '@/lib/supabaseClientLoader';
import { useToast } from '@/hooks/use-toast';

export interface DoctorSummary {
  doctor_id: string;
  doctor_name: string;
  doctor_email: string;
  doctor_specialty: string | null;
  total_insurance_companies: number;
  total_insurance_plans: number;
  insurance_companies: string | null;
  insurance_plans_list: string | null;
}

export function useDoctorsInsurance() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadDoctorsData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = await getSupabaseClient();

      const { data, error } = await supabase
        .from('doctors_insurance_summary')
        .select('*')
        .order('doctor_name', { ascending: true });

      if (error) throw error;
      setDoctors((data || []) as DoctorSummary[]);
    } catch (error) {
      console.error('Erro ao carregar medicos:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel carregar os dados dos medicos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDoctorsData();

    let isActive = true;
    let cleanup = () => {};

    void (async () => {
      const { supabase } = await getSupabaseModule();
      if (!isActive) return;

      const channel = supabase
        .channel('doctors-insurance-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'doctors_insurance_summary',
          },
          () => {
            void loadDoctorsData();
          }
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
      };
    })();

    return () => {
      isActive = false;
      cleanup();
    };
  }, [loadDoctorsData]);

  const doctorsWithInsurance = useMemo(
    () => doctors.filter((doctor) => doctor.total_insurance_plans > 0),
    [doctors]
  );

  const filteredDoctors = useMemo(
    () =>
      doctorsWithInsurance.filter(
        (doctor) =>
          doctor.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.doctor_specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.insurance_companies?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [doctorsWithInsurance, searchTerm]
  );

  const totalDoctors = doctorsWithInsurance.length;
  const totalWithInsurance = doctorsWithInsurance.length;
  const averagePlans = useMemo(() => {
    const total = doctorsWithInsurance.reduce(
      (sum, doctor) => sum + doctor.total_insurance_plans,
      0
    );
    return doctorsWithInsurance.length > 0 ? (total / doctorsWithInsurance.length).toFixed(1) : '0';
  }, [doctorsWithInsurance]);

  return {
    averagePlans,
    filteredDoctors,
    hasAnyInsurance: totalWithInsurance > 0,
    loading,
    searchTerm,
    setSearchTerm,
    totalDoctors,
    totalWithInsurance,
  };
}
