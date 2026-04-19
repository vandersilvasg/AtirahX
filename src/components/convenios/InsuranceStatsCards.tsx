import { Card, CardContent } from '@/components/ui/card';
import { Building2, CheckCircle2, TrendingUp } from 'lucide-react';

type InsuranceStatsCardsProps = {
  acceptedCompaniesCount: number;
  companiesCount: number;
  totalAcceptedPlans: number;
};

export function InsuranceStatsCards({
  acceptedCompaniesCount,
  companiesCount,
  totalAcceptedPlans,
}: InsuranceStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Operadoras Disponiveis</p>
              <p className="text-2xl font-bold">{companiesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-500/10 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Operadoras Aceitas</p>
              <p className="text-2xl font-bold">{acceptedCompaniesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Planos Aceitos</p>
              <p className="text-2xl font-bold">{totalAcceptedPlans}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
