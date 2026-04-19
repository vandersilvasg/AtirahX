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
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TZ = 'America/Sao_Paulo';
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

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

  const handleQuickAction = async (action: 'agendar' | 'followup' | 'marcar_perdido') => {
    if (!selectedSessionId || selectedSession?.kind !== 'pre_patient') {
      toast.info('Ação rápida disponível apenas para pre pacientes.');
      return;
    }
    try {
      const supabase = await getSupabaseClient();
      if (action === 'agendar') {
        const { error } = await supabase
          .from('pre_patients')
          .update({
            stage: 'agendado',
            next_action: 'Consulta agendada a partir da central de conversas',
            last_contact_at: new Date().toISOString(),
          })
          .eq('id', selectedSessionId);
        if (error) throw error;
        toast.success('Lead movido para Agendado.');
      }
      if (action === 'followup') {
        const { error } = await supabase
          .from('pre_patients')
          .update({
            stage: 'contato_iniciado',
            next_action: 'Follow-up disparado pela central de conversas',
            last_contact_at: new Date().toISOString(),
          })
          .eq('id', selectedSessionId);
        if (error) throw error;
        toast.success('Follow-up registrado no lead.');
      }
      if (action === 'marcar_perdido') {
        const { error } = await supabase
          .from('pre_patients')
          .update({
            stage: 'perdido',
            status: 'perdido',
            next_action: 'Tentar recuperação posterior',
            last_contact_at: new Date().toISOString(),
          })
          .eq('id', selectedSessionId);
        if (error) throw error;
        toast.success('Lead marcado como perdido.');
      }
      queryClient.invalidateQueries({ queryKey: ['pre_patients_min'] });
      queryClient.invalidateQueries({ queryKey: ['medx_sessions'] });
    } catch (error) {
      toast.error('Não foi possível executar a ação rápida.');
      console.error(error);
    }
  };

  return (
    <DashboardLayout requiredRoles={['owner', 'secretary']}>
      <div className="h-full overflow-hidden p-4">
        <Card className="h-full overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[340px_1fr_320px]">
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
                onQuickAction={handleQuickAction}
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

            <div className="flex min-h-0 flex-col border-l bg-muted/10 p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Contexto da conversa
                  </h2>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedSession?.displayName ?? 'Selecione uma conversa para ver o contexto comercial.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Origem</p>
                    <p className="font-medium">{selectedSession?.sourceChannel ?? 'Nao informado'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Temperatura</p>
                    <p className="font-medium capitalize">{selectedSession?.temperature ?? 'Morno'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Etapa do funil</p>
                    <p className="font-medium">{selectedSession?.stage ?? 'Sem etapa definida'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Valor estimado</p>
                    <p className="font-medium">
                      {currencyFormatter.format(Number(selectedSession?.estimatedValue ?? 0))}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Interesse</p>
                    <p className="font-medium">{selectedSession?.procedureInterest ?? 'Nao informado'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Proxima acao</p>
                    <p className="font-medium">{selectedSession?.nextAction ?? 'Ainda nao definida'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Ultima interacao</p>
                    <p className="font-medium">{selectedSession?.lastContactAt ?? 'Sem registro recente'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Sinal de IA</p>
                    <p className="font-medium">
                      {selectedSession?.temperature === 'quente'
                        ? 'Alta probabilidade de conversao'
                        : selectedSession?.temperature === 'frio'
                          ? 'Risco de perda e necessidade de reativacao'
                          : 'Necessita follow-up para avancar'}
                    </p>
                  </div>
                </div>
              </div>
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
