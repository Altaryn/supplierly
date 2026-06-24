"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconX, IconFile, IconDownload } from "@/components/icons";
import { FICHA_FIELD_LABELS } from "@/lib/constants";
import { EMISOR_COMPANIES, DEFAULT_EMISOR_KEY, emisorByRazon } from "@/lib/companies";
import { downloadBase64 } from "@/lib/client/files";
import { blankSupplier } from "@/lib/supplier-form";
import { generateFichaAction } from "@/app/proveedores/actions";
import type { Supplier } from "@/lib/types";

// Genera la ficha .xlsx (plantilla en blanco desde la barra, o precargada con
// los datos de un proveedor desde el drawer) y la descarga automáticamente.
export function FichaModal({
  open,
  supplier,
  onClose,
  onGenerated,
}: {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onGenerated?: (s: Supplier) => void;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [emisorKey, setEmisorKey] = useState(DEFAULT_EMISOR_KEY);
  // Preselecciona la empresa emisora según la del proveedor (si la tiene).
  useEffect(() => {
    if (open) setEmisorKey(emisorByRazon(supplier?.empresa)?.key ?? DEFAULT_EMISOR_KEY);
  }, [open, supplier]);
  const target = supplier ?? blankSupplier();
  const titular = supplier
    ? supplier.razon_social
    : "Nuevo proveedor (plantilla en blanco)";

  function generate() {
    startTransition(async () => {
      const res = await generateFichaAction(target, emisorKey);
      if (res.ok) {
        downloadBase64(res.data.base64, res.data.fileName, res.data.mimeType);
        toast(
          "success",
          "Ficha generada",
          res.demo
            ? "Descargada. Conéctate a Supabase para archivarla."
            : "Descargada y archivada en Documentos.",
        );
        if (supplier && onGenerated) onGenerated(supplier);
        onClose();
      } else {
        toast("error", "No se pudo generar", res.error);
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" labelledBy="ficha-modal-title">
      <header className="modal-header">
        <div className="modal-title">
          <h2 id="ficha-modal-title">Nueva ficha de proveedor</h2>
          <p>
            Genera la ficha .xlsx para {titular}. El proveedor la completa, la
            firma (PDF) y te devuelve ambos archivos.
          </p>
        </div>
        <button className="btn-icon" aria-label="Cerrar" onClick={onClose}>
          <IconX />
        </button>
      </header>

      <div className="modal-body">
        <div className="field" style={{ marginBottom: 16 }}>
          <label className="field-label" htmlFor="ficha-emisor">
            Empresa solicitante (emisora)
          </label>
          <select
            id="ficha-emisor"
            className="select"
            value={emisorKey}
            onChange={(e) => setEmisorKey(e.target.value)}
          >
            {EMISOR_COMPANIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.razon} · {c.rut}
              </option>
            ))}
          </select>
          <div className="field-help" style={{ marginTop: 4 }}>
            Sus datos (RUT, giro, dirección) rellenan la sección EMPRESA
            SOLICITANTE de la ficha.
          </div>
        </div>

        <div className="ficha-preview">
          <div className="ficha-preview-head">
            <IconFile />
            <span>
              La ficha incluye los campos que el <strong>proveedor</strong>{" "}
              deberá completar:
            </span>
          </div>
          <div className="ficha-fields-grid">
            {FICHA_FIELD_LABELS.map((l) => (
              <span className="ficha-field-chip" key={l}>
                {l}
              </span>
            ))}
          </div>
          <div className="ficha-sign-note">
            <IconFile />
            Incluye un espacio para la <strong>firma del representante
            legal</strong>.
          </div>
        </div>
      </div>

      <footer className="modal-footer">
        <div className="validation-hint">
          <IconFile />
          <span>Compatible con Microsoft Excel y Google Sheets.</span>
        </div>
        <div className="modal-footer-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={generate}
          >
            <IconDownload />
            {pending ? "Generando…" : "Descargar .xlsx"}
          </button>
        </div>
      </footer>
    </Modal>
  );
}
