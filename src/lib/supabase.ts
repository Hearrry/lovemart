import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const key =
  (
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  )?.trim() ?? "";

/** True once the project credentials are filled into .env */
export const isSupabaseConfigured = Boolean(url && key);

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      url || "https://placeholder.supabase.co",
      key || "placeholder-key",
      {
        auth: {
          persistSession: typeof window !== "undefined",
          autoRefreshToken: typeof window !== "undefined",
          detectSessionInUrl: typeof window !== "undefined",
        },
      },
    );
  }
  return supabaseInstance;
};

// For backward compatibility in browser context
export const supabase: SupabaseClient = typeof window !== "undefined" 
  ? getSupabaseClient() 
  : (null as unknown as SupabaseClient);
