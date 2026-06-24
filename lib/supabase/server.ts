import { cache } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Server-side read client (Server Components / Route Handlers). Anon key, no
// session cookies — the module has no auth; RLS allows public read. Wrapped in
// cache() so one request reuses a single client.
export const createReadClient = cache(() =>
  createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
);
