// Whether a real Supabase backend is wired up. When false, the app runs in
// "demo mode": reads return isolated mock data and writes are simulated (not
// persisted), so the module is fully reviewable before configuring Supabase.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// Service-role key is server-only and unlocks privileged writes / Storage.
export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "supplier-docs";

// Identity used to stamp audit logs / uploads when running without auth.
export const APP_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Compras",
} as const;
