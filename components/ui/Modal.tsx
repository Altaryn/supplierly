"use client";

import { useEffect } from "react";

// Envoltorio de modal: scrim + caja, con cierre por ESC y click en el fondo.
// Reproduce .modal-scrim(.open) > .modal del mockup (animación de entrada).
export function Modal({
  open,
  onClose,
  size,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  size?: "lg";
  children: React.ReactNode;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`modal-scrim${open ? " open" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal${size === "lg" ? " modal-lg" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {open ? children : null}
      </div>
    </div>
  );
}
