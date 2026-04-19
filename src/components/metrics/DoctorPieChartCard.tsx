import { useMemo } from 'react';
import { Award, Stethoscope, TrendingUp, Users } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { useRealtimeProfiles } from '@/hooks/useRealtimeProfiles';

interface Appointment {
  doctor_id: string;
}

interface MedicalRecord {
  doctor_id: string;
}

export function DoctorPieChartCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });
  const { data: medicalRecords } = useRealtimeList<MedicalRecord>({ table: 'medical_records' });
  const { profiles } = useRealtimeProfiles([], {
    channelName: 'doctor-pie-chart-profiles',
    filter: 'role.eq.doctor',
    onlyUpdates: true,
  });

  const doctorStats = useMemo(() => {
    const doctorCounts: Record<string, number> = {};

    appointments.forEach((apt) => {
      if (apt.doctor_id) doctorCounts[apt.doctor_id] = (doctorCounts[apt.doctor_id] || 0) + 1;
    });

    medicalRecords.forEach((record) => {
      if (record.doctor_id) doctorCounts[record.doctor_id] = (doctorCounts[record.doctor_id] || 0) + 1;
    });

    const total = appointments.length + medicalRecords.length || 1;

    return profiles
      .filter((profile) => profile.role === 'doctor')
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.name || 'Medico',
        value: doctorCounts[doctor.id] || 0,
        percentage: ((doctorCounts[doctor.id] || 0) / total) * 100,
      }))
      .filter((doctor) => doctor.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [appointments, medicalRecords, profiles]);

  const colors = ['#5227FF', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
  const topFiveTotal = doctorStats.slice(0, 5).reduce((sum, item) => sum + item.value, 0) || 1;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}º`;
  };

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">Ranking de Profissionais</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{doctorStats.length} medicos</span>
          </div>
        </div>

        {doctorStats.length > 0 ? (
          <div className="space-y-4">
            {doctorStats.slice(0, 3).map((doctor, index) => (
              <div
                key={doctor.id}
                className="relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${colors[index]}15 0%, ${colors[index]}05 100%)`,
                  borderColor: `${colors[index]}30`,
                }}
              >
                <div className="absolute right-2 top-2 text-2xl">{getMedalIcon(index)}</div>
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${colors[index]}, ${colors[index]}dd)` }}
                  >
                    {getInitials(doctor.name)}
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{doctor.name}</h3>
                      {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                    </div>

                    <div className="mb-2 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold" style={{ color: colors[index] }}>
                          {doctor.value}
                        </span>
                        <span className="text-xs text-muted-foreground">consultas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-semibold text-green-500">
                          {doctor.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(doctor.percentage, 100)}%`,
                          background: `linear-gradient(90deg, ${colors[index]}, ${colors[index]}cc)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {doctorStats.length > 3 && (
              <div className="space-y-2 pt-2">
                {doctorStats.slice(3).map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-xs font-semibold text-primary">
                      {index + 4}º
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{doctor.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{doctor.value}</span>
                      <span className="text-xs text-muted-foreground">({doctor.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {doctorStats.length >= 3 && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="mb-3 text-center text-xs text-muted-foreground">Distribuicao Comparativa</p>
                <div className="space-y-3">
                  {doctorStats.slice(0, 5).map((doctor, index) => (
                    <div key={doctor.id} className="grid grid-cols-[96px_1fr_48px] items-center gap-3">
                      <span className="truncate text-xs text-muted-foreground">{doctor.name.split(' ')[0]}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max((doctor.value / topFiveTotal) * 100, 8)}%`,
                            background: `linear-gradient(90deg, ${colors[index]}, ${colors[index]}cc)`,
                          }}
                        />
                      </div>
                      <span className="text-right text-xs font-medium text-foreground">{doctor.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum dado disponivel</div>
        )}
      </div>
    </MagicBentoCard>
  );
}
