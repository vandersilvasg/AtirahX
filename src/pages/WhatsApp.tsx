import { Suspense, lazy, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { WhatsAppConversationSidebar } from '@/components/whatsapp/WhatsAppConversationSidebar';
import { WhatsAppConversationHeader } from '@/components/whatsapp/WhatsAppConversationHeader';
import { WhatsAppMessageList } from '@/components/whatsapp/WhatsAppMessageList';
import { WhatsAppMessageComposer } from '@/components/whatsapp/WhatsAppMessageComposer';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppConversationData } from '@/hooks/useWhatsAppConversationData';
import { useWhatsAppMessaging } from '@/hooks/useWhatsAppMessaging';
import { extractMessageText } from '@/lib/medxHistory';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TZ = 'America/Sao_Paulo';

const SummaryModal = lazy(() =>
  import('@/components/whatsapp/SummaryModal').then((module) => ({
    default: module.SummaryModal,
  }))
);

const AssignDoctorModal = lazy(() =>
  import('@/components/whatsapp/AssignDoctorModal').then((module) => ({
    default: module.AssignDoctorModal,
  }))
);

export default function WhatsApp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pre' | 'crm' | 'all'>('all');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [assignDoctorOpen, setAssignDoctorOpen] = useState(false);

  const {
    assignedDoctor,
    filteredSessions,
    loadingMessages,
    loadingSessions,
    messages,
    patientPhone,
    refetchAssignedDoctor,
    selectedSession,
  } = useWhatsAppConversationData({
    search,
    selectedSessionId,
    setSelectedSessionId,
    tab,
  });

  const {
    fileInputRef,
    handleAttachFile,
    handleFileSelected,
    handleKeyPress,
    handleRecordAudio,
    handleSendMessage,
    isRecording,
    messageText,
    recordingTime,
    sending,
    setMessageText,
  } = useWhatsAppMessaging({
    patientPhone,
    queryClient,
    selectedSessionId,
    userName: user?.name,
  });

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="h-full overflow-hidden p-4">
        <Card className="h-full overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-[340px_1fr]">
            <WhatsAppConversationSidebar
              filteredSessions={filteredSessions}
              loadingSessions={loadingSessions}
              search={search}
              selectedSessionId={selectedSessionId}
              setSearch={setSearch}
              setSelectedSessionId={setSelectedSessionId}
              setTab={setTab}
              tab={tab}
            />

            <div className="flex h-full min-h-0 flex-col p-4">
              <WhatsAppConversationHeader
                assignedDoctor={assignedDoctor}
                messageCount={messages.length}
                onAssignDoctor={() => setAssignDoctorOpen(true)}
                onOpenSummary={() => setSummaryOpen(true)}
                patientPhone={patientPhone}
                selectedSession={selectedSession}
                selectedSessionId={selectedSessionId}
              />

              <WhatsAppMessageList
                appTimeZone={APP_TZ}
                loadingMessages={loadingMessages}
                messages={messages}
                renderMessageText={(message) => extractMessageText(message.message)}
              />

              <WhatsAppMessageComposer
                disabled={!selectedSessionId}
                fileInputRef={fileInputRef}
                handleAttachFile={handleAttachFile}
                handleFileSelected={handleFileSelected}
                handleKeyPress={handleKeyPress}
                handleRecordAudio={handleRecordAudio}
                handleSendText={() => {
                  void handleSendMessage('text');
                }}
                isRecording={isRecording}
                messageText={messageText}
                recordingTime={recordingTime}
                sending={sending}
                setMessageText={setMessageText}
              />
            </div>
          </div>
        </Card>
      </div>

      <Suspense fallback={null}>
        {summaryOpen && (
          <SummaryModal
            open={summaryOpen}
            onOpenChange={setSummaryOpen}
            sessionId={selectedSessionId}
            patientPhone={patientPhone}
          />
        )}

        {selectedSessionId && assignDoctorOpen && (
          <AssignDoctorModal
            open={assignDoctorOpen}
            onOpenChange={setAssignDoctorOpen}
            sessionId={selectedSessionId}
            patientId={selectedSessionId}
            isPrePatient={selectedSession?.kind === 'pre_patient'}
            currentPatientName={selectedSession?.displayName}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['assigned_doctor', selectedSessionId] });
              queryClient.invalidateQueries({ queryKey: ['patients_min'] });
              queryClient.invalidateQueries({ queryKey: ['pre_patients_min'] });
              queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
              void refetchAssignedDoctor();
            }}
          />
        )}
      </Suspense>
    </DashboardLayout>
  );
}
