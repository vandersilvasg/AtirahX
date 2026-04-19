import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, getSupabaseModule } from '@/lib/supabaseClientLoader';

interface SystemSetting {
  key: string;
  value: string;
}

interface UseSystemSettingsReturn {
  settings: Record<string, string>;
  loading: boolean;
  error: Error | null;
  refreshSettings: () => Promise<void>;
}

export const useSystemSettings = (key?: string): UseSystemSettingsReturn => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = await getSupabaseClient();
      let query = supabase.from('system_settings').select('key, value').eq('is_active', true);
      if (key) {
        query = query.eq('key', key).single();
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      if (key && data && !Array.isArray(data)) {
        setSettings({ [data.key]: data.value });
      } else if (Array.isArray(data)) {
        const settingsObj = data.reduce((acc, item: SystemSetting) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>);
        setSettings(settingsObj);
      } else {
        setSettings({});
      }
    } catch (err) {
      console.error('Erro ao buscar configuracoes do sistema:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void fetchSettings();

    let isActive = true;
    let cleanup = () => {};

    void (async () => {
      const { supabase } = await getSupabaseModule();
      if (!isActive) return;

      const channel = supabase
        .channel('system_settings_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_settings' },
          (payload) => {
            console.log('Configuracao do sistema alterada:', payload);
            void fetchSettings();
          }
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
      };
    })();

    return () => {
      isActive = false;
      cleanup();
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refreshSettings: fetchSettings,
  };
};

export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    console.log(`Buscando configuracao: ${key}`);
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error(`Configuracao '${key}' nao encontrada:`, error);
      return null;
    }

    return data.value;
  } catch (err) {
    console.error(`Erro ao buscar configuracao '${key}':`, err);
    return null;
  }
}

export async function getAllSystemSettings(): Promise<Record<string, string>> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('is_active', true);

    if (error || !data) {
      console.error('Erro ao buscar configuracoes do sistema:', error);
      return {};
    }

    return data.reduce((acc, item: SystemSetting) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (err) {
    console.error('Erro ao buscar configuracoes do sistema:', err);
    return {};
  }
}
