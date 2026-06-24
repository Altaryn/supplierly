"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// Shell de la app: grilla sidebar + columna principal (topbar + contenido).
// Gestiona el estado del sidebar off-canvas en móvil (≤720px), que el CSS
// portado anima vía .sidebar.open / .mobile-nav-scrim.open.
export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <div className="app">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="main">
          <Topbar onToggleNav={() => setNavOpen((v) => !v)} />
          <div className="workarea">{children}</div>
        </main>
      </div>
      <div
        className={`mobile-nav-scrim${navOpen ? " open" : ""}`}
        onClick={() => setNavOpen(false)}
      />
    </>
  );
}
