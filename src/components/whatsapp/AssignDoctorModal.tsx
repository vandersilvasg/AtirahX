import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AssignDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  patientId: string;
  isPrePatient: boolean;
  currentPatientName?: string;
  onSuccess?: () => void;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function AssignDoctorModal({
  open,
  onOpenChange,
  sessionId,
  patientId,
  isPrePatient,
  currentPatientName,
  onSuccess,
}: AssignDoctorModalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    if (open) {
      fetchDoctors();
      setPatientName(currentPatientName || '');
      setSelectedDoctorId('');
    }
  }, [open, currentPatientName]);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, specialization')
        .eq('role', 'doctor')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: unknown) {
      console.error('Erro ao carregar mÃ©dicos:', error);
      toast.error(getErrorMessage(error, 'Erro ao carregar lista de mÃ©dicos'));
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDoctorId) {
      toast.error('Por favor, selecione um mÃ©dico');
      return;
    }

    if (isPrePatient && !patientName.trim()) {
      toast.error('Por favor, informe o nome do paciente');
      return;
    }

    setLoading(true);
    try {
      if (isPrePatient) {
        const supabase = await getSupabaseClient();
        const { error: updateError } = await supabase
          .from('pre_patients')
          .update({
            name: patientName.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', patientId);

        if (updateError) throw updateError;

        await new Promise((resolve) => setTimeout(resolve, 500));

        const { error: assignError } = await supabase
          .from('patient_doctors')
          .insert({
            patient_id: patientId,
            doctor_id: selectedDoctorId,
            is_primary: true,
          });

        if (assignError) {
          if (assignError.code === '23505') {
            const { error: updateAssignError } = await supabase
              .from('patient_doctors')
              .update({
                doctor_id: selectedDoctorId,
                is_primary: true,
              })
              .eq('patient_id', patientId)
              .eq('doctor_id', selectedDoctorId);

            if (updateAssignError) throw updateAssignError;
          } else {
            throw assignError;
          }
        }

        toast.success('Paciente promovido e mÃ©dico atribuÃ­do com sucesso!');
      } else {
        const { data: existing } = await supabase
          .from('patient_doctors')
          .select('id')
          .eq('patient_id', patientId)
          .eq('doctor_id', selectedDoctorId)
          .single();

        if (existing) {
          toast.info('Este mÃ©dico jÃ¡ estÃ¡ atribuÃ­do a este paciente');
        } else {
          const { error: assignError } = await supabase
            .from('patient_doctors')
            .insert({
              patient_id: patientId,
              doctor_id: selectedDoctorId,
              is_primary: true,
            });

          if (assignError) throw assignError;
          toast.success('MÃ©dico atribuÃ­do com sucesso!');
        }
      }

      console.debug('SessÃ£o processada para atribuiÃ§Ã£o de mÃ©dico:', sessionId);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Erro ao atribuir mÃ©dico:', error);
      toast.error(getErrorMessage(error, 'Erro ao atribuir mÃ©dico'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isPrePatient ? 'Promover e Atribuir MÃ©dico' : 'Atribuir MÃ©dico'}
          </DialogTitle>
          <DialogDescription>
            {isPrePatient
              ? 'Informe o nome completo do paciente e selecione o mÃ©dico responsÃ¡vel para promover este prÃ©-paciente.'
              : 'Selecione o mÃ©dico que serÃ¡ responsÃ¡vel por este paciente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPrePatient && (
            <div className="space-y-2">
              <Label htmlFor="patient-name">Nome Completo do Paciente *</Label>
              <Input
                id="patient-name"
                placeholder="Ex: JoÃ£o da Silva"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="doctor">MÃ©dico ResponsÃ¡vel *</Label>
            {loadingDoctors ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={selectedDoctorId}
                onValueChange={setSelectedDoctorId}
                disabled={loading}
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Selecione um mÃ©dico" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                      {doctor.specialization && ` - ${doctor.specialization}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {doctors.length === 0 && !loadingDoctors && (
              <p className="text-sm text-muted-foreground">
                Nenhum mÃ©dico cadastrado no sistema
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={loading || loadingDoctors}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : isPrePatient ? (
              'Promover e Atribuir'
            ) : (
              'Atribuir MÃ©dico'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
