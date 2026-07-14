"use client";

import { useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { TagInput } from "./TagInput";
import { IconX, IconUpload, IconCheck, IconInfo, IconFile, IconAlert } from "@/components/icons";
import { fileToBase64, isXlsx, isPdf } from "@/lib/client/files";
import { emptyInput } from "@/lib/supplier-form";
import {
  parseFichaAction,
  importSupplierAction,
} from "@/app/proveedores/actions";
import type { Supplier, SupplierInput } from "@/lib/types";

type Resolution = { action: "update"; id: string } | { action: "create" };

export function ImportModal({
  open,
  categories,
  onClose,
  onImported,
}: {
  open: boolean;
  categories: string[];
  onClose: () => void;
  onImported: (s: Supplier, status: "created" | "updated") => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<"upload" | "review">("upload");
  const [fileName, setFileName] = useState("");
  const [xlsxB64, setXlsxB64] = useState("");
  const [detected, setDetected] = useState<{ label: string; value: string }[]>([]);
  const [fields, setFields] = useState<Partial<SupplierInput>>({});
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cc, setCc] = useState("");
  const [web, setWeb] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [duplicate, setDuplicate] = useState<Supplier | null>(null);
  // Detalle del rechazo del servidor (p. ej. la lista de datos que falta
  // completar en la ficha): va en un banner y no solo en el toast, porque puede
  // enumerar varios campos y el usuario necesita poder leerlos con calma.
  const [importError, setImportError] = useState("");

  function reset() {
    setStep("upload");
    setFileName("");
    setXlsxB64("");
    setDetected([]);
    setFields({});
    setCategorias([]);
    setCc("");
    setWeb("");
    setPdfFile(null);
    setDuplicate(null);
    setImportError("");
  }
  function close() {
    reset();
    onClose();
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!isXlsx(file)) {
      toast("error", "Formato no válido", "Solo se aceptan archivos .xlsx");
      return;
    }
    setImportError("");
    startTransition(async () => {
      const b64 = await fileToBase64(file);
      const res = await parseFichaAction(b64);
      if (!res.ok) {
        toast("error", "No se pudo leer la ficha", res.error);
        return;
      }
      setFileName(file.name);
      setXlsxB64(b64);
      setDetected(res.data.detected);
      setFields(res.data.fields);
      setCategorias(res.data.fields.categorias ?? []);
      setCc(res.data.fields.cc_email ?? "");
      setWeb(res.data.fields.web ?? "");
      setStep("review");
    });
  }

  function buildInput(): SupplierInput {
    return {
      ...emptyInput(),
      ...fields,
      categorias,
      cc_email: cc,
      web,
    };
  }

  function confirm(resolution?: Resolution) {
    if (!categorias.length) {
      toast("error", "Falta categoría", "Agrega al menos una categoría.");
      return;
    }
    setImportError("");
    startTransition(async () => {
      const pdfB64 = pdfFile ? await fileToBase64(pdfFile) : null;
      const res = await importSupplierAction({
        input: buildInput(),
        xlsxBase64: xlsxB64,
        xlsxName: fileName,
        pdfBase64: pdfB64,
        pdfName: pdfFile?.name ?? null,
        resolution: resolution ?? null,
      });
      if (!res.ok) {
        setImportError(res.error);
        toast("error", "No se pudo importar", res.error);
        return;
      }
      if (res.data.status === "duplicate") {
        setDuplicate(res.data.match);
        return;
      }
      onImported(res.data.supplier, res.data.status);
      toast(
        "success",
        res.data.status === "updated"
          ? "Proveedor actualizado"
          : "Proveedor creado",
        res.demo ? "Modo demo: no se persistió." : "Documentación archivada.",
      );
      close();
    });
  }

  const razon = fields.razon_social || "—";

  return (
    <Modal open={open} onClose={close} size="lg" labelledBy="import-modal-title">
      <header className="modal-header">
        <div className="modal-title">
          <h2 id="import-modal-title">Importar ficha de proveedor</h2>
          <p>
            Carga el archivo .xlsx que el proveedor completó. Extraeremos sus
            datos automáticamente.
          </p>
        </div>
        <button className="btn-icon" aria-label="Cerrar" onClick={close}>
          <IconX />
        </button>
      </header>

      <div className="modal-body">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />

        <div
          className={`import-drop${fileName ? " has-file" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("dragover");
          }}
          onDragLeave={(e) => e.currentTarget.classList.remove("dragover")}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("dragover");
            onPickFile(e.dataTransfer.files?.[0]);
          }}
        >
          <IconUpload />
          <div className="import-drop-title">
            {fileName || "Arrastra el archivo .xlsx aquí"}
          </div>
          <div className="import-drop-sub">
            {pending && step === "upload"
              ? "Leyendo archivo…"
              : "o haz clic para seleccionarlo · formato generado por “Nueva Ficha”"}
          </div>
        </div>

        {step === "review" ? (
          <div className="import-result">
            {/* Ficha incompleta u otro rechazo del servidor */}
            {importError ? (
              <div className="duplicate-banner is-error" style={{ display: "flex" }}>
                <IconAlert />
                <span>{importError}</span>
              </div>
            ) : null}

            {/* Duplicado detectado (§21) */}
            {duplicate ? (
              <div className="duplicate-banner" style={{ display: "flex" }}>
                <IconAlert />
                <span>
                  Ya existe <strong>{duplicate.razon_social}</strong>
                  {duplicate.rut_tax_id ? ` (RUT ${duplicate.rut_tax_id})` : ""}.
                  ¿Qué deseas hacer?
                  <span className="dupe-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={pending}
                      onClick={() =>
                        confirm({ action: "update", id: duplicate.id })
                      }
                    >
                      Actualizar existente
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={pending}
                      onClick={() => confirm({ action: "create" })}
                    >
                      Crear nuevo igualmente
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={pending}
                      onClick={() => setDuplicate(null)}
                    >
                      Cancelar
                    </button>
                  </span>
                </span>
              </div>
            ) : null}

            <div className="form-section">
              <div className="form-section-head">
                <div className="form-section-title">
                  Datos detectados automáticamente
                </div>
                <div className="form-section-hint">{fileName}</div>
              </div>
              <div className="import-detected">
                {detected.length ? (
                  detected.map((d, i) => (
                    <div className="import-detected-item" key={i}>
                      <span className="k">{d.label}</span>
                      <span className="v">{d.value}</span>
                    </div>
                  ))
                ) : (
                  <div className="import-detected-item is-empty">
                    <span className="k">Razón social</span>
                    <span className="v">{razon}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-head">
                <div className="form-section-title">
                  Completa antes de importar
                </div>
                <div className="form-section-hint">
                  Estos datos no vienen en la ficha
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label className="field-label">
                    Categoría <span className="req">*</span>
                  </label>
                  <TagInput
                    value={categorias}
                    onChange={setCategorias}
                    suggestions={categories}
                  />
                  <span className="field-help">
                    Una o varias. Enter o coma para agregar.
                  </span>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label className="field-label">
                    CC Email <span className="field-opt">(opcional)</span>
                  </label>
                  <input
                    className="input"
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@proveedor.cl"
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label className="field-label">
                    Web <span className="field-opt">(opcional)</span>
                  </label>
                  <input
                    className="input"
                    type="url"
                    value={web}
                    onChange={(e) => setWeb(e.target.value)}
                    placeholder="https://proveedor.cl"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label className="field-label">
                    PDF firmado (escaneado){" "}
                    <span className="field-opt">(opcional)</span>
                  </label>
                  <input
                    ref={pdfRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && !isPdf(f)) {
                        toast("error", "Formato no válido", "Solo .pdf");
                        return;
                      }
                      setPdfFile(f ?? null);
                    }}
                  />
                  <div
                    className={`pdf-attach${pdfFile ? " has-file" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => pdfRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        pdfRef.current?.click();
                    }}
                  >
                    <IconFile />
                    <span>{pdfFile ? pdfFile.name : "Adjuntar PDF firmado…"}</span>
                  </div>
                  <span className="field-help">
                    Respaldo de la firma del representante legal. Se guarda en la
                    sección Documentos del proveedor.
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="modal-footer">
        <div className="validation-hint">
          <IconInfo />
          <span>
            {step === "upload"
              ? "Carga un archivo .xlsx para comenzar"
              : duplicate
                ? "Resuelve el duplicado para continuar"
                : importError
                  ? "Corrige la ficha y vuelve a subirla"
                  : "Revisa los datos y confirma la importación"}
          </span>
        </div>
        <div className="modal-footer-actions">
          <button className="btn btn-ghost" onClick={close}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            disabled={step !== "review" || pending || !!duplicate}
            onClick={() => confirm()}
          >
            <IconCheck />
            {pending ? "Importando…" : "Importar proveedor"}
          </button>
        </div>
      </footer>
    </Modal>
  );
}
