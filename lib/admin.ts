import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function getAdminContext() {
  if (!isSupabaseConfigured()) {
    return { configured: false as const, user: null, supabase: null, role: null, email: null };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { configured: false as const, user: null, supabase: null, role: null, email: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { configured: true as const, user: null, supabase, role: null, email: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    configured: true as const,
    user,
    supabase,
    role: profile?.role ?? null,
    email: profile?.email ?? user.email,
  };
}
