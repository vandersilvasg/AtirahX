import { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { MagicBentoCard } from '@/components/bento/MagicBento';
import { useRealtimeList } from '@/hooks/useRealtimeList';

interface Appointment {
  reason: string | null;
}

interface AgentConsultation {
  cid_code: string | null;
  cid_description: string | null;
}

interface MedicalRecord {
  chief_complaint: string | null;
  diagnosis: string | null;
}

export function DiseaseTreemapCard() {
  const { data: appointments } = useRealtimeList<Appointment>({ table: 'appointments' });
  const { data: agentConsultations } = useRealtimeList<AgentConsultation>({ table: 'agent_consultations' });
  const { data: medicalRecords } = useRealtimeList<MedicalRecord>({ table: 'medical_records' });

  const diseaseStats = useMemo(() => {
    const diseaseCounts: Record<
      string,
      { count: number; type: 'cid' | 'reason' | 'chief_complaint' | 'diagnosis' }
    > = {};

    agentConsultations.forEach((consultation) => {
      if (consultation.cid_code && consultation.cid_description) {
        const key = `${consultation.cid_code} - ${consultation.cid_description}`;
        if (!diseaseCounts[key]) diseaseCounts[key] = { count: 0, type: 'cid' };
        diseaseCounts[key].count++;
      }
    });

    appointments.forEach((apt) => {
      if (apt.reason) {
        if (!diseaseCounts[apt.reason]) diseaseCounts[apt.reason] = { count: 0, type: 'reason' };
        diseaseCounts[apt.reason].count++;
      }
    });

    medicalRecords.forEach((record) => {
      if (record.chief_complaint) {
        if (!diseaseCounts[record.chief_complaint]) {
          diseaseCounts[record.chief_complaint] = { count: 0, type: 'chief_complaint' };
        }
        diseaseCounts[record.chief_complaint].count++;
      }

      if (record.diagnosis) {
        if (!diseaseCounts[record.diagnosis]) {
          diseaseCounts[record.diagnosis] = { count: 0, type: 'diagnosis' };
        }
        diseaseCounts[record.diagnosis].count++;
      }
    });

    return Object.entries(diseaseCounts)
      .map(([name, data]) => ({
        name: name.length > 40 ? `${name.substring(0, 37)}...` : name,
        fullName: name,
        value: data.count,
        type: data.type,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [appointments, agentConsultations, medicalRecords]);

  const maxValue = Math.max(...diseaseStats.map((item) => item.value), 1);

  return (
    <MagicBentoCard>
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Top Diagnosticos e Motivos de Consulta</span>
        </div>

        {diseaseStats.length > 0 ? (
          <>
            <div className="space-y-3">
              {diseaseStats.map((entry) => {
                const barColor = entry.type === 'cid' ? '#3B82F6' : '#10B981';
                const label =
                  entry.type === 'cid'
                    ? 'Diagnostico CID'
                    : entry.type === 'diagnosis'
                      ? 'Diagnostico'
                      : entry.type === 'chief_complaint'
                        ? 'Queixa Principal'
                        : 'Motivo Consulta';

                return (
                  <div key={entry.fullName} className="rounded-xl border border-border/50 bg-background/30 p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{entry.value}</p>
                        <p className="text-xs text-muted-foreground">ocorrencias</p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max((entry.value / maxValue) * 100, 8)}%`,
                          background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                        }}
                        title={`${entry.fullName}: ${entry.value}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-center gap-4 border-t border-border pt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Diagnostico CID</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-green-500" />
                <span className="text-muted-foreground">Motivos e queixas</span>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum dado disponivel</div>
        )}
      </div>
    </MagicBentoCard>
  );
}
