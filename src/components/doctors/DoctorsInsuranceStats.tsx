import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Stethoscope, TrendingUp } from 'lucide-react';

type DoctorsInsuranceStatsProps = {
  averagePlans: string;
  totalDoctors: number;
  totalWithInsurance: number;
};

export function DoctorsInsuranceStats({
  averagePlans,
  totalDoctors,
  totalWithInsurance,
}: DoctorsInsuranceStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medicos Com Convenio</CardTitle>
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDoctors}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Operadoras Atendidas</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWithInsurance}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Media de Planos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averagePlans}</div>
        </CardContent>
      </Card>
    </div>
  );
}
