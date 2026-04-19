import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';

interface Appointment {
  scheduled_at: string;
}

interface MedicalRecord {
  appointment_date: string;
}

export function PeakHoursChartCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });
  const { data: medicalRecords } = useRealtimeList<MedicalRecord>({ table: 'medical_records' });

  const hourStats = useMemo(() => {
    const hourCounts: Record<number, number> = {};

    appointments.forEach((apt) => {
      if (apt.scheduled_at) {
        const date = new Date(apt.scheduled_at);
        const hour = date.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    medicalRecords.forEach((record) => {
      if (record.appointment_date) {
        const date = new Date(record.appointment_date);
        const hour = date.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: Number.parseInt(hour, 10),
        count,
        name: `${String(hour).padStart(2, '0')}:00`,
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [appointments, medicalRecords]);

  const maxCount = Math.max(...hourStats.map((item) => item.count), 1);
  const colors = ['#5227FF', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Horarios Mais Procurados</span>
        </div>

        {hourStats.length > 0 ? (
          <div className="space-y-4">
            <div className="flex h-[280px] items-end gap-3 rounded-2xl border border-border/50 bg-background/40 p-4">
              {hourStats.map((entry, index) => (
                <div key={entry.name} className="flex flex-1 flex-col items-center justify-end gap-3">
                  <span className="text-xs font-medium text-foreground">{entry.count}</span>
                  <div className="flex h-52 w-full items-end">
                    <div
                      className="w-full rounded-t-xl transition-all duration-500"
                      style={{
                        height: `${Math.max((entry.count / maxCount) * 100, 6)}%`,
                        background: `linear-gradient(180deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}cc)`,
                      }}
                      title={`${entry.name}: ${entry.count}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
              {hourStats
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
                .map((entry) => (
                  <div key={entry.name} className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                    <div className="font-medium text-foreground">{entry.name}</div>
                    <div>{entry.count} agendamentos</div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum dado disponivel</div>
        )}
      </div>
    </MagicBentoCard>
  );
}
