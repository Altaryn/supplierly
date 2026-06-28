import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "@/lib/env";

// Cliente Supabase consciente de la sesión (cookies) para Server Components y
// Server Actions: lee/refresca la sesión del usuario y permite iniciar/cerrar
// sesión. Usa la anon key (la sesión va en cookies httpOnly gestionadas por
// @supabase/ssr). En Next 15 `cookies()` es asíncrono.
export async function createServerAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        // En Server Components escribir cookies lanza; se ignora con seguridad
        // (el middleware refresca la sesión). En Server Actions sí persiste.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* noop */
        }
      },
    },
  });
}

// Usuario autenticado actual, o null. En modo demo (sin Supabase) devuelve null
// y el gate de auth no se aplica (la app queda abierta para revisar el diseño).
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
