import { useMemo, useState, type FormEvent } from 'react';
import { useRealtimeList } from '@/hooks/useRealtimeList';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';

export interface PrePatient {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  health_insurance: string | null;
  status: string | null;
  area_interest: string | null;
  created_at: string;
}

export type PrePatientFormData = {
  name: string;
  email: string;
  phone: string;
  health_insurance: string;
  status: string;
  area_interest: string;
};

const EMPTY_FORM: PrePatientFormData = {
  name: '',
  email: '',
  phone: '',
  health_insurance: '',
  status: '',
  area_interest: '',
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
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

export function usePrePatientsManagement() {
  const { data, loading, error } = useRealtimeList<PrePatient>({
    table: 'pre_patients',
    order: { column: 'created_at', ascending: false },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrePatientFormData>(EMPTY_FORM);

  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return data.filter((prePatient) => {
      return (
        (prePatient.name ?? '').toLowerCase().includes(search) ||
        (prePatient.email ?? '').toLowerCase().includes(search) ||
        (prePatient.phone ?? '').includes(search) ||
        (prePatient.health_insurance ?? '').toLowerCase().includes(search) ||
        (prePatient.status ?? '').toLowerCase().includes(search) ||
        (prePatient.area_interest ?? '').toLowerCase().includes(search)
      );
    });
  }, [data, searchTerm]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEdit = (prePatient: PrePatient) => {
    setSelectedId(prePatient.id);
    setFormData({
      name: prePatient.name ?? '',
      email: prePatient.email ?? '',
      phone: prePatient.phone ?? '',
      health_insurance: prePatient.health_insurance ?? '',
      status: prePatient.status ?? '',
      area_interest: prePatient.area_interest ?? '',
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const supabase = await getSupabaseClient();
      const { error: insertError } = await supabase.from('pre_patients').insert({
        name: formData.name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        health_insurance: formData.health_insurance || null,
        status: formData.status || null,
        area_interest: formData.area_interest || null,
      });

      if (insertError) throw insertError;

      toast.success('Pre paciente criado.');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Erro ao criar pre paciente'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;

    setIsSaving(true);
    try {
      const supabase = await getSupabaseClient();
      const { error: updateError } = await supabase
        .from('pre_patients')
        .update({
          name: formData.name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          health_insurance: formData.health_insurance || null,
          status: formData.status || null,
          area_interest: formData.area_interest || null,
        })
        .eq('id', selectedId);

      if (updateError) throw updateError;

      toast.success('Pre paciente atualizado.');
      setIsEditDialogOpen(false);
      setSelectedId(null);
      resetForm();
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Erro ao atualizar pre paciente'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = await getSupabaseClient();
      const { error: deleteError } = await supabase.from('pre_patients').delete().eq('id', id);
      if (deleteError) throw deleteError;
      toast.success('Pre paciente removido.');
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Erro ao remover'));
    }
  };

  return {
    error,
    filtered,
    formData,
    handleCreate,
    handleDelete,
    handleUpdate,
    isCreateDialogOpen,
    isEditDialogOpen,
    isSaving,
    loading,
    openCreate,
    openEdit,
    searchTerm,
    setFormData,
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    setSearchTerm,
  };
}


