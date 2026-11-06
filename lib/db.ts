import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** True when the server can use the database with full rights (service-role key). */
export function isDbConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;

/** Server-only Supabase client that bypasses row level security. Never import from client code. */
export function getDb(): SupabaseClient | null {
  if (!isDbConfigured()) return null;
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
