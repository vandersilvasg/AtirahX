import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AvailableDoctorsSection } from '@/components/teleconsulta/AvailableDoctorsSection';
import { ActiveTeleconsultaPanel } from '@/components/teleconsulta/ActiveTeleconsultaPanel';
import { StartTeleconsultaDialog } from '@/components/teleconsulta/StartTeleconsultaDialog';
import { UpcomingTeleconsultationsSection } from '@/components/teleconsulta/UpcomingTeleconsultationsSection';
import { useAssemblyAITranscription } from '@/hooks/useAssemblyAITranscription';
import { useAvailableDoctorsNow } from '@/hooks/useAvailableDoctorsNow';
import { usePatientData } from '@/hooks/usePatientData';
import { useTeleconsultationSession } from '@/hooks/useTeleconsultationSession';

export default function Teleconsulta() {
  const { user } = useAuth();
  const { availableDoctors, loading: loadingDoctors, error: errorDoctors } = useAvailableDoctorsNow();
  const {
    isTranscribing,
    partialTranscript,
    startTranscription,
    stopTranscription,
    transcript,
  } = useAssemblyAITranscription();
  const {
    activePatientId,
    confirmOpen,
    embedUrl,
    endSession,
    errorUpcoming,
    loadingUpcoming,
    prepareInvite,
    setConfirmOpen,
    setShowTranscript,
    showTranscript,
    startSession,
    upcoming,
  } = useTeleconsultationSession({
    startTranscription,
    stopTranscription,
    userId: user?.id,
  });
  const { patient, medicalRecords, loading: loadingPatientData } = usePatientData(activePatientId);

  return (
    <DashboardLayout requiredRoles={['owner', 'doctor']}>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teleconsulta</h1>
          <p className="mt-1 text-muted-foreground">
            Atendimento remoto por video com transcricao automatica
          </p>
        </div>

        <AvailableDoctorsSection
          availableDoctors={availableDoctors}
          errorDoctors={errorDoctors}
          loadingDoctors={loadingDoctors}
        />

        <UpcomingTeleconsultationsSection
          errorUpcoming={errorUpcoming}
          loadingUpcoming={loadingUpcoming}
          onPrepareInvite={prepareInvite}
          upcoming={upcoming}
        />

        <StartTeleconsultaDialog
          confirmOpen={confirmOpen}
          onOpenChange={setConfirmOpen}
          onStartWithInvite={() => {
            void startSession(true);
          }}
          onStartWithoutInvite={() => {
            void startSession(false);
          }}
        />

        {embedUrl && (
          <ActiveTeleconsultaPanel
            embedUrl={embedUrl}
            isTranscribing={isTranscribing}
            loadingPatientData={loadingPatientData}
            medicalRecords={medicalRecords}
            onEndSession={() => {
              void endSession(isTranscribing);
            }}
            onToggleTranscript={() => setShowTranscript(!showTranscript)}
            partialTranscript={partialTranscript}
            patientName={patient?.name}
            showTranscript={showTranscript}
            transcript={transcript}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
