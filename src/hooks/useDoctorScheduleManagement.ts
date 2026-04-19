import { useEffect, useState } from 'react';
import {
  useDoctorSchedule,
  type DoctorSchedule as ScheduleType,
} from '@/hooks/useDoctorSchedule';
import { getSupabaseClient } from '@/lib/supabaseClientLoader';
import { toast } from 'sonner';

export const DOCTOR_SCHEDULE_DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terca-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sabado' },
];

type ScheduleFieldValue = ScheduleType[keyof ScheduleType];

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function createDefaultSchedule(dayOfWeek: number, doctorId: string, isActive: boolean): ScheduleType {
  return {
    doctor_id: doctorId,
    day_of_week: dayOfWeek,
    start_time: '08:00',
    end_time: '18:00',
    appointment_duration: 30,
    break_start_time: '12:00',
    break_end_time: '13:00',
    is_active: isActive,
  };
}

export function useDoctorScheduleManagement(doctorId?: string) {
  const { schedules, loading, saveAllSchedules } = useDoctorSchedule(doctorId || '');
  const [doctorName, setDoctorName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [localSchedules, setLocalSchedules] = useState<Record<number, ScheduleType>>({});

  useEffect(() => {
    const fetchDoctorName = async () => {
      if (!doctorId) return;
      const supabase = await getSupabaseClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', doctorId)
        .single();

      if (!error && data) {
        setDoctorName(data.name);
      }
    };

    void fetchDoctorName();
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    const scheduleMap: Record<number, ScheduleType> = {};

    if (schedules.length > 0) {
      schedules.forEach((schedule) => {
        scheduleMap[schedule.day_of_week] = schedule;
      });

      DOCTOR_SCHEDULE_DAYS.forEach((day) => {
        if (!scheduleMap[day.value]) {
          scheduleMap[day.value] = createDefaultSchedule(day.value, doctorId, false);
        }
      });
    } else if (!loading) {
      DOCTOR_SCHEDULE_DAYS.forEach((day) => {
        scheduleMap[day.value] = createDefaultSchedule(
          day.value,
          doctorId,
          day.value >= 1 && day.value <= 5
        );
      });
    }

    if (Object.keys(scheduleMap).length > 0) {
      setLocalSchedules(scheduleMap);
    }
  }, [doctorId, loading, schedules]);

  const handleScheduleChange = (
    dayOfWeek: number,
    field: keyof ScheduleType,
    value: ScheduleFieldValue
  ) => {
    setLocalSchedules((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!doctorId) return;

    setIsSaving(true);
    try {
      await saveAllSchedules(localSchedules);
      toast.success('Horarios salvos com sucesso!');
    } catch (error: unknown) {
      toast.error(`Erro ao salvar horarios: ${getErrorMessage(error, 'Erro desconhecido')}`);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    doctorName,
    handleSaveAll,
    handleScheduleChange,
    isSaving,
    loading,
    localSchedules,
    schedules,
  };
}
