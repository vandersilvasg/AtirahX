import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Calendar, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment } from '@/components/agenda/types';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { webhookRequest } from '@/lib/webhookClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  email?: string;
  calendar_id?: string;
}

type DoctorRow = {
  id: string;
  name: string;
  specialization?: string | null;
  email?: string | null;
};

type CalendarRow = {
  profile_id: string;
  calendar_id: string | null;
  calendar_name?: string | null;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

interface EditEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

export function EditEventModal({
  open,
  onOpenChange,
  appointment,
  onEventUpdated,
  onEventDeleted,
}: EditEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Dados do evento
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [consultationType, setConsultationType] = useState('primeira_consulta');
  const [notes, setNotes] = useState('');

  // Carregar pacientes
  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, email, phone')
        .order('name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: unknown) {
      console.error('Erro ao carregar pacientes:', error);
      toast.error('Erro ao carregar lista de pacientes');
    } finally {
      setLoadingPatients(false);
    }
  };

  // Carregar mÃ©dicos
  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const supabase = await getSupabaseClient();
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, name, specialization, email')
        .eq('role', 'doctor')
        .order('name');

      if (doctorsError) throw doctorsError;

      const { data: calendarsData, error: calendarsError } = await supabase
        .from('profile_calendars')
        .select('profile_id, calendar_id, calendar_name');

      if (calendarsError) {
        console.error('[EditEventModal] Erro ao buscar calendÃ¡rios:', calendarsError);
      }

      const calendarRows = (calendarsData as CalendarRow[] | null) || [];
      const doctorsWithCalendar = ((doctorsData as DoctorRow[] | null) || []).map((doctor) => {
        const calendar = calendarRows.find((c) => c.profile_id === doctor.id);
        return {
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          email: doctor.email,
          calendar_id: calendar?.calendar_id || null,
        };
      });

      setDoctors(doctorsWithCalendar);
    } catch (error: unknown) {
      console.error('[EditEventModal] Erro ao carregar mÃ©dicos:', error);
      toast.error('Erro ao carregar lista de mÃ©dicos');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Inicializar form com dados do appointment
  useEffect(() => {
    if (open && appointment) {
      fetchPatients();
      fetchDoctors();

      // Parsear nome do paciente do appointment
      // Como appointment.patient_id contÃ©m o nome do paciente, vamos procurar pelo nome
      const patientName = appointment.patient_id;
      
      // Data e hora
      const aptDate = new Date(appointment.scheduled_at);
      const year = aptDate.getFullYear();
      const month = String(aptDate.getMonth() + 1).padStart(2, '0');
      const day = String(aptDate.getDate()).padStart(2, '0');
      const hours = String(aptDate.getHours()).padStart(2, '0');
      const minutes = String(aptDate.getMinutes()).padStart(2, '0');

      setEventDate(`${year}-${month}-${day}`);
      setStartTime(`${hours}:${minutes}`);
      
      // Calcular hora final (1 hora depois por padrÃ£o)
      const endDate = new Date(aptDate);
      endDate.setHours(endDate.getHours() + 1);
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
      setEndTime(`${endHours}:${endMinutes}`);

      setNotes(appointment.notes || '');

      // Buscar paciente pelo nome apÃ³s carregar a lista
      setTimeout(async () => {
        const supabase = await getSupabaseClient();
        const { data: patientData } = await supabase
          .from('patients')
          .select('id')
          .ilike('name', patientName)
          .limit(1)
          .single();
        
        if (patientData) {
          setSelectedPatientId(patientData.id);
        }
      }, 500);

      // Buscar mÃ©dico pelo calendar_id
      if (appointment.doctor_id) {
        setTimeout(async () => {
          const supabase = await getSupabaseClient();
          const { data: calendarData } = await supabase
            .from('profile_calendars')
            .select('profile_id')
            .eq('calendar_id', appointment.doctor_id)
            .maybeSingle();

          if (calendarData?.profile_id) {
            setSelectedDoctorId(calendarData.profile_id);
          }
        }, 500);
      }
    } else {
      // Reset form quando fecha
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setEventDate('');
      setStartTime('');
      setEndTime('');
      setConsultationType('primeira_consulta');
      setNotes('');
    }
  }, [open, appointment]);

  // Atualizar evento
  const handleUpdateEvent = async () => {
    if (!appointment) return;

    // ValidaÃ§Ãµes
    if (!selectedPatientId) {
      toast.error('Selecione um paciente');
      return;
    }
    if (!selectedDoctorId) {
      toast.error('Selecione um mÃ©dico');
      return;
    }
    if (!eventDate) {
      toast.error('Selecione uma data');
      return;
    }
    if (!startTime) {
      toast.error('Selecione o horÃ¡rio inicial');
      return;
    }
    if (!endTime) {
      toast.error('Selecione o horÃ¡rio final');
      return;
    }

    setLoading(true);
    try {
      const patient = patients.find(p => p.id === selectedPatientId);
      const doctor = doctors.find(d => d.id === selectedDoctorId);

      if (!patient) throw new Error('Paciente nÃ£o encontrado');
      if (!doctor) throw new Error('MÃ©dico nÃ£o encontrado');

      if (!doctor.calendar_id) {
        toast.error('Este mÃ©dico nÃ£o possui agenda vinculada');
        setLoading(false);
        return;
      }

      // Formatar datas
      const dataInicio = `${eventDate}T${startTime}:00`;
      const dataFinal = `${eventDate}T${endTime}:00`;

      const payload = {
        event_id: appointment.id,
        calendar_id: doctor.calendar_id, // ID da agenda do Google Calendar
        nome_paciente: patient.name,
        email_paciente: patient.email || '',
        nome_medico: doctor.name,
        email_medico: doctor.email || '',
        especialidade_medico: doctor.specialization || '',
        tipo_consulta: consultationType,
        data_inicio: dataInicio,
        data_final: dataFinal,
        notas: notes || '',
      };

      console.log('[EditEventModal] Enviando para /editar-evento');
      console.log('Event ID:', appointment.id);
      console.log('Calendar ID (Agenda):', doctor.calendar_id);
      console.log('Payload completo:', payload);

      const data = await webhookRequest<unknown>('/editar-evento', {
        method: 'POST',
        body: payload,
      });
      console.log('[EditEvent] Resposta do endpoint:', data);

      toast.success('Evento atualizado com sucesso!');
      onEventUpdated?.();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Erro ao atualizar evento:', error);
      toast.error('Erro ao atualizar evento: ' + getErrorMessage(error, 'falha inesperada'));
    } finally {
      setLoading(false);
    }
  };

  // Deletar evento
  const handleDeleteEvent = async () => {
    if (!appointment) return;

    setLoading(true);
    try {
      const payload = {
        event_id: appointment.id,
        calendar_id: appointment.doctor_id,
      };

      console.log('[DeleteEvent] Enviando dados para deletar evento:', payload);

      const data = await webhookRequest<unknown>('/apagar-evento', {
        method: 'POST',
        body: payload,
      });
      console.log('[DeleteEvent] Resposta do endpoint:', data);

      toast.success('Evento deletado com sucesso!');
      onEventDeleted?.();
      onOpenChange(false);
      setShowDeleteDialog(false);
    } catch (error: unknown) {
      console.error('Erro ao deletar evento:', error);
      toast.error('Erro ao deletar evento: ' + getErrorMessage(error, 'falha inesperada'));
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  if (!appointment) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Evento
            </DialogTitle>
            <DialogDescription>
              Atualize as informaÃ§Ãµes do evento na agenda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* SeleÃ§Ã£o de Paciente */}
            <div className="space-y-2">
              <Label htmlFor="patient">Paciente *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger id="patient" disabled={loadingPatients}>
                  <SelectValue
                    placeholder={loadingPatients ? "Carregando pacientes..." : "Selecione um paciente"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{patient.name}</span>
                        {patient.phone && (
                          <span className="text-xs text-muted-foreground">
                            {patient.phone}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {!loadingPatients && patients.length === 0 && (
                    <SelectItem value="empty" disabled>
                      Nenhum paciente cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* SeleÃ§Ã£o de MÃ©dico */}
            <div className="space-y-2">
              <Label htmlFor="doctor">MÃ©dico *</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger id="doctor" disabled={loadingDoctors}>
                  <SelectValue
                    placeholder={loadingDoctors ? "Carregando mÃ©dicos..." : "Selecione um mÃ©dico"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem
                      key={doctor.id}
                      value={doctor.id}
                      disabled={!doctor.calendar_id}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.name}</span>
                          {doctor.specialization && (
                            <span className="text-xs text-muted-foreground">
                              {doctor.specialization}
                            </span>
                          )}
                        </div>
                        {!doctor.calendar_id && (
                          <span className="text-xs text-orange-500">
                            (Sem agenda)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {!loadingDoctors && doctors.length === 0 && (
                    <SelectItem value="empty" disabled>
                      Nenhum mÃ©dico cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Consulta */}
            <div className="space-y-2">
              <Label htmlFor="consultationType">Tipo de Consulta *</Label>
              <Select value={consultationType} onValueChange={setConsultationType}>
                <SelectTrigger id="consultationType">
                  <SelectValue placeholder="Selecione o tipo de consulta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primeira_consulta">Primeira Consulta</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="avaliacao">AvaliaÃ§Ã£o</SelectItem>
                  <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data do Evento */}
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            {/* HorÃ¡rios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  HorÃ¡rio Inicial *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  HorÃ¡rio Final *
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">ObservaÃ§Ãµes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="InformaÃ§Ãµes adicionais..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
              className="mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateEvent} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar AlteraÃ§Ãµes'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmaÃ§Ã£o de exclusÃ£o */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ExclusÃ£o</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este evento? Esta aÃ§Ã£o nÃ£o pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar Evento'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

