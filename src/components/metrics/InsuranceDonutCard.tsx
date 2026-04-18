import { Building2, FileText, Loader2, Percent, Shield, Users } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useMemo } from 'react';

interface InsuranceCompanyRow {
  id: string;
  name?: string | null;
  short_name?: string | null;
  is_active: boolean | null;
}

interface InsurancePlanRow {
  id: string;
  insurance_company_id?: string | null;
  name?: string | null;
  is_active: boolean | null;
}

interface AcceptedInsuranceRow {
  id: string;
  insurance_plan_id?: string | null;
  doctor_id?: string | null;
  is_active: boolean | null;
}

interface CompanyRowSummary {
  id: string;
  name: string;
  shortName: string;
  totalPlans: number;
  acceptedPlans: number;
}

export function InsuranceDonutCard() {
  const {
    data: companies,
    loading: companiesLoading,
    error: companiesError,
  } = useRealtimeList<InsuranceCompanyRow>({
    table: 'insurance_companies',
    select: '*',
    order: { column: 'name', ascending: true },
  });

  const {
    data: plans,
    loading: plansLoading,
    error: plansError,
  } = useRealtimeList<InsurancePlanRow>({
    table: 'insurance_plans',
    select: '*',
    order: { column: 'name', ascending: true },
  });

  const {
    data: acceptedInsurances,
    loading: acceptedLoading,
    error: acceptedError,
  } = useRealtimeList<AcceptedInsuranceRow>({
    table: 'clinic_accepted_insurances',
    select: '*',
  });

  const companyById = useMemo(() => {
    const map = new Map<string, InsuranceCompanyRow>();
    companies.forEach((company) => map.set(company.id, company));
    return map;
  }, [companies]);

  const planById = useMemo(() => {
    const map = new Map<string, InsurancePlanRow>();
    plans.forEach((plan) => map.set(plan.id, plan));
    return map;
  }, [plans]);

  const companySummary = useMemo(() => {
    const summaryMap = new Map<string, CompanyRowSummary>();

    companies.forEach((company) => {
      summaryMap.set(company.id, {
        id: company.id,
        name: company.name || 'Operadora',
        shortName: company.short_name || company.name || 'Operadora',
        totalPlans: 0,
        acceptedPlans: 0,
      });
    });

    plans.forEach((plan) => {
      if (!plan.insurance_company_id) return;
      const summary = summaryMap.get(plan.insurance_company_id);
      if (summary) {
        summary.totalPlans += 1;
      }
    });

    acceptedInsurances.forEach((accepted) => {
      if (!accepted.insurance_plan_id) return;
      const plan = planById.get(accepted.insurance_plan_id);
      if (!plan) return;
      if (!plan.insurance_company_id) return;
      const summary = summaryMap.get(plan.insurance_company_id);
      if (!summary) return;
      summary.acceptedPlans += 1;
    });

    return Array.from(summaryMap.values()).sort((a, b) => {
      if (b.acceptedPlans !== a.acceptedPlans) {
        return b.acceptedPlans - a.acceptedPlans;
      }
      if (b.totalPlans !== a.totalPlans) {
        return b.totalPlans - a.totalPlans;
      }
      return a.name.localeCompare(b.name);
    });
  }, [companies, plans, acceptedInsurances, planById]);

  const acceptedPlanLabels = useMemo(() => {
    const labels: string[] = [];
    const seen = new Set<string>();

    acceptedInsurances.forEach((accepted) => {
      if (!accepted.insurance_plan_id) return;
      const plan = planById.get(accepted.insurance_plan_id);
      if (!plan) return;
      const company = plan.insurance_company_id ? companyById.get(plan.insurance_company_id) : null;
      const companyLabel = company?.short_name || company?.name || 'Operadora';
      const label = `${companyLabel} - ${plan.name || 'Plano sem nome'}`;
      if (!seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
    });

    return labels;
  }, [acceptedInsurances, planById, companyById]);

  const fallbackPlanLabels = useMemo(
    () =>
      plans.map((plan) => {
        const company = plan.insurance_company_id ? companyById.get(plan.insurance_company_id) : null;
        const companyLabel = company?.short_name || company?.name || 'Operadora';
        return `${companyLabel} - ${plan.name || 'Plano sem nome'}`;
      }),
    [plans, companyById]
  );

  const visiblePlanLabels =
    acceptedPlanLabels.length > 0 ? acceptedPlanLabels.slice(0, 10) : fallbackPlanLabels.slice(0, 10);

  const loading = companiesLoading || plansLoading || acceptedLoading;
  const criticalError = companiesError || plansError;
  const acceptedWarning = acceptedError;

  const totalCompanies = companies.length;
  const totalPlans = plans.length;
  const totalAcceptedPlans = acceptedInsurances.length;
  const companiesWithAcceptedPlans = companySummary.filter((item) => item.acceptedPlans > 0).length;
  const maxAcceptedInCompany = Math.max(...companySummary.map((item) => item.acceptedPlans), 1);

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold">Planos e Operadoras</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span>{totalCompanies} operadoras</span>
          </div>
        </div>

        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Carregando dados de convenios...</span>
          </div>
        ) : criticalError ? (
          <div className="text-sm text-destructive border border-destructive/30 rounded-lg p-4">
            Erro ao carregar planos/empresas: {criticalError}
          </div>
        ) : totalCompanies === 0 && totalPlans === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado de convenio encontrado no banco.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Operadoras ativas</p>
                <p className="text-xl font-bold mt-1">
                  {companies.filter((company) => company.is_active !== false).length}
                </p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Planos ativos</p>
                <p className="text-xl font-bold mt-1">
                  {plans.filter((plan) => plan.is_active !== false).length}
                </p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Planos aceitos</p>
                <p className="text-xl font-bold mt-1 text-primary">{totalAcceptedPlans}</p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Empresas com aceite</p>
                <p className="text-xl font-bold mt-1">{companiesWithAcceptedPlans}</p>
              </div>
            </div>

            {acceptedWarning && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                Aviso: sem acesso a alguns aceites de planos ({acceptedWarning}).
              </div>
            )}

            <div className="space-y-2.5">
              {companySummary.slice(0, 6).map((company) => {
                const progressPercent =
                  company.acceptedPlans > 0
                    ? (company.acceptedPlans / maxAcceptedInCompany) * 100
                    : 0;

                return (
                  <div key={company.id} className="rounded-lg border p-3 bg-background/40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {company.shortName}
                      </p>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{company.totalPlans} planos</span>
                        <span className="flex items-center gap-1 text-primary">
                          <Percent className="w-3 h-3" />
                          {company.acceptedPlans} aceitos
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(progressPercent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>{acceptedPlanLabels.length > 0 ? 'Planos aceitos' : 'Planos cadastrados'}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {visiblePlanLabels.length} exibidos
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {visiblePlanLabels.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Sem planos para exibir.</span>
                ) : (
                  visiblePlanLabels.map((label) => (
                    <span
                      key={label}
                      className="text-xs px-2 py-1 rounded-full border bg-background/60 text-foreground/80"
                    >
                      {label}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MagicBentoCard>
  );
}
