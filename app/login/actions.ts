"use server";

import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/env";

// Estado del formulario de login. El tipo se define en un módulo aparte porque
// los archivos "use server" solo pueden exportar funciones async.

// Inicia sesión con email + contraseña. Compatible con useActionState.
export async function signInAction(
  _prev: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "La autenticación no está disponible en modo demo." };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Ingresa tu email y contraseña." };
  }

  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  // Éxito: redirige al módulo (redirect() lanza, va fuera del try/catch).
  redirect("/proveedores");
}

// Cierra la sesión y vuelve al login.
export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerAuthClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
