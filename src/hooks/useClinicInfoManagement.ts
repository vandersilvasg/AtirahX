import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';
import { isMissingColumnError } from '@/lib/dashboardMetrics';
import {
  buildDoctorPrices,
  buildDoctorTeam,
  deriveSelectedDoctorIds,
  EMPTY_CLINIC_INFO,
  formatConsultationPrice,
  getClinicInfoErrorMessage,
  mapDoctorProfiles,
  normalizePriceInput,
  type ClinicInfoRow,
  type DoctorProfile,
  type DoctorScheduleRow,
} from '@/lib/clinicInfoManagement';

export function useClinicInfoManagement() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfoRow | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [doctorPrices, setDoctorPrices] = useState<Record<string, number>>({});

  const emptyInfo = useMemo<ClinicInfoRow>(() => EMPTY_CLINIC_INFO, []);

  const selectedDoctors = useMemo(
    () => doctors.filter((doctor) => selectedDoctorIds.includes(doctor.id)),
    [doctors, selectedDoctorIds]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase
          .from('clinic_info')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const clinicData = (data as ClinicInfoRow | null) ?? emptyInfo;
        setClinicInfo(clinicData);
        setSelectedDoctorIds(Array.isArray(clinicData.doctor_ids) ? clinicData.doctor_ids : []);
      } catch (error: unknown) {
        console.error('Erro ao carregar informacoes da clinica:', error);
        toast.error(getClinicInfoErrorMessage(error, 'Erro ao carregar informacoes da clinica'));
        setClinicInfo(emptyInfo);
      } finally {
        setLoading(false);
      }
    };

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const supabase = await getSupabaseClient();
        const doctorsWithPrice = await supabase
          .from('profiles')
          .select('id, name, email, specialization, role, consultation_price')
          .eq('role', 'doctor')
          .order('name');
        let doctorRows: DoctorProfile[] = [];

        if (doctorsWithPrice.error) {
          if (isMissingColumnError(doctorsWithPrice.error, 'consultation_price')) {
            const fallbackDoctors = await supabase
              .from('profiles')
              .select('id, name, email, specialization, role')
              .eq('role', 'doctor')
              .order('name');
            if (fallbackDoctors.error) throw fallbackDoctors.error;
            doctorRows = ((fallbackDoctors.data ?? []) as DoctorProfile[]).map((doctor) => ({
              ...doctor,
              consultation_price: 0,
            }));
          } else {
            throw doctorsWithPrice.error;
          }
        } else {
          doctorRows = (doctorsWithPrice.data ?? []) as DoctorProfile[];
        }

        setDoctors(mapDoctorProfiles(doctorRows));
      } catch (error: unknown) {
        console.error('Erro ao carregar medicos:', error);
        toast.error('Erro ao carregar lista de medicos');
      } finally {
        setLoadingDoctors(false);
      }
    };

    void fetchData();
    void fetchDoctors();
  }, [emptyInfo]);

  useEffect(() => {
    const ids = deriveSelectedDoctorIds(clinicInfo, doctors, selectedDoctorIds);

    if (ids.length > 0) {
      setSelectedDoctorIds(ids);
    }
  }, [clinicInfo, doctors, selectedDoctorIds]);

  useEffect(() => {
    if (doctors.length === 0) return;

    setDoctorPrices(buildDoctorPrices(doctors, clinicInfo));
  }, [doctors, clinicInfo]);

  const handleChange = (field: keyof ClinicInfoRow, value: string) => {
    setClinicInfo((prev) => ({ ...(prev ?? emptyInfo), [field]: value }));
  };

  const handleSave = async () => {
    if (!clinicInfo) return;

    setSaving(true);
    try {
      const supabase = await getSupabaseClient();
      const payload = {
        address_line: clinicInfo.address_line || null,
        address_number: clinicInfo.address_number || null,
        neighborhood: clinicInfo.neighborhood || null,
        city: clinicInfo.city || null,
        state: clinicInfo.state || null,
        zip_code: clinicInfo.zip_code || null,
        opening_hours: clinicInfo.opening_hours || null,
        policy_scheduling: clinicInfo.policy_scheduling || null,
        policy_rescheduling: clinicInfo.policy_rescheduling || null,
        policy_cancellation: clinicInfo.policy_cancellation || null,
      };

      if (clinicInfo.id) {
        const { error } = await supabase.from('clinic_info').update(payload).eq('id', clinicInfo.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('clinic_info')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        setClinicInfo(data as ClinicInfoRow);
      }

      toast.success('Informacoes salvas com sucesso');
    } catch (error: unknown) {
      console.error('Erro ao salvar informacoes da clinica:', error);
      toast.error(getClinicInfoErrorMessage(error, 'Erro ao salvar informacoes'));
    } finally {
      setSaving(false);
    }
  };

  const toggleDoctor = (doctorId: string, checked: boolean) => {
    setSelectedDoctorIds((prev) => {
      const next = new Set(prev);

      if (checked) {
        next.add(doctorId);
      } else {
        next.delete(doctorId);
      }

      return Array.from(next);
    });
  };

  const handlePriceChange = (doctorId: string, value: string) => {
    const numericValue = normalizePriceInput(value);
    setDoctorPrices((prev) => ({ ...prev, [doctorId]: numericValue }));
  };

  const formatPrice = formatConsultationPrice;

  const enableDoctorSchedules = async (doctorIds: string[], warningMessage: string) => {
    if (doctorIds.length === 0) return;

    const supabase = await getSupabaseClient();
    const { data: existingSchedules, error: fetchError } = await supabase
      .from('doctor_schedules')
      .select('doctor_id')
      .in('doctor_id', doctorIds);

    if (fetchError) {
      console.error('Erro ao buscar schedules existentes:', fetchError);
      return;
    }

    const existingDoctorIds = ((existingSchedules || []) as DoctorScheduleRow[]).map(
      (schedule) => schedule.doctor_id
    );

    if (existingDoctorIds.length === 0) return;

    const { error: enableError } = await supabase
      .from('doctor_schedules')
      .update({
        seg_ativo: true,
        ter_ativo: true,
        qua_ativo: true,
        qui_ativo: true,
        sex_ativo: true,
        sab_ativo: false,
        dom_ativo: false,
      })
      .in('doctor_id', existingDoctorIds);

    if (enableError) {
      console.error('Erro ao habilitar schedules:', enableError);
      toast.warning(warningMessage);
    }
  };

  const handleSavePrices = async () => {
    try {
      const supabase = await getSupabaseClient();
      const updates = Object.entries(doctorPrices).map(([doctorId, price]) =>
        supabase.from('profiles').update({ consultation_price: price }).eq('id', doctorId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((result) => result.error);

      if (errors.length > 0) {
        const missingPriceColumn = errors.some((result) =>
          isMissingColumnError(result.error, 'consultation_price')
        );
        if (missingPriceColumn) {
          toast.warning('Preco de consulta indisponivel neste banco. O restante da equipe continua funcionando.');
          return;
        }
        console.error('Erros ao salvar precos:', errors);
        toast.error('Erro ao salvar alguns precos de consulta');
        return;
      }

      if (clinicInfo?.id && selectedDoctorIds.length > 0) {
        const updatedTeam = buildDoctorTeam(doctors, selectedDoctorIds, doctorPrices);
        const { error: teamError } = await supabase
          .from('clinic_info')
          .update({ doctor_team: updatedTeam })
          .eq('id', clinicInfo.id);

        if (teamError) {
          console.error('Erro ao atualizar doctor_team:', teamError);
          toast.warning('Precos salvos, mas houve erro ao atualizar a equipe');
          return;
        }
      }

      toast.success('Precos de consulta salvos com sucesso');
    } catch (error: unknown) {
      console.error('Erro ao salvar precos:', error);
      toast.error(getClinicInfoErrorMessage(error, 'Erro ao salvar precos de consulta'));
    }
  };

  const handleSaveTeam = async () => {
    const team = buildDoctorTeam(doctors, selectedDoctorIds, doctorPrices);
    const currentDoctorIds = clinicInfo?.doctor_ids ?? [];
    const removedDoctorIds = currentDoctorIds.filter(
      (doctorId) => !selectedDoctorIds.includes(doctorId)
    );
    const addedDoctorIds = selectedDoctorIds.filter(
      (doctorId) => !currentDoctorIds.includes(doctorId)
    );

    if (!clinicInfo || clinicInfo.id) {
      try {
        const supabase = await getSupabaseClient();
        const payload: Pick<ClinicInfoRow, 'doctor_ids' | 'doctor_team'> = {
          doctor_ids: selectedDoctorIds,
          doctor_team: team,
        };

        const { error } = await supabase
          .from('clinic_info')
          .update(payload)
          .eq('id', clinicInfo?.id);

        if (error) throw error;

        if (removedDoctorIds.length > 0) {
          const { error: disableError } = await supabase
            .from('doctor_schedules')
            .update({
              seg_ativo: false,
              ter_ativo: false,
              qua_ativo: false,
              qui_ativo: false,
              sex_ativo: false,
              sab_ativo: false,
              dom_ativo: false,
            })
            .in('doctor_id', removedDoctorIds);

          if (disableError) {
            console.error('Erro ao desabilitar schedules:', disableError);
            toast.warning(
              'Equipe atualizada, mas alguns horarios podem nao ter sido desabilitados'
            );
          }
        }

        await enableDoctorSchedules(
          addedDoctorIds,
          'Equipe atualizada, mas alguns horarios podem nao ter sido habilitados'
        );

        setClinicInfo((prev) =>
          prev
            ? {
                ...prev,
                doctor_ids: selectedDoctorIds,
                doctor_team: team,
              }
            : prev
        );

        toast.success('Equipe medica atualizada');
      } catch (error: unknown) {
        console.error('Erro ao salvar equipe medica:', error);
        toast.error(getClinicInfoErrorMessage(error, 'Erro ao salvar equipe medica'));
      }

      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('clinic_info')
        .insert({ doctor_ids: selectedDoctorIds, doctor_team: team })
        .select('*')
        .single();

      if (error) throw error;
      setClinicInfo(data as ClinicInfoRow);

      await enableDoctorSchedules(
        selectedDoctorIds,
        'Equipe salva, mas alguns horarios podem nao ter sido habilitados'
      );

      toast.success('Equipe medica salva');
    } catch (error: unknown) {
      console.error('Erro ao salvar equipe medica:', error);
      toast.error(getClinicInfoErrorMessage(error, 'Erro ao salvar equipe medica'));
    }
  };

  return {
    clinicInfo,
    doctorPrices,
    doctors,
    formatPrice,
    handleChange,
    handlePriceChange,
    handleSave,
    handleSavePrices,
    handleSaveTeam,
    loading,
    loadingDoctors,
    saving,
    selectedDoctorIds,
    selectedDoctors,
    toggleDoctor,
  };
}
