import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { CompanyWithPlans } from '@/hooks/useInsuranceManagement';
import { Building2, MapPin, Users } from 'lucide-react';

type InsuranceCompaniesAccordionProps = {
  filteredCompanies: CompanyWithPlans[];
  getPlanTypeBadgeColor: (type: string) => string;
  saving: boolean;
  togglePlanAcceptance: (planId: string, currentlyAccepted: boolean) => Promise<void>;
  userRole?: string;
};

export function InsuranceCompaniesAccordion({
  filteredCompanies,
  getPlanTypeBadgeColor,
  saving,
  togglePlanAcceptance,
  userRole,
}: InsuranceCompaniesAccordionProps) {
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {filteredCompanies.map((company) => (
        <AccordionItem key={company.id} value={company.id} className="rounded-lg border">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex w-full items-center justify-between pr-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold">{company.name}</h3>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {company.headquarters}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {(company.beneficiaries / 1000000).toFixed(2)}M beneficiarios
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {company.market_share}% do mercado
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {company.acceptedPlanIds.length > 0 && (
                  <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    {company.acceptedPlanIds.length}{' '}
                    {company.acceptedPlanIds.length === 1
                      ? 'plano aceito'
                      : 'planos aceitos'}
                  </Badge>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            {userRole === 'doctor' && (
              <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                <p className="text-sm text-blue-700">
                  <strong>Clique nos cards ou nos checkboxes</strong> para
                  adicionar/remover convenios que voce aceita
                </p>
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {company.plans.map((plan) => {
                const isAccepted = company.acceptedPlanIds.includes(plan.id);
                const canModify = userRole === 'doctor';

                return (
                  <Card
                    key={plan.id}
                    className={`transition-all ${
                      canModify ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : ''
                    } ${
                      isAccepted
                        ? 'border-green-500 bg-green-500/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => canModify && void togglePlanAcceptance(plan.id, isAccepted)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="mb-2 text-sm font-semibold">{plan.name}</h4>
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={getPlanTypeBadgeColor(plan.plan_type)}
                              variant="secondary"
                            >
                              {plan.plan_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Cobertura: {plan.coverage_type}
                            </span>
                          </div>
                        </div>
                        {canModify && (
                          <Checkbox
                            checked={isAccepted}
                            disabled={saving}
                            className="mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              void togglePlanAcceptance(plan.id, isAccepted);
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
