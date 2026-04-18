import type { AgentExam, MedicalAttachment } from '@/hooks/usePatientData';
import { isAudioFile } from '@/lib/storageUtils';

export function getPatientDetailsErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getExamOutputText(output: unknown): string {
  if (typeof output === 'string' && output.trim()) {
    return output;
  }

  if (
    typeof output === 'object' &&
    output !== null &&
    'output' in output &&
    typeof output.output === 'string' &&
    output.output.trim()
  ) {
    return output.output;
  }

  return 'Analise nao disponivel';
}

export function getVisibleAttachments(attachments: MedicalAttachment[]) {
  return attachments.filter((attachment) => !isAudioFile(attachment.file_name, attachment.file_path));
}

export function getAgentExamTitle(exam: AgentExam) {
  return exam.exam_file_name || 'Analise de Exame';
}
