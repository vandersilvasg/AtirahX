import { lazy, Suspense, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { usePatientData, type AgentExam, type MedicalRecord } from '@/hooks/usePatientData';
import {
  getAgentExamTitle,
  getExamOutputText,
  getPatientDetailsErrorMessage,
  getVisibleAttachments,
} from '@/lib/patientDetails';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { deleteFile } from '@/lib/storageUtils';
import { toast } from 'sonner';
import { Activity, Clock, Clipboard, FileText, Upload, User } from 'lucide-react';
import { PatientAnamnesisTab } from './PatientAnamnesisTab';
import { PatientAttachmentsTab } from './PatientAttachmentsTab';
import { PatientClinicalDataTab } from './PatientClinicalDataTab';
import { PatientMedicalRecordsTab } from './PatientMedicalRecordsTab';

const PatientOverview = lazy(() =>
  import('./PatientOverview').then((module) => ({ default: module.PatientOverview }))
);
const PatientTimeline = lazy(() =>
  import('./PatientTimeline').then((module) => ({ default: module.PatientTimeline }))
);
const MedicalRecordViewModal = lazy(() =>
  import('./MedicalRecordViewModal').then((module) => ({ default: module.MedicalRecordViewModal }))
);

interface PatientDetailModalProps {
  patientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientDetailModal({ patientId, open, onOpenChange }: PatientDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [showAnamnesisForm, setShowAnamnesisForm] = useState(false);
  const [showClinicalDataForm, setShowClinicalDataForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedAgentExam, setSelectedAgentExam] = useState<AgentExam | null>(null);

  const {
    patient,
    medicalRecords,
    anamnesis,
    clinicalData,
    examHistory,
    attachments,
    agentExams,
    doctors,
    loading,
    error,
    refetch,
  } = usePatientData(patientId);

  const visibleAttachments = getVisibleAttachments(attachments);

  useEffect(() => {
    if (!open) return;

    setActiveTab('overview');
    setShowMedicalRecordForm(false);
    setShowAnamnesisForm(false);
    setShowClinicalDataForm(false);
    setSelectedAgentExam(null);
  }, [open, patientId]);

  const handleAvatarUpdate = async (url: string) => {
    if (!patientId) return;

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from('patients').update({ avatar_url: url }).eq('id', patientId);
      if (error) throw error;

      refetch();
      toast.success('Avatar atualizado!');
    } catch (error: unknown) {
      console.error('Erro ao atualizar avatar:', error);
      toast.error(getPatientDetailsErrorMessage(error, 'Erro ao atualizar avatar'));
    }
  };

  const handleMedicalRecordSuccess = () => {
    setShowMedicalRecordForm(false);
    refetch();
  };

  const handleAnamnesisSuccess = () => {
    setShowAnamnesisForm(false);
    refetch();
  };

  const handleClinicalDataSuccess = () => {
    setShowClinicalDataForm(false);
    refetch();
  };

  const handleFileUploadSuccess = async (_url: string, path: string) => {
    if (!patientId) return;

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from('medical_attachments').insert({
        patient_id: patientId,
        file_name: path.split('/').pop() || 'unknown',
        file_path: path,
        related_to_type: 'general',
      });

      if (error) throw error;

      refetch();
    } catch (error: unknown) {
      console.error('Erro ao registrar anexo:', error);
      toast.error(getPatientDetailsErrorMessage(error, 'Erro ao registrar anexo'));
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!patientId) return;

    try {
      const supabase = await getSupabaseClient();
      const { data: attachment } = await supabase
        .from('medical_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single();

      if (attachment?.file_path) {
        await deleteFile(attachment.file_path);
      }

      const { error } = await supabase.from('medical_attachments').delete().eq('id', attachmentId);
      if (error) throw error;

      toast.success('Anexo excluido com sucesso!');
      refetch();
    } catch (error: unknown) {
      console.error('Erro ao excluir anexo:', error);
      toast.error(getPatientDetailsErrorMessage(error, 'Erro ao excluir anexo'));
    }
  };

  if (!patientId) return null;

  const tabFallback = (
    <div className="space-y-4 p-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-7xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl">Prontuario do Paciente</DialogTitle>
          <DialogDescription>
            {loading ? 'Carregando dados...' : patient?.name || 'Detalhes completos'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive">
            <p>Erro ao carregar dados: {error}</p>
          </div>
        ) : patient ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="border-b px-6">
              <TabsList className="h-auto w-full justify-start bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <User className="h-4 w-4" />
                  Visao Geral
                </TabsTrigger>
                <TabsTrigger
                  value="medical-records"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <FileText className="h-4 w-4" />
                  Prontuarios ({medicalRecords.length})
                </TabsTrigger>
                <TabsTrigger
                  value="anamnesis"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <Clipboard className="h-4 w-4" />
                  Anamnese ({anamnesis.length})
                </TabsTrigger>
                <TabsTrigger
                  value="clinical-data"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <Activity className="h-4 w-4" />
                  Dados Clinicos ({clinicalData.length})
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <Clock className="h-4 w-4" />
                  Linha do Tempo
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  <Upload className="h-4 w-4" />
                  Anexos ({visibleAttachments.length + agentExams.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {activeTab === 'timeline' ? (
              <div className="flex h-[calc(90vh-200px)] flex-col overflow-hidden">
                <div className="h-full w-full overflow-hidden">
                  <TabsContent value="timeline" className="mt-0 h-full">
                    <Suspense fallback={tabFallback}>
                      <PatientTimeline patientId={patientId} />
                    </Suspense>
                  </TabsContent>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div className="p-6">
                  <TabsContent value="overview" className="mt-0">
                    <Suspense fallback={tabFallback}>
                      <PatientOverview
                        patient={patient}
                        doctors={doctors}
                        medicalRecords={medicalRecords}
                        clinicalData={clinicalData}
                        examHistory={examHistory}
                        anamnesis={anamnesis}
                        onAvatarUpdate={handleAvatarUpdate}
                        onPatientUpdate={refetch}
                      />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="medical-records" className="mt-0">
                    <PatientMedicalRecordsTab
                      patientId={patientId}
                      records={medicalRecords}
                      showForm={showMedicalRecordForm}
                      onAdd={() => setShowMedicalRecordForm(true)}
                      onCancel={() => setShowMedicalRecordForm(false)}
                      onSuccess={handleMedicalRecordSuccess}
                      onView={(record) => setSelectedRecord(record)}
                    />
                  </TabsContent>

                  <TabsContent value="anamnesis" className="mt-0">
                    <PatientAnamnesisTab
                      patientId={patientId}
                      items={anamnesis}
                      showForm={showAnamnesisForm}
                      onCreate={() => setShowAnamnesisForm(true)}
                      onCancel={() => setShowAnamnesisForm(false)}
                      onSuccess={handleAnamnesisSuccess}
                    />
                  </TabsContent>

                  <TabsContent value="clinical-data" className="mt-0">
                    <PatientClinicalDataTab
                      patientId={patientId}
                      items={clinicalData}
                      showForm={showClinicalDataForm}
                      onCreate={() => setShowClinicalDataForm(true)}
                      onCancel={() => setShowClinicalDataForm(false)}
                      onSuccess={handleClinicalDataSuccess}
                    />
                  </TabsContent>

                  <TabsContent value="attachments" className="mt-0">
                    <PatientAttachmentsTab
                      patientId={patientId}
                      agentExams={agentExams}
                      visibleAttachments={visibleAttachments}
                      onUploadSuccess={handleFileUploadSuccess}
                      onDeleteAttachment={handleDeleteAttachment}
                      onOpenAgentExam={setSelectedAgentExam}
                    />
                  </TabsContent>
                </div>
              </ScrollArea>
            )}
          </Tabs>
        ) : null}
      </DialogContent>

      {selectedRecord && (
        <Suspense fallback={null}>
          <MedicalRecordViewModal
            record={selectedRecord}
            open={!!selectedRecord}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) setSelectedRecord(null);
            }}
            patientName={patient?.name}
          />
        </Suspense>
      )}

      <Dialog
        open={!!selectedAgentExam}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedAgentExam(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAgentExam ? getAgentExamTitle(selectedAgentExam) : 'Analise de Exame'}
            </DialogTitle>
            <DialogDescription>
              {selectedAgentExam?.consultation_date
                ? new Date(selectedAgentExam.consultation_date).toLocaleDateString('pt-BR')
                : 'Detalhes completos da analise'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <pre className="whitespace-pre-wrap text-sm leading-6">
              {selectedAgentExam ? getExamOutputText(selectedAgentExam.consultation_output) : ''}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
