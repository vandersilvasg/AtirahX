import { Button } from '@/components/ui/button';
import type { AgentExam, MedicalAttachment } from '@/hooks/usePatientData';
import { FileText, Upload } from 'lucide-react';
import { AttachmentCard } from './AttachmentCard';
import { FileUploadZone } from './FileUploadZone';

type PatientAttachmentsTabProps = {
  agentExams: AgentExam[];
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
  onOpenAgentExam: (exam: AgentExam) => void;
  onUploadSuccess: (_url: string, path: string) => Promise<void>;
  patientId: string;
  visibleAttachments: MedicalAttachment[];
};

export function PatientAttachmentsTab({
  agentExams,
  onDeleteAttachment,
  onOpenAgentExam,
  onUploadSuccess,
  patientId,
  visibleAttachments,
}: PatientAttachmentsTabProps) {
  return (
    <div className="space-y-6">
      <FileUploadZone patientId={patientId} folder="attachments" onUploadSuccess={onUploadSuccess} />

      {agentExams.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <span className="text-orange-500">Ex</span>
            Exames Analisados pelo Agent ({agentExams.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agentExams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-lg border bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-orange-500/10 p-2">
                      <FileText className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {exam.exam_file_name || 'Exame Laboratorial'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exam.exam_type || 'Laboratory'}
                      </p>
                    </div>
                  </div>
                </div>

                {exam.exam_result_summary && (
                  <p className="mb-3 line-clamp-3 text-xs text-muted-foreground">
                    {exam.exam_result_summary}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(exam.consultation_date).toLocaleDateString('pt-BR')}</span>
                  {exam.doctor && <span className="font-medium">Dr(a). {exam.doctor.name}</span>}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => onOpenAgentExam(exam)}
                >
                  Ver Analise Completa
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibleAttachments.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold">Arquivos Anexados ({visibleAttachments.length})</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleAttachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                onDelete={onDeleteAttachment}
              />
            ))}
          </div>
        </div>
      )}

      {visibleAttachments.length === 0 && agentExams.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Upload className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Nenhum anexo ou exame analisado ainda</p>
        </div>
      )}
    </div>
  );
}
