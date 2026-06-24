"use client";

import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { TagInput } from "./TagInput";
import { StatusBadge } from "./StatusBadge";
import {
  IconX,
  IconTrash,
  IconCheck,
  IconDownload,
  IconUpload,
  IconFile,
  IconEye,
  IconClock,
} from "@/components/icons";
import {
  ESTADOS,
  GENEROS,
  FORMA_PAGO,
  TIPO_DOC,
  TIPO_CUENTA,
  MONEDAS,
  CONDICION_PAGO,
  DOC_ESTADOS,
  subcategoriaSuggestions,
} from "@/lib/constants";
import { EMISOR_COMPANIES, DEFAULT_EMISOR_KEY } from "@/lib/companies";
import { initials, joinCategories, fmtBytes, fmtDate } from "@/lib/format";
import { toInput, blankSupplier } from "@/lib/supplier-form";
import { fileToBase64, downloadBase64, isPdf } from "@/lib/client/files";
import {
  updateSupplierAction,
  generateFichaAction,
  uploadSignedPdfAction,
  reviewDocumentationAction,
  getSupplierDetailAction,
} from "@/app/proveedores/actions";
import type {
  Supplier,
  SupplierInput,
  SupplierDocument,
  SupplierAuditLog,
} from "@/lib/types";

type Tab = "general" | "contacto" | "comercial" | "legal" | "docs";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "Generales" },
  { id: "contacto", label: "Contacto" },
  { id: "comercial", label: "Comercial" },
  { id: "legal", label: "Rep. Legal" },
  { id: "docs", label: "Documentos" },
];

// Documento mostrado en la pestaña (persistido o cargado en la sesión demo).
interface SessionDoc {
  id: string;
  type: SupplierDocument["document_type"];
  name: string;
  uploadedAt: string;
  size?: number;
  url?: string; // object URL para ver/descargar en la sesión (demo)
}

export function SupplierDrawer({
  open,
  supplier,
  categories,
  onClose,
  onSaved,
  onRequestDelete,
}: {
  open: boolean;
  supplier: Supplier | null;
  categories: string[];
  onClose: () => void;
  onSaved: (s: Supplier) => void;
  onRequestDelete: (s: Supplier) => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("general");
  const [draft, setDraft] = useState<SupplierInput>(() => toInput(blankSupplier()));
  const [docEstado, setDocEstado] = useState(supplier?.doc_estado ?? "Pendiente");
  const [docs, setDocs] = useState<SessionDoc[]>([]);
  const [audit, setAudit] = useState<SupplierAuditLog[]>([]);
  const [emisorKey, setEmisorKey] = useState(DEFAULT_EMISOR_KEY);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open && supplier) {
      setDraft(toInput(supplier));
      setDocEstado(supplier.doc_estado);
      setTab("general");
      setDocs([]);
      setAudit([]);
      // Carga documentos/historial persistidos (modo live).
      getSupplierDetailAction(supplier.id).then((res) => {
        if (res.ok) {
          setDocs(
            res.data.documents.map((d) => ({
              id: d.id,
              type: d.document_type,
              name: d.file_name,
              uploadedAt: d.uploaded_at,
              size: d.file_size,
            })),
          );
          setAudit(res.data.audit);
        }
      });
    }
  }, [open, supplier]);

  if (!supplier) {
    return (
      <>
        <div className="drawer-scrim" onClick={onClose} />
        <aside className="drawer prov-drawer" aria-hidden="true" />
      </>
    );
  }

  function set<K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const res = await updateSupplierAction(supplier!.id, draft);
      if (res.ok) {
        onSaved(res.data);
        toast("success", "Cambios guardados", res.demo ? "Modo demo." : undefined);
      } else {
        toast("error", "No se pudo guardar", res.error ?? "Revisa los campos.");
      }
    });
  }

  function genFicha() {
    startTransition(async () => {
      const res = await generateFichaAction({ ...supplier!, ...draft }, emisorKey);
      if (res.ok) {
        downloadBase64(res.data.base64, res.data.fileName, res.data.mimeType);
        setDocEstado("Ficha generada");
        setDocs((d) => [
          {
            id: crypto.randomUUID(),
            type: "generated_xlsx",
            name: res.data.fileName,
            uploadedAt: new Date().toISOString(),
          },
          ...d,
        ]);
        toast("success", "Ficha .xlsx generada", "Descarga iniciada.");
      } else {
        toast("error", "No se pudo generar", res.error);
      }
    });
  }

  function attachPdf(file: File | undefined) {
    if (!file) return;
    if (!isPdf(file)) {
      toast("error", "Formato no válido", "Solo se aceptan archivos .pdf");
      return;
    }
    startTransition(async () => {
      const b64 = await fileToBase64(file);
      const res = await uploadSignedPdfAction(supplier!.id, file.name, b64);
      if (res.ok) {
        const url = URL.createObjectURL(file);
        setDocs((d) => [
          {
            id: res.data.document?.id ?? crypto.randomUUID(),
            type: "signed_pdf",
            name: file.name,
            uploadedAt: new Date().toISOString(),
            size: file.size,
            url,
          },
          ...d.filter((x) => x.type !== "signed_pdf"),
        ]);
        setDocEstado("PDF firmado recibido");
        toast(
          "success",
          "PDF firmado cargado",
          res.demo ? "Modo demo: disponible solo esta sesión." : undefined,
        );
      } else {
        toast("error", "No se pudo cargar el PDF", res.error);
      }
    });
  }

  function review(decision: "validate" | "reject") {
    startTransition(async () => {
      const signed = docs.find((d) => d.type === "signed_pdf");
      const res = await reviewDocumentationAction(
        supplier!.id,
        decision,
        signed?.id,
      );
      if (res.ok) {
        setDocEstado(decision === "validate" ? "Validado" : "Rechazado");
        toast(
          "success",
          decision === "validate"
            ? "Documentación validada"
            : "Documentación rechazada",
        );
      } else {
        toast("error", "No se pudo actualizar", res.error);
      }
    });
  }

  const signedPdf = docs.find((d) => d.type === "signed_pdf");

  return (
    <>
      <div className={`drawer-scrim${open ? " open" : ""}`} onClick={onClose} />
      <aside
        className={`drawer prov-drawer${open ? " open" : ""}`}
        aria-hidden={!open}
      >
        <div className="drawer-header prov-drawer-header">
          <button className="btn-icon drawer-close" aria-label="Cerrar" onClick={onClose}>
            <IconX />
          </button>
          <div className="prov-drawer-id">
            <div className="company-icon prov-drawer-avatar">
              {initials(supplier.razon_social)}
            </div>
            <div className="prov-drawer-id-text">
              <div className="prov-drawer-name">{supplier.razon_social}</div>
              <div className="prov-drawer-sub">
                {supplier.nombre_fantasia}
                {supplier.codigo_sap ? ` · ${supplier.codigo_sap}` : ""}
              </div>
            </div>
          </div>
          <div className="prov-drawer-cats">
            <StatusBadge estado={supplier.estado} />
            {supplier.categorias.map((c) => (
              <span className="badge category" key={c}>
                {c}
              </span>
            ))}
          </div>
          <div className="seg-group prov-drawer-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`seg${tab === t.id ? " active" : ""}`}
                role="tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="drawer-body prov-drawer-body">
          {tab === "general" && (
            <>
              <Section title="Identificación">
                <DField label="Razón social" col2 value={draft.razon_social} onChange={(v) => set("razon_social", v)} />
                <DField label="Nombre de fantasía" col2 value={draft.nombre_fantasia} onChange={(v) => set("nombre_fantasia", v)} />
                <DField label="Código SAP" value={draft.codigo_sap} onChange={(v) => set("codigo_sap", v)} ph="SAP-1001" />
                <DField label="RUT / Tax ID" value={draft.rut_tax_id} onChange={(v) => set("rut_tax_id", v)} ph="76.123.456-7" />
                <DField label="Giro" col2 value={draft.giro} onChange={(v) => set("giro", v)} />
                <DSelect label="Estado" value={draft.estado} onChange={(v) => set("estado", v as Supplier["estado"])} options={ESTADOS} />
              </Section>
              <Section title="Ubicación">
                <DField label="Dirección" col2 value={draft.direccion} onChange={(v) => set("direccion", v)} />
                <DField label="Comuna" value={draft.comuna} onChange={(v) => set("comuna", v)} />
                <DField label="Ciudad" value={draft.ciudad} onChange={(v) => set("ciudad", v)} />
                <DField label="Código postal" value={draft.codigo_postal} onChange={(v) => set("codigo_postal", v)} />
                <DField label="País" value={draft.pais} onChange={(v) => set("pais", v)} />
              </Section>
              <Section title="Clasificación">
                <div className="field col-2">
                  <label className="field-label">Categorías</label>
                  <TagInput value={draft.categorias} onChange={(v) => set("categorias", v)} suggestions={categories} />
                </div>
                <div className="field col-2">
                  <label className="field-label">
                    Subcategorías <span className="field-opt">(tipo de material)</span>
                  </label>
                  <TagInput
                    value={draft.subcategorias}
                    onChange={(v) => set("subcategorias", v)}
                    suggestions={subcategoriaSuggestions(draft.categorias)}
                    placeholder="Agregar subcategoría…"
                  />
                </div>
                <DField label="Web" value={draft.web} onChange={(v) => set("web", v)} ph="https://…" />
              </Section>
            </>
          )}

          {tab === "contacto" && (
            <Section title="Persona de contacto">
              <DField label="Nombre de contacto" col2 value={draft.contacto} onChange={(v) => set("contacto", v)} />
              <DField label="Cargo" value={draft.cargo_contacto} onChange={(v) => set("cargo_contacto", v)} />
              <DSelect label="Género" value={draft.genero} onChange={(v) => set("genero", v)} options={GENEROS} />
              <DField label="Teléfono de contacto" value={draft.telefono} onChange={(v) => set("telefono", v)} />
              <DField label="E-mail" col2 value={draft.email} onChange={(v) => set("email", v)} />
              <DField label="CC E-mail" col2 value={draft.cc_email} onChange={(v) => set("cc_email", v)} />
            </Section>
          )}

          {tab === "comercial" && (
            <>
              <Section title="Condiciones comerciales">
                <DSelect label="Condición de pago" value={draft.condiciones_pago} onChange={(v) => set("condiciones_pago", v)} options={CONDICION_PAGO} />
                <DSelect label="Forma de pago" value={draft.forma_pago} onChange={(v) => set("forma_pago", v)} options={FORMA_PAGO} />
                <DSelect label="Tipo de documento tributario" col2 value={draft.tipo_doc} onChange={(v) => set("tipo_doc", v)} options={TIPO_DOC} />
              </Section>
              <Section title="Cuenta bancaria">
                <DField label="Nombre del banco" value={draft.banco} onChange={(v) => set("banco", v)} />
                <DSelect label="Tipo de cuenta" value={draft.tipo_cuenta} onChange={(v) => set("tipo_cuenta", v)} options={TIPO_CUENTA} />
                <DField label="Número de cuenta" value={draft.cuenta_bancaria} onChange={(v) => set("cuenta_bancaria", v)} />
                <DSelect label="Moneda" value={draft.moneda} onChange={(v) => set("moneda", v)} options={MONEDAS} />
              </Section>
            </>
          )}

          {tab === "legal" && (
            <Section title="Representante legal">
              <DField label="Nombre del representante legal" col2 value={draft.rep_nombre} onChange={(v) => set("rep_nombre", v)} />
              <DField label="RUT del representante legal" value={draft.rep_rut} onChange={(v) => set("rep_rut", v)} />
              <DField label="E-mail del representante legal" value={draft.rep_email} onChange={(v) => set("rep_email", v)} />
              <div className="field col-2">
                <div className="field-help" style={{ marginTop: 4 }}>
                  La ficha generada incluye un espacio ampliado para la firma del
                  representante legal.
                </div>
              </div>
            </Section>
          )}

          {tab === "docs" && (
            <div className="prov-section">
              <div className="prov-section-title">Estado documental</div>
              <div className="prov-doc-estado">
                <select
                  className="select"
                  value={docEstado}
                  onChange={(e) =>
                    setDocEstado(e.target.value as Supplier["doc_estado"])
                  }
                >
                  {DOC_ESTADOS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginTop: 12 }}>
                <label className="field-label" htmlFor="drawer-emisor">
                  Empresa solicitante (emisora)
                </label>
                <select
                  id="drawer-emisor"
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
              </div>

              <div className="prov-ficha-actions" style={{ marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" disabled={pending} onClick={genFicha}>
                  <IconDownload /> Generar ficha .xlsx
                </button>
                <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                  <IconUpload /> Adjuntar ficha firmada (.pdf)
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    onChange={(e) => attachPdf(e.target.files?.[0])}
                  />
                </label>
              </div>

              <div className="prov-section-title" style={{ marginTop: 16 }}>
                Documentos
              </div>
              {docs.length ? (
                docs.map((d) => (
                  <div className="pdf-file-row" key={d.id}>
                    <div className="pdf-file-ic">
                      <IconFile />
                    </div>
                    <div className="pdf-file-meta">
                      <div className="pdf-file-name">{d.name}</div>
                      <div className="pdf-file-sub">
                        {docTypeLabel(d.type)}
                        {d.size ? ` · ${fmtBytes(d.size)}` : ""} · {fmtDate(d.uploadedAt)}
                      </div>
                    </div>
                    <div className="pdf-actions">
                      {d.url ? (
                        <>
                          <button
                            className="btn-icon"
                            title="Ver"
                            onClick={() => window.open(d.url, "_blank")}
                          >
                            <IconEye />
                          </button>
                          <a className="btn-icon" title="Descargar" href={d.url} download={d.name}>
                            <IconDownload />
                          </a>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="pdf-empty">
                  Aún no hay documentos. Genera la ficha .xlsx o adjunta el PDF
                  firmado.
                </div>
              )}

              {signedPdf ? (
                <div className="prov-ficha-actions" style={{ marginTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" disabled={pending} onClick={() => review("validate")}>
                    <IconCheck /> Validar documentación
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => review("reject")}>
                    <IconX /> Rechazar
                  </button>
                </div>
              ) : null}

              <div className="prov-section-title" style={{ marginTop: 18 }}>
                Historial
              </div>
              <div className="prov-history">
                {audit.length ? (
                  audit.map((a) => (
                    <div className="prov-history-row" key={a.id}>
                      <IconClock />
                      <div>
                        <div className="prov-history-desc">{a.description}</div>
                        <div className="prov-history-date">{fmtDate(a.created_at)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="prov-history-row">
                      <IconClock />
                      <div>
                        <div className="prov-history-desc">Proveedor creado</div>
                        <div className="prov-history-date">{fmtDate(supplier.created_at)}</div>
                      </div>
                    </div>
                    <div className="prov-history-row">
                      <IconClock />
                      <div>
                        <div className="prov-history-desc">Última actualización</div>
                        <div className="prov-history-date">{fmtDate(supplier.updated_at)}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="drawer-footer prov-drawer-footer">
          <button
            className="btn btn-ghost prov-drawer-del"
            onClick={() => onRequestDelete(supplier)}
          >
            <IconTrash /> Eliminar
          </button>
          <button className="btn btn-primary" disabled={pending} onClick={save}>
            <IconCheck /> {pending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </aside>
    </>
  );
}

function docTypeLabel(t: SupplierDocument["document_type"]): string {
  return t === "signed_pdf"
    ? "PDF firmado"
    : t === "imported_xlsx"
      ? "Ficha importada (.xlsx)"
      : "Ficha generada (.xlsx)";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="prov-section">
      <div className="prov-section-title">{title}</div>
      <div className="prov-grid">{children}</div>
    </div>
  );
}

function DField({
  label,
  value,
  onChange,
  ph,
  col2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ph?: string;
  col2?: boolean;
}) {
  return (
    <div className={`field${col2 ? " col-2" : ""}`}>
      <label className="field-label">{label}</label>
      <input
        className="input"
        value={value}
        placeholder={ph}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DSelect({
  label,
  value,
  onChange,
  options,
  col2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  col2?: boolean;
}) {
  return (
    <div className={`field${col2 ? " col-2" : ""}`}>
      <label className="field-label">{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
