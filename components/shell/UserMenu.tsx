"use client";

import { signOutAction } from "@/app/login/actions";
import { IconLogout } from "@/components/icons";

// Identidad del usuario + cerrar sesión en la topbar. El botón envía un Server
// Action que cierra la sesión y redirige a /login.
export function UserMenu({ email }: { email: string }) {
  const initial = (email[0] || "?").toUpperCase();
  return (
    <div className="user-menu">
      <span className="user-avatar" aria-hidden="true">
        {initial}
      </span>
      <span className="user-email" title={email}>
        {email}
      </span>
      <form action={signOutAction}>
        <button
          className="btn-icon"
          type="submit"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <IconLogout />
        </button>
      </form>
    </div>
  );
}
