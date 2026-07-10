"use client";

import { UserMenu } from "./UserMenu";
import { IconMenu, IconSearch, IconBell, IconPlus } from "@/components/icons";
import { EVT } from "@/lib/events";

export function Topbar({
  onToggleNav,
  userEmail,
}: {
  onToggleNav: () => void;
  userEmail?: string;
}) {
  const emit = (name: string) =>
    window.dispatchEvent(new CustomEvent(name));

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="btn-icon nav-toggle"
          aria-label="Menú"
          onClick={onToggleNav}
        >
          <IconMenu />
        </button>
        <div className="breadcrumb">
          <span className="crumb-section">Compras</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">Proveedores</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="search-trigger"
          aria-label="Buscar"
          onClick={() => emit(EVT.focusSearch)}
        >
          <IconSearch />
          <span className="search-label">Buscar proveedor…</span>
          <span className="kbd-group">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </button>
        <button
          className="btn-icon hide-mobile"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <IconBell />
        </button>
        <button
          className="btn btn-primary btn-new"
          onClick={() => emit(EVT.newSupplier)}
        >
          <IconPlus sw={2.25} />
          <span className="btn-label">Nuevo proveedor</span>
        </button>
        {userEmail ? <UserMenu email={userEmail} /> : null}
      </div>
    </header>
  );
}
