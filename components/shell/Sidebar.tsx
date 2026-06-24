"use client";

import {
  IconRfq,
  IconUsers,
  IconBox,
  IconChart,
  IconInbox,
  IconSettings,
} from "@/components/icons";

const DECORATIVE_TIP =
  "Disponible próximamente — esta entrega implementa el módulo Proveedores.";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand" title="Supplierly">
        S
      </div>

      <button
        className="nav-item"
        data-tip="Cotizaciones"
        aria-label="Cotizaciones"
        title={DECORATIVE_TIP}
        disabled
      >
        <IconRfq />
      </button>
      <button
        className="nav-item active"
        data-tip="Proveedores"
        aria-label="Proveedores"
        aria-current="page"
        onClick={onClose}
      >
        <IconUsers />
      </button>
      <button
        className="nav-item"
        data-tip="Productos"
        aria-label="Productos"
        title={DECORATIVE_TIP}
        disabled
      >
        <IconBox />
      </button>
      <button
        className="nav-item"
        data-tip="Analíticas"
        aria-label="Analíticas"
        title={DECORATIVE_TIP}
        disabled
      >
        <IconChart />
      </button>
      <button
        className="nav-item"
        data-tip="Bandeja"
        aria-label="Bandeja"
        title={DECORATIVE_TIP}
        disabled
      >
        <IconInbox />
      </button>

      <div className="nav-spacer" />

      <button
        className="nav-item"
        data-tip="Ajustes"
        aria-label="Ajustes"
        title={DECORATIVE_TIP}
        disabled
      >
        <IconSettings />
      </button>
      <div className="nav-avatar" title="Compras">
        CV
      </div>
    </aside>
  );
}
