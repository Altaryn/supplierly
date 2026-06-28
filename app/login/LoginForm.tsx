"use client";

import { useActionState } from "react";
import { signInAction } from "./actions";
import { IconAlert } from "@/components/icons";

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, { error: "" });

  return (
    <form action={action} className="login-form">
      <div className="field">
        <label className="field-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          className="input"
          placeholder="tu@empresa.cl"
          autoComplete="email"
          required
          autoFocus
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="login-password">
          Contraseña
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          className="input"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error ? (
        <div className="login-error" role="alert">
          <IconAlert sw={2} />
          <span>{state.error}</span>
        </div>
      ) : null}

      <button className="btn btn-primary login-submit" type="submit" disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
