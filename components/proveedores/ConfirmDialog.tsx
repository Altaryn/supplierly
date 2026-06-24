"use client";

import { useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { IconX, IconAlert, IconTrash } from "@/components/icons";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Modal open={open} onClose={onClose}>
      <header className="modal-header">
        <div className="modal-title">
          <h2>{title}</h2>
          <p>Esta acción no se puede deshacer.</p>
        </div>
        <button className="btn-icon" aria-label="Cerrar" onClick={onClose}>
          <IconX />
        </button>
      </header>
      <div className="modal-body">
        <div className="prov-confirm-body">
          <div className="prov-confirm-icon">
            <IconAlert />
          </div>
          <p>{message}</p>
        </div>
      </div>
      <footer className="modal-footer">
        <div className="validation-hint">
          <span />
        </div>
        <div className="modal-footer-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            disabled={pending}
            onClick={() => startTransition(async () => await onConfirm())}
          >
            <IconTrash />
            {pending ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </footer>
    </Modal>
  );
}
