type SupabaseModule = typeof import('@/lib/supabaseClient');

let supabaseModulePromise: Promise<SupabaseModule> | null = null;

export function getSupabaseModule() {
  if (!supabaseModulePromise) {
    supabaseModulePromise = import('@/lib/supabaseClient');
  }

  return supabaseModulePromise;
}

export async function getSupabaseClient() {
  const { supabase } = await getSupabaseModule();
  return supabase;
}
