import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Microscope, AlertCircle, CheckCircle, FileUp, FileText, UserPlus, Link2, X, Image } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/storageUtils';
import { analyzeExamWithGemini, getSupportedFileExtensions, getFileInputAccept, isSupportedFileType } from '@/lib/geminiAnalyzer';

interface AgentExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExamData {
  output: string; // Conteúdo completo em Markdown
  analise?: string;
  valores_encontrados?: string[];
  valores_alterados?: string[];
  interpretacao?: string;
  recomendacoes?: string[];
  observacoes?: string;
}

interface ExamResponse {
  output?: string;
  analise?: string;
  // Outros campos possíveis que a API pode retornar
}

interface Patient {
  id: string;
  name: string;
}

export function AgentExamModal({ open, onOpenChange }: AgentExamModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editableFileName, setEditableFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ExamData | null>(null);
  
  // Estados para vinculação com paciente
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showPatientSelect, setShowPatientSelect] = useState(false);
  const [savingToPatient, setSavingToPatient] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Verificar se é um tipo suportado (PDF ou imagem)
    if (!isSupportedFileType(file.type)) {
      setError(`Por favor, selecione apenas arquivos: ${getSupportedFileExtensions()}`);
      return;
    }
    
    // Verificar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    if (file.size > maxSize) {
      setError('O arquivo deve ter no máximo 10MB');
      return;
    }
    
    setSelectedFile(file);
    // Definir nome editável (sem extensão para facilitar edição)
    const nameWithoutExtension = file.name.replace(/\.(pdf|png|jpg|jpeg|webp)$/i, '');
    setEditableFileName(nameWithoutExtension);
    setError(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setEditableFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo');
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      console.log('🚀 Iniciando análise do exame com Gemini Flash...');
      
      // Analisar exame usando Gemini Flash
      const examData = await analyzeExamWithGemini(selectedFile);
      
      // Validar que temos conteúdo
      if (!examData.output && !examData.analise) {
        console.error('Resposta do Gemini está incompleta:', examData);
        throw new Error('A análise do Gemini está incompleta');
      }
      
      console.log('✅ Análise completa! Tamanho:', examData.output?.length || 0, 'caracteres');
      setResultado(examData);
      
      toast.success('Exame analisado com sucesso!');
    } catch (err) {
      console.error('❌ Erro ao analisar exame:', err);
      
      let errorMessage = 'Erro ao analisar exame. Tente novamente.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setEditableFileName('');
    setError(null);
    setResultado(null);
    setShowPatientSelect(false);
    setSelectedPatientId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleNovaAnalise = () => {
    setSelectedFile(null);
    setEditableFileName('');
    setError(null);
    setResultado(null);
    setShowPatientSelect(false);
    setSelectedPatientId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Carregar lista de pacientes
  useEffect(() => {
    const loadPatients = async () => {
      if (!open) return;

      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase
          .from('patients')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setPatients(data || []);
      } catch (err) {
        console.error('Erro ao carregar pacientes:', err);
      }
    };

    loadPatients();
  }, [open]);

  // Função para vincular análise ao paciente
  const handleVincularPaciente = async () => {
    if (!selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }

    if (!resultado || !user || !selectedFile) {
      toast.error('Dados incompletos');
      return;
    }

    setSavingToPatient(true);

    try {
      // Nome final do arquivo (editável + extensão original)
      const fileExtension = selectedFile.name.split('.').pop() || 'pdf';
      const finalFileName = editableFileName.trim() ? `${editableFileName.trim()}.${fileExtension}` : selectedFile.name;
      
      // 1. Fazer upload do PDF para o storage
      console.log('📤 Fazendo upload do PDF para o storage...');
      const { url: fileUrl, path: filePath } = await uploadFile(
        selectedFile,
        selectedPatientId,
        'exam-reports'
      );
      
      console.log('✅ Upload concluído:', { fileUrl, filePath });

      // 2. Salvar o PDF como anexo médico
      const supabase = await getSupabaseClient();
      const { error: attachmentError } = await supabase
        .from('medical_attachments')
        .insert({
          patient_id: selectedPatientId,
          uploaded_by: user.id,
          related_to_type: 'exam', // Tipo 'exam' conforme CHECK constraint
          file_name: finalFileName, // Usar nome editável
          file_path: filePath,
          file_size_bytes: selectedFile.size,
          file_type: selectedFile.type,
          description: `🤖 Exame analisado pelo Agent de Exames - ${resultado.analise || resultado.output?.substring(0, 100) || 'Análise laboratorial'}`,
        });

      if (attachmentError) {
        console.error('Erro ao salvar anexo:', attachmentError);
        throw attachmentError;
      }

      console.log('✅ Anexo salvo no banco de dados');

      // 3. Salvar a consulta do agente (análise)
      const { error: insertError } = await supabase
        .from('agent_consultations')
        .insert({
          patient_id: selectedPatientId,
          doctor_id: user.id,
          agent_type: 'exams', // Plural conforme definido no CHECK constraint
          consultation_input: {
            filename: finalFileName, // Usar nome editável
            filesize: selectedFile.size,
            file_path: filePath, // Referência ao arquivo no storage
          },
          consultation_output: resultado,
          exam_type: 'laboratory', // Tipo padrão, pode ser expandido
          exam_result_summary: resultado.analise || resultado.output?.substring(0, 500) || 'Análise de exame',
          exam_file_name: finalFileName, // Usar nome editável
          exam_analysis_date: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Erro ao inserir consulta:', insertError);
        throw insertError;
      }

      console.log('✅ Análise salva no banco de dados');

      toast.success('Exame e análise vinculados ao paciente com sucesso!');
      setShowPatientSelect(false);
      setSelectedPatientId('');
    } catch (err) {
      console.error('Erro ao vincular análise:', err);
      toast.error('Erro ao vincular exame ao paciente');
    } finally {
      setSavingToPatient(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`max-w-4xl flex flex-col gap-0 p-0 transition-all duration-300 ${resultado ? 'max-h-[95vh] h-auto' : 'max-h-[90vh] h-auto'}`}>
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-border/50">
              <Microscope className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <DialogTitle>Agent de Exames</DialogTitle>
              <DialogDescription>
                Auxílio na interpretação de exames laboratoriais
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          {/* Área com Scroll quando necessário */}
          <div className={`overflow-y-auto overflow-x-hidden px-6 py-4 space-y-6 ${resultado ? 'max-h-[calc(95vh-180px)]' : ''}`}>
            {/* Upload de Arquivo */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo do Exame (PDF ou Imagem) *</Label>
              
              {!selectedFile ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept={getFileInputAccept()}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="flex gap-2">
                      <div className="p-4 rounded-full bg-orange-500/10">
                        <FileUp className="w-8 h-8 text-orange-500" />
                      </div>
                      <div className="p-4 rounded-full bg-orange-500/10">
                        <Image className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Clique para selecionar um arquivo</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Formatos: {getSupportedFileExtensions()} • Máximo: 10MB
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Campo para editar nome do arquivo */}
                  <div className="space-y-2">
                    <Label htmlFor="file-name-edit">Nome do Arquivo (será salvo com este nome)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="file-name-edit"
                        type="text"
                        value={editableFileName}
                        onChange={(e) => setEditableFileName(e.target.value)}
                        placeholder="Nome do arquivo"
                        disabled={loading}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">.pdf</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este será o nome exibido na aba de anexos do paciente
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Faça upload do arquivo do exame (PDF ou imagem) para análise
              </p>
              <p className="text-xs text-muted-foreground italic mt-1">
                * Análise feita por IA
              </p>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Resultado */}
            {resultado && (
              <div className="rounded-lg border bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-6 space-y-4 mb-4">
                {/* Cabeçalho do Resultado */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h4 className="font-bold text-lg">Análise Completa</h4>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Exibir conteúdo do output em Markdown (formato direto do endpoint) */}
                {resultado.output && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Microscope className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        Relatório Completo
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-card border">
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none"
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {resultado.output.split('\n').map((line, index) => {
                          // Processar títulos Markdown
                          if (line.startsWith('## ')) {
                            return (
                              <h2 key={index} className="text-lg font-bold mt-6 mb-3 text-orange-600 dark:text-orange-400">
                                {line.replace('## ', '')}
                              </h2>
                            );
                          }
                          if (line.startsWith('### ')) {
                            return (
                              <h3 key={index} className="text-base font-semibold mt-4 mb-2 text-orange-500 dark:text-orange-300">
                                {line.replace('### ', '')}
                              </h3>
                            );
                          }
                          // Processar linhas com bullets
                          if (line.trim().startsWith('- ')) {
                            return (
                              <p key={index} className="text-sm leading-relaxed ml-4 my-1">
                                • {line.replace(/^- /, '')}
                              </p>
                            );
                          }
                          // Processar separadores
                          if (line.trim() === '---') {
                            return <hr key={index} className="my-4 border-border" />;
                          }
                          // Processar linhas normais
                          if (line.trim() === '') {
                            return <div key={index} className="h-2" />;
                          }
                          // Detectar linhas com emojis de alerta
                          if (line.includes('⚠️')) {
                            return (
                              <p key={index} className="text-sm leading-relaxed my-2 font-semibold text-amber-600 dark:text-amber-400">
                                {line}
                              </p>
                            );
                          }
                          // Detectar linhas com marcadores especiais
                          if (line.includes('**') || line.includes('Status:') || line.includes('Significado:')) {
                            const boldText = line.replace(/\*\*(.*?)\*\*/g, '$1');
                            return (
                              <p key={index} className="text-sm leading-relaxed my-2">
                                <span className="font-semibold">{boldText}</span>
                              </p>
                            );
                          }
                          return (
                            <p key={index} className="text-sm leading-relaxed my-1">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Formato estruturado (caso venha no formato antigo) */}
                {!resultado.output && resultado.analise && (
                  <>
                    {/* Análise Geral */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Microscope className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          Análise Geral
                        </span>
                      </div>
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {resultado.analise}
                        </p>
                      </div>
                    </div>

                    {/* Valores Encontrados */}
                    {resultado.valores_encontrados && resultado.valores_encontrados.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-semibold text-muted-foreground">
                              Valores Encontrados
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                            {resultado.valores_encontrados.map((valor, index) => (
                              <p key={index} className="text-sm leading-relaxed">
                                • {valor}
                              </p>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Valores Alterados */}
                    {resultado.valores_alterados && resultado.valores_alterados.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-semibold text-muted-foreground">
                              Valores Alterados
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                            {resultado.valores_alterados.map((valor, index) => (
                              <p key={index} className="text-sm leading-relaxed text-amber-700 dark:text-amber-400">
                                ⚠ {valor}
                              </p>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Interpretação */}
                    {resultado.interpretacao && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground">
                              Interpretação Clínica
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <p className="text-sm leading-relaxed">
                              {resultado.interpretacao}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Recomendações */}
                    {resultado.recomendacoes && resultado.recomendacoes.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-semibold text-muted-foreground">
                              Recomendações
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 space-y-1">
                            {resultado.recomendacoes.map((recomendacao, index) => (
                              <p key={index} className="text-sm leading-relaxed">
                                ✓ {recomendacao}
                              </p>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Observações */}
                    {resultado.observacoes && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground">
                              Observações
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border">
                            <p className="text-sm leading-relaxed italic">
                              {resultado.observacoes}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Seção de Vincular a Paciente */}
                <Separator />
                
                {!showPatientSelect ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPatientSelect(true)}
                      className="gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Vincular a um Paciente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-4 h-4 text-primary" />
                      <h5 className="font-semibold text-sm">Vincular ao Prontuário</h5>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="patient-select">Selecione o Paciente</Label>
                      <Select 
                        value={selectedPatientId} 
                        onValueChange={setSelectedPatientId}
                        disabled={savingToPatient}
                      >
                        <SelectTrigger id="patient-select">
                          <SelectValue placeholder="Escolha um paciente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              Nenhum paciente cadastrado
                            </div>
                          ) : (
                            patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Esta análise será salva no prontuário do paciente selecionado
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPatientSelect(false);
                          setSelectedPatientId('');
                        }}
                        disabled={savingToPatient}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleVincularPaciente}
                        disabled={!selectedPatientId || savingToPatient}
                      >
                        {savingToPatient ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-2" />
                            Confirmar Vinculação
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end px-6 py-4 border-t bg-background flex-shrink-0">
            {resultado ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  onClick={handleNovaAnalise}
                >
                  <Microscope className="w-4 h-4 mr-2" />
                  Nova Análise
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || !selectedFile}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Microscope className="w-4 h-4 mr-2" />
                      Analisar Exame
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
