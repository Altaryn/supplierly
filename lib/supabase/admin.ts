import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/env";

// Privileged server-only client. Used by Server Actions for writes and Storage
// uploads. The service-role key bypasses RLS, so it MUST never reach the client
// bundle — the "server-only" import guards against accidental client imports.
//
// Returns null when Supabase isn't fully configured, letting callers fall back
// to demo mode instead of throwing.
export function createAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured() || !hasServiceRole()) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
