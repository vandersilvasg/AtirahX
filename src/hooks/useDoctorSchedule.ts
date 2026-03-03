import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Interface para a estrutura horizontal do banco (1 linha por mÃ©dico)
export interface DoctorScheduleDB {
  id?: string;
  doctor_id: string;
  appointment_duration: number;
  [key: string]: string | number | boolean | null | undefined;
  
  // Segunda-feira
  seg_inicio?: string;
  seg_pausa_inicio?: string;
  seg_pausa_fim?: string;
  seg_fim?: string;
  seg_ativo?: boolean;
  
  // TerÃ§a-feira
  ter_inicio?: string;
  ter_pausa_inicio?: string;
  ter_pausa_fim?: string;
  ter_fim?: string;
  ter_ativo?: boolean;
  
  // Quarta-feira
  qua_inicio?: string;
  qua_pausa_inicio?: string;
  qua_pausa_fim?: string;
  qua_fim?: string;
  qua_ativo?: boolean;
  
  // Quinta-feira
  qui_inicio?: string;
  qui_pausa_inicio?: string;
  qui_pausa_fim?: string;
  qui_fim?: string;
  qui_ativo?: boolean;
  
  // Sexta-feira
  sex_inicio?: string;
  sex_pausa_inicio?: string;
  sex_pausa_fim?: string;
  sex_fim?: string;
  sex_ativo?: boolean;
  
  // SÃ¡bado
  sab_inicio?: string;
  sab_pausa_inicio?: string;
  sab_pausa_fim?: string;
  sab_fim?: string;
  sab_ativo?: boolean;
  
  // Domingo
  dom_inicio?: string;
  dom_pausa_inicio?: string;
  dom_pausa_fim?: string;
  dom_fim?: string;
  dom_ativo?: boolean;
  
  created_at?: string;
  updated_at?: string;
}

// Interface para a estrutura vertical usada pelo componente (compatibilidade)
export interface DoctorSchedule {
  id?: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  appointment_duration: number;
  break_start_time?: string;
  break_end_time?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Mapeamento de day_of_week para prefixos das colunas
const DAY_PREFIXES: Record<number, string> = {
  0: 'dom', // Domingo
  1: 'seg', // Segunda
  2: 'ter', // TerÃ§a
  3: 'qua', // Quarta
  4: 'qui', // Quinta
  5: 'sex', // Sexta
  6: 'sab', // SÃ¡bado
};

const asString = (value: string | number | boolean | null | undefined): string | undefined =>
  typeof value === 'string' ? value : undefined;

const asBoolean = (value: string | number | boolean | null | undefined): boolean =>
  typeof value === 'boolean' ? value : false;

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/**
 * Converte da estrutura horizontal do banco (1 linha) para vertical (array de 7 dias)
 */
function dbToSchedules(dbData: DoctorScheduleDB | null): DoctorSchedule[] {
  if (!dbData) return [];
  
  const schedules: DoctorSchedule[] = [];
  
  // Para cada dia da semana (0-6)
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
    const prefix = DAY_PREFIXES[dayOfWeek];
    
    schedules.push({
      id: dbData.id,
      doctor_id: dbData.doctor_id,
      day_of_week: dayOfWeek,
      start_time: asString(dbData[`${prefix}_inicio`]) || '08:00',
      end_time: asString(dbData[`${prefix}_fim`]) || '18:00',
      appointment_duration: dbData.appointment_duration || 30,
      break_start_time: asString(dbData[`${prefix}_pausa_inicio`]) || undefined,
      break_end_time: asString(dbData[`${prefix}_pausa_fim`]) || undefined,
      is_active: asBoolean(dbData[`${prefix}_ativo`]),
      created_at: dbData.created_at,
      updated_at: dbData.updated_at,
    });
  }
  
  return schedules;
}

/**
 * Converte de vertical (array de 7 dias) para horizontal (objeto do banco)
 */
function schedulesToDb(schedules: Record<number, DoctorSchedule>, doctorId: string): Partial<DoctorScheduleDB> {
  const dbData: Partial<DoctorScheduleDB> = {
    doctor_id: doctorId,
    appointment_duration: schedules[0]?.appointment_duration || 30,
  };
  
  // Para cada dia da semana
  Object.entries(schedules).forEach(([dayOfWeek, schedule]) => {
    const prefix = DAY_PREFIXES[parseInt(dayOfWeek)];
    
    dbData[`${prefix}_inicio`] = schedule.start_time || null;
    dbData[`${prefix}_pausa_inicio`] = schedule.break_start_time || null;
    dbData[`${prefix}_pausa_fim`] = schedule.break_end_time || null;
    dbData[`${prefix}_fim`] = schedule.end_time || null;
    dbData[`${prefix}_ativo`] = schedule.is_active || false;
  });
  
  return dbData;
}

export function useDoctorSchedule(doctorId: string) {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca os horÃ¡rios do mÃ©dico (1 linha no banco, convertida para array de 7 dias)
  const fetchSchedules = useCallback(async () => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .maybeSingle(); // Espera 0 ou 1 resultado

      if (fetchError) throw fetchError;

      // Converte de horizontal (banco) para vertical (componente)
      const schedulesArray = dbToSchedules(data);
      setSchedules(schedulesArray);
    } catch (err: unknown) {
      console.error('Erro ao buscar horÃ¡rios:', err);
      setError(getErrorMessage(err, 'Erro ao buscar horÃ¡rios'));
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // Salva TODOS os horÃ¡rios de uma vez (UPSERT na Ãºnica linha do mÃ©dico)
  const saveSchedule = async (schedule: DoctorSchedule) => {
    // Esta funÃ§Ã£o ainda recebe um schedule individual por compatibilidade,
    // mas na prÃ¡tica devemos usar saveAllSchedules
    console.warn('saveSchedule estÃ¡ deprecated, use saveAllSchedules');
    throw new Error('Use saveAllSchedules para salvar todos os dias de uma vez');
  };

  // Salva TODOS os horÃ¡rios de uma vez (funÃ§Ã£o nova)
  const saveAllSchedules = async (schedulesMap: Record<number, DoctorSchedule>) => {
    setLoading(true);
    setError(null);

    try {
      // Converte de vertical (array) para horizontal (objeto do banco)
      const dbData = schedulesToDb(schedulesMap, doctorId);

      // UPSERT: Insere se nÃ£o existe, atualiza se jÃ¡ existe
      // Baseado na constraint UNIQUE(doctor_id)
      const { error: upsertError } = await supabase
        .from('doctor_schedules')
        .upsert(dbData, {
          onConflict: 'doctor_id', // Identifica conflitos por doctor_id
          ignoreDuplicates: false, // NÃ£o ignora, faz UPDATE
        });

      if (upsertError) throw upsertError;

      // Recarrega os dados do banco
      await fetchSchedules();
    } catch (err: unknown) {
      console.error('Erro ao salvar horÃ¡rios:', err);
      setError(getErrorMessage(err, 'Erro ao salvar horÃ¡rios'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deleta o registro completo do mÃ©dico
  const deleteSchedule = async (scheduleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', scheduleId);

      if (deleteError) throw deleteError;

      // Limpa o estado local
      setSchedules([]);
    } catch (err: unknown) {
      console.error('Erro ao deletar horÃ¡rio:', err);
      setError(getErrorMessage(err, 'Erro ao deletar horÃ¡rio'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle ativo/inativo (deprecated - use saveAllSchedules)
  const toggleScheduleActive = async (scheduleId: string, isActive: boolean) => {
    console.warn('toggleScheduleActive estÃ¡ deprecated, use saveAllSchedules');
    throw new Error('Use saveAllSchedules para atualizar o status');
  };

  // Carrega os horÃ¡rios ao montar o componente
  useEffect(() => {
    if (doctorId) {
      fetchSchedules();
    }
  }, [doctorId, fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    saveSchedule, // Deprecated
    saveAllSchedules, // Nova funÃ§Ã£o principal
    deleteSchedule,
    toggleScheduleActive, // Deprecated
  };
}

