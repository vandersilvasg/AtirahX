import { useMemo, useState, type FormEvent } from 'react';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  avatar_url?: string;
  next_appointment_date?: string;
  created_at: string;
}

export type PatientFormData = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
};

const EMPTY_FORM: PatientFormData = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  birth_date: '',
  gender: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

export function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function calculateAge(birthDate?: string) {
  if (!birthDate) return null;
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

export function isValidDate(dateString?: string | null) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatWhatsappToDDDNumber(raw?: string | null) {
  if (!raw) return '-';
  const atIdx = raw.indexOf('@');
  const withoutDomain = atIdx >= 0 ? raw.slice(0, atIdx) : raw;
  const digits = withoutDomain.replace(/\D/g, '');
  if (!digits) return '-';
  const local = digits.length > 11 ? digits.slice(-11) : digits;
  if (local.length < 10) return local;
  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  return `(${ddd}) ${number}`;
}

export function usePatientsManagement() {
  const { data: patients, loading, error } = useRealtimeList<Patient>({
    table: 'patients',
    order: { column: 'created_at', ascending: false },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>(EMPTY_FORM);

  const filteredPatients = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return patients.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(search) ||
        patient.email?.toLowerCase().includes(search) ||
        patient.phone?.includes(search) ||
        patient.cpf?.includes(search)
      );
    });
  }, [patients, searchTerm]);

  const handleCreatePatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);

    try {
      const supabase = await getSupabaseClient();
      const { error: insertError } = await supabase.from('patients').insert({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        cpf: formData.cpf || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
      });

      if (insertError) throw insertError;

      toast.success('Paciente cadastrado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData(EMPTY_FORM);
    } catch (error: unknown) {
      console.error('Erro ao criar paciente:', error);
      toast.error(getErrorMessage(error, 'Erro ao cadastrar paciente'));
    } finally {
      setIsCreating(false);
    }
  };

  return {
    error,
    filteredPatients,
    formData,
    handleCreatePatient,
    isCreateDialogOpen,
    isCreating,
    loading,
    searchTerm,
    selectedPatientId,
    setFormData,
    setIsCreateDialogOpen,
    setSearchTerm,
    setSelectedPatientId,
  };
}


