import { MagicBentoCard } from '@/components/bento/MagicBento';
import { MedicalRecordsList } from '@/components/patients/MedicalRecordsList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mic, MicOff } from 'lucide-react';

type ActiveTeleconsultaPanelProps = {
  embedUrl: string;
  isTranscribing: boolean;
  loadingPatientData: boolean;
  medicalRecords: unknown[];
  patientName?: string | null;
  partialTranscript: string;
  showTranscript: boolean;
  transcript: string;
  onEndSession: () => void;
  onToggleTranscript: () => void;
};

export function ActiveTeleconsultaPanel({
  embedUrl,
  isTranscribing,
  loadingPatientData,
  medicalRecords,
  patientName,
  partialTranscript,
  showTranscript,
  transcript,
  onEndSession,
  onToggleTranscript,
}: ActiveTeleconsultaPanelProps) {
  return (
    <MagicBentoCard contentClassName="p-3">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="text-xl font-semibold">Teleconsulta em andamento</h2>
        <div className="flex items-center gap-2">
          {isTranscribing ? (
            <div className="flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 px-3 py-1">
              <Mic className="h-4 w-4 animate-pulse text-green-600" />
              <span className="text-xs text-green-600">Transcrevendo</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-gray-500/20 bg-gray-500/10 px-3 py-1">
              <MicOff className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600">Transcricao pausada</span>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={onToggleTranscript} className="gap-2">
            <FileText className="h-4 w-4" />
            {showTranscript ? 'Ocultar' : 'Ver'} Transcricao
          </Button>

          <Button variant="destructive" size="sm" onClick={onEndSession}>
            Encerrar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8">
          <div className="w-full overflow-hidden rounded-md border">
            <iframe
              src={embedUrl}
              title="Teleconsulta"
              className="h-[70vh] w-full bg-black"
              allow="camera; microphone; fullscreen; display-capture; autoplay"
            />
          </div>

          {showTranscript && (
            <Card className="mt-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Transcricao em Tempo Real</CardTitle>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {transcript && <p className="text-foreground">{transcript}</p>}
                  {partialTranscript && <p className="italic text-muted-foreground">{partialTranscript}...</p>}
                  {!transcript && !partialTranscript && (
                    <p className="text-muted-foreground">Aguardando audio...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-12 xl:col-span-4">
          <Card className="h-[70vh] overflow-hidden">
            <CardHeader className="py-4">
              <CardTitle className="truncate text-lg">{patientName || 'Paciente'}</CardTitle>
              <CardDescription>Prontuario</CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(70vh-80px)] overflow-y-auto">
              {loadingPatientData ? (
                <p className="text-muted-foreground">Carregando dados...</p>
              ) : (
                <MedicalRecordsList records={medicalRecords} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MagicBentoCard>
  );
}
