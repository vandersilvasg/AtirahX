import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';

interface Appointment {
  scheduled_at: string;
}

interface MedicalRecord {
  appointment_date: string;
}

const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export function WeekdayChartCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });
  const { data: medicalRecords } = useRealtimeList<MedicalRecord>({ table: 'medical_records' });

  const weekdayStats = useMemo(() => {
    const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    appointments.forEach((apt) => {
      if (apt.scheduled_at) {
        dayCounts[new Date(apt.scheduled_at).getDay()]++;
      }
    });

    medicalRecords.forEach((record) => {
      if (record.appointment_date) {
        dayCounts[new Date(record.appointment_date).getDay()]++;
      }
    });

    return Object.entries(dayCounts).map(([day, count]) => ({
      day: Number.parseInt(day, 10),
      name: weekDayNames[Number.parseInt(day, 10)],
      count,
    }));
  }, [appointments, medicalRecords]);

  const maxCount = Math.max(...weekdayStats.map((item) => item.count), 1);
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Agendamentos por Dia da Semana</span>
        </div>

        {weekdayStats.some((item) => item.count > 0) ? (
          <div className="space-y-4">
            <div className="grid gap-3">
              {weekdayStats.map((entry, index) => (
                <div key={entry.name} className="grid grid-cols-[40px_1fr_52px] items-center gap-3">
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max((entry.count / maxCount) * 100, 4)}%`,
                        background: `linear-gradient(90deg, ${colors[index]}, ${colors[index]}cc)`,
                      }}
                      title={`${entry.name}: ${entry.count}`}
                    />
                  </div>
                  <span className="text-right text-xs font-medium text-foreground">{entry.count}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              {weekdayStats
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map((entry) => (
                  <div key={entry.name} className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                    <div className="font-medium text-foreground">{entry.name}</div>
                    <div>{entry.count} registros</div>
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
