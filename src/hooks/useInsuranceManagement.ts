import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface InsuranceCompany {
  id: string;
  name: string;
  short_name: string;
  market_share: number;
  beneficiaries: number;
  headquarters: string;
  is_active: boolean;
}

export interface InsurancePlan {
  id: string;
  insurance_company_id: string;
  name: string;
  plan_type: string;
  coverage_type: string;
  is_active: boolean;
}

export interface AcceptedInsurance {
  id: string;
  insurance_plan_id: string;
  doctor_id: string;
  is_active: boolean;
}

export interface CompanyWithPlans extends InsuranceCompany {
  plans: InsurancePlan[];
  acceptedPlanIds: string[];
}

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as SupabaseErrorLike).message || fallback;
  }

  return fallback;
}

export function useInsuranceManagement() {
  const [companies, setCompanies] = useState<CompanyWithPlans[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const loadInsuranceData = useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        setLoading(false);
        return;
      }

      const supabase = await getSupabaseClient();

      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)
        .order('market_share', { ascending: false });

      if (companiesError) throw companiesError;

      const { data: plansData, error: plansError } = await supabase
        .from('insurance_plans')
        .select('*')
        .eq('is_active', true)
        .order('plan_type', { ascending: true });

      if (plansError) throw plansError;

      let acceptedQuery = supabase
        .from('clinic_accepted_insurances')
        .select('*')
        .eq('is_active', true);

      if (user.role === 'doctor') {
        acceptedQuery = acceptedQuery.eq('doctor_id', user.id);
      }

      const { data: acceptedData, error: acceptedError } = await acceptedQuery;
      if (acceptedError) throw acceptedError;

      const companiesWithPlans: CompanyWithPlans[] = (companiesData || []).map((company) => ({
        ...(company as InsuranceCompany),
        plans: ((plansData || []) as InsurancePlan[]).filter(
          (plan) => plan.insurance_company_id === company.id
        ),
        acceptedPlanIds: ((acceptedData || []) as AcceptedInsurance[])
          .filter((accepted) =>
            ((plansData || []) as InsurancePlan[]).some(
              (plan) =>
                plan.id === accepted.insurance_plan_id &&
                plan.insurance_company_id === company.id
            )
          )
          .map((accepted) => accepted.insurance_plan_id),
      }));

      setCompanies(companiesWithPlans);
    } catch (error) {
      console.error('Erro ao carregar convenios:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel carregar os convenios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user?.id) {
      void loadInsuranceData();
    }
  }, [loadInsuranceData, user?.id]);

  const togglePlanAcceptance = async (planId: string, currentlyAccepted: boolean) => {
    try {
      setSaving(true);

      if (!user?.id) {
        toast({
          title: 'Erro',
          description: 'Usuario nao autenticado.',
          variant: 'destructive',
        });
        return;
      }

      const supabase = await getSupabaseClient();

      if (currentlyAccepted) {
        const { error } = await supabase
          .from('clinic_accepted_insurances')
          .delete()
          .eq('insurance_plan_id', planId)
          .eq('doctor_id', user.id);

        if (error) throw error;

        toast({
          title: 'Convenio removido',
          description: 'O plano foi removido dos seus convenios aceitos.',
        });
      } else {
        const { error } = await supabase.from('clinic_accepted_insurances').insert({
          insurance_plan_id: planId,
          doctor_id: user.id,
          is_active: true,
        });

        if (error) throw error;

        toast({
          title: 'Convenio adicionado',
          description: 'O plano foi adicionado aos seus convenios aceitos.',
        });
      }

      await loadInsuranceData();
    } catch (error: unknown) {
      console.error('Erro completo ao atualizar convenio:', error);

      let errorMessage = 'Nao foi possivel atualizar o convenio.';
      const typedError = error as SupabaseErrorLike;

      if (typedError?.message) {
        errorMessage += ` Detalhes: ${typedError.message}`;
      }

      if (typedError?.code === '42501') {
        errorMessage = 'Voce nao tem permissao para realizar esta acao.';
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = useMemo(
    () =>
      companies.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.short_name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [companies, searchTerm]
  );

  const getPlanTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'basico':
      case 'básico':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'intermediario':
      case 'intermediário':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'premium':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const totalAcceptedPlans = useMemo(
    () => companies.reduce((total, company) => total + company.acceptedPlanIds.length, 0),
    [companies]
  );

  const acceptedCompaniesCount = useMemo(
    () => companies.filter((company) => company.acceptedPlanIds.length > 0).length,
    [companies]
  );

  return {
    acceptedCompaniesCount,
    companies,
    filteredCompanies,
    getPlanTypeBadgeColor,
    loadInsuranceData,
    loading,
    saving,
    searchTerm,
    setSearchTerm,
    togglePlanAcceptance,
    totalAcceptedPlans,
    user,
  };
}


