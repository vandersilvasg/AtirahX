import { MagicBentoCard, MagicBentoGrid } from '@/components/bento/MagicBento';
import type { LucideIcon } from 'lucide-react';

type DashboardStat = {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  description: string;
};

type DashboardStatsGridProps = {
  loading: boolean;
  stats: DashboardStat[];
};

export function DashboardStatsGrid({
  loading,
  stats,
}: DashboardStatsGridProps) {
  return (
    <MagicBentoGrid>
      {stats.map((stat, index) => (
        <MagicBentoCard key={index} accent={index % 2 === 0 ? 'primary' : 'accent'}>
          <div className="flex items-start justify-between pb-2">
            <div className="text-sm font-medium text-muted-foreground">{stat.title}</div>
            <stat.icon className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {loading ? '...' : stat.value}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            <span
              className={
                String(stat.trend).startsWith('+')
                  ? 'text-green-500'
                  : String(stat.trend).startsWith('-')
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              }
            >
              {stat.trend}
            </span>{' '}
            {stat.description}
          </p>
        </MagicBentoCard>
      ))}
    </MagicBentoGrid>
  );
}
