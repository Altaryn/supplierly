import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { IconLock } from "@/components/icons";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // En modo demo no hay login: la app queda abierta.
  if (!isSupabaseConfigured()) redirect("/proveedores");
  // Si ya hay sesión, al módulo.
  const user = await getCurrentUser();
  if (user) redirect("/proveedores");

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">
            <IconLock sw={2} />
          </span>
          <div className="login-title">Supplierly</div>
          <div className="login-sub">Maestro de Proveedores · acceso restringido</div>
        </div>

        <LoginForm />

        <div className="login-foot">
          Solo usuarios registrados. Si no tienes acceso, contacta al
          administrador.
        </div>
      </div>
    </div>
  );
}
