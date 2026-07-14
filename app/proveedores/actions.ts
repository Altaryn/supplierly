"use server";

import { revalidatePath } from "next/cache";
import { supplierInputSchema, flattenZodErrors } from "@/lib/validation";
import {
  getSuppliers,
  getSupplierDocuments,
  getAuditLogs,
  insertSupplier,
  updateSupplier,
  deleteSupplier,
  uploadDocument,
  setEstadoDocumental,
  setDocumentStatus,
  signedUrlFor,
  logAudit,
  liveMode,
} from "@/lib/services/suppliers";
import { buildFichaBuffer, parseFichaBuffer } from "@/lib/ficha/excel";
import { getCurrentUser } from "@/lib/supabase/auth";
import type {
  ActionResult,
  Supplier,
  SupplierInput,
  SupplierDocument,
  SupplierAuditLog,
} from "@/lib/types";

const PATH = "/proveedores";

// ── helpers (no exportados: este archivo es "use server") ──
function toB64(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString("base64");
}
function fromB64(b64: string): ArrayBuffer {
  const buf = Buffer.from(b64, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
type ActionFailure = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
};

// Guard de sesión para las mutaciones (defensa en profundidad: el middleware ya
// bloquea las páginas, pero las Server Actions son invocables directamente). En
// modo demo no aplica. El try/catch de cada acción convierte el throw en error.
async function requireAuthOrThrow(): Promise<void> {
  if (!liveMode()) return;
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
}

function validate(
  input: unknown,
): { ok: true; value: SupplierInput } | { ok: false; result: ActionFailure } {
  const parsed = supplierInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      result: {
        ok: false,
        error: "Revisa los campos marcados.",
        fieldErrors: flattenZodErrors(parsed.error),
      },
    };
  }
  return { ok: true, value: parsed.data as SupplierInput };
}

// ─────────────────────────────── CRUD ───────────────────────────────
export async function createSupplierAction(
  input: unknown,
): Promise<ActionResult<Supplier>> {
  const v = validate(input);
  if (!v.ok) return v.result;
  try {
    await requireAuthOrThrow();
    const supplier = await insertSupplier(v.value);
    revalidatePath(PATH);
    return {
      ok: true,
      data: supplier,
      demo: !liveMode(),
      message: "Proveedor creado",
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateSupplierAction(
  id: string,
  input: unknown,
): Promise<ActionResult<Supplier>> {
  const v = validate(input);
  if (!v.ok) return v.result;
  try {
    await requireAuthOrThrow();
    const supplier = await updateSupplier(id, v.value);
    revalidatePath(PATH);
    return {
      ok: true,
      data: supplier,
      demo: !liveMode(),
      message: "Cambios guardados",
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteSupplierAction(
  id: string,
  label: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuthOrThrow();
    await deleteSupplier(id, label);
    revalidatePath(PATH);
    return {
      ok: true,
      data: { id },
      demo: !liveMode(),
      message: "Proveedor eliminado",
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function refreshSuppliersAction(): Promise<
  ActionResult<Supplier[]>
> {
  try {
    const rows = await getSuppliers();
    return { ok: true, data: rows, demo: !liveMode() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Documentos + historial para el drawer (modo live).
export async function getSupplierDetailAction(id: string): Promise<
  ActionResult<{ documents: SupplierDocument[]; audit: SupplierAuditLog[] }>
> {
  try {
    const [documents, audit] = await Promise.all([
      getSupplierDocuments(id),
      getAuditLogs(id),
    ]);
    return { ok: true, data: { documents, audit }, demo: !liveMode() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─────────────────────── Ficha .xlsx: generar ───────────────────────
export async function generateFichaAction(
  supplier: Supplier,
  emisorKey?: string | null,
): Promise<ActionResult<{ base64: string; fileName: string; mimeType: string }>> {
  try {
    await requireAuthOrThrow();
    const { buffer, fileName } = await buildFichaBuffer(supplier, emisorKey);
    const mimeType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // En live, archiva la ficha generada en Storage + traza.
    if (liveMode() && supplier.id) {
      try {
        await uploadDocument({
          supplierId: supplier.id,
          type: "generated_xlsx",
          fileName,
          mimeType,
          bytes: buffer,
        });
        await setEstadoDocumental(supplier.id, "Ficha generada");
        await logAudit(
          supplier.id,
          "ficha_generated",
          `Ficha .xlsx generada para ${supplier.razon_social}`,
        );
        revalidatePath(PATH);
      } catch (e) {
        console.error("[ficha] archivado no crítico falló:", e);
      }
    }

    return {
      ok: true,
      data: { base64: toB64(buffer), fileName, mimeType },
      demo: !liveMode(),
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─────────────────────── Ficha .xlsx: importar ──────────────────────
export async function parseFichaAction(
  base64: string,
): Promise<
  ActionResult<{
    fields: Partial<SupplierInput>;
    detected: { label: string; value: string }[];
  }>
> {
  try {
    const parsed = parseFichaBuffer(fromB64(base64));
    if (!parsed.fields.razon_social && !parsed.detected.length) {
      return {
        ok: false,
        error:
          "No se reconoció el formato de ficha. Usa la plantilla generada por “Nueva Ficha”.",
      };
    }
    return { ok: true, data: parsed, demo: !liveMode() };
  } catch (e) {
    return {
      ok: false,
      error: "No se pudo leer el .xlsx: " + (e as Error).message,
    };
  }
}

export interface ImportPayload {
  input: unknown; // SupplierInput-shaped (detected + completed)
  xlsxBase64: string;
  xlsxName: string;
  pdfBase64?: string | null;
  pdfName?: string | null;
  resolution?: { action: "update"; id: string } | { action: "create" } | null;
}

export async function importSupplierAction(
  payload: ImportPayload,
): Promise<
  ActionResult<
    | { status: "created" | "updated"; supplier: Supplier }
    | { status: "duplicate"; match: Supplier }
  >
> {
  const v = validate(payload.input);
  if (!v.ok) return v.result;
  const value = v.value;

  // §13: la ficha importada debe traer RUT / Tax ID (además de razón social y
  // país, ya exigidos por el esquema). Contacto y email son opcionales.
  if (!value.rut_tax_id.trim()) {
    return {
      ok: false,
      error: "La ficha no incluye RUT / Tax ID, obligatorio para importar.",
      fieldErrors: { rut_tax_id: "Requerido en la ficha" },
    };
  }

  try {
    await requireAuthOrThrow();
    // Detección de duplicados (§21): RUT / Código SAP / Razón social.
    const existing = await getSuppliers();
    const norm = (s: string) => s.trim().toLowerCase();
    const match =
      existing.find(
        (s) => value.rut_tax_id && norm(s.rut_tax_id) === norm(value.rut_tax_id),
      ) ||
      existing.find(
        (s) => value.codigo_sap && norm(s.codigo_sap) === norm(value.codigo_sap),
      ) ||
      existing.find((s) => norm(s.razon_social) === norm(value.razon_social));

    if (match && !payload.resolution) {
      return { ok: true, data: { status: "duplicate", match }, demo: !liveMode() };
    }

    const doUpdate =
      payload.resolution?.action === "update"
        ? payload.resolution.id
        : match && payload.resolution == null
          ? null
          : null;

    let supplier: Supplier;
    let status: "created" | "updated";
    if (doUpdate) {
      supplier = await updateSupplier(doUpdate, value);
      status = "updated";
    } else {
      supplier = await insertSupplier(value);
      status = "created";
    }

    // Archiva la ficha importada + PDF firmado opcional (modo live).
    if (liveMode() && supplier.id) {
      try {
        await uploadDocument({
          supplierId: supplier.id,
          type: "imported_xlsx",
          fileName: payload.xlsxName || "ficha-importada.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          bytes: fromB64(payload.xlsxBase64),
        });
        let docEstado: Supplier["doc_estado"] = "Ficha importada";
        if (payload.pdfBase64) {
          await uploadDocument({
            supplierId: supplier.id,
            type: "signed_pdf",
            fileName: payload.pdfName || "ficha-firmada.pdf",
            mimeType: "application/pdf",
            bytes: fromB64(payload.pdfBase64),
          });
          docEstado = "PDF firmado recibido";
        }
        await setEstadoDocumental(supplier.id, docEstado);
        await logAudit(
          supplier.id,
          "ficha_imported",
          `Ficha importada (${status === "updated" ? "actualizó" : "creó"} proveedor)`,
        );
      } catch (e) {
        console.error("[import] archivado no crítico falló:", e);
      }
    }

    revalidatePath(PATH);
    return { ok: true, data: { status, supplier }, demo: !liveMode() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ───────────────────── PDF firmado: subir / gestionar ───────────────
export async function uploadSignedPdfAction(
  supplierId: string,
  fileName: string,
  base64: string,
): Promise<ActionResult<{ document: SupplierDocument | null }>> {
  try {
    await requireAuthOrThrow();
    const doc = await uploadDocument({
      supplierId,
      type: "signed_pdf",
      fileName,
      mimeType: "application/pdf",
      bytes: fromB64(base64),
    });
    if (liveMode()) {
      await setEstadoDocumental(supplierId, "PDF firmado recibido");
      await logAudit(
        supplierId,
        "signed_pdf_uploaded",
        `PDF firmado cargado: ${fileName}`,
      );
      revalidatePath(PATH);
    }
    return {
      ok: true,
      data: { document: doc },
      demo: !liveMode(),
      message: "PDF firmado cargado",
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function getDocumentUrlAction(
  path: string,
): Promise<ActionResult<{ url: string | null }>> {
  try {
    const url = await signedUrlFor(path);
    return { ok: true, data: { url }, demo: !liveMode() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function reviewDocumentationAction(
  supplierId: string,
  decision: "validate" | "reject",
  docId?: string,
): Promise<ActionResult<{ supplierId: string }>> {
  try {
    await requireAuthOrThrow();
    if (liveMode()) {
      await setEstadoDocumental(
        supplierId,
        decision === "validate" ? "Validado" : "Rechazado",
      );
      if (docId) {
        await setDocumentStatus(
          docId,
          decision === "validate" ? "validated" : "rejected",
        );
      }
      await logAudit(
        supplierId,
        decision === "validate" ? "document_validated" : "document_rejected",
        decision === "validate"
          ? "Documentación validada"
          : "Documentación rechazada",
      );
      revalidatePath(PATH);
    }
    return {
      ok: true,
      data: { supplierId },
      demo: !liveMode(),
      message: decision === "validate" ? "Documentación validada" : "Documentación rechazada",
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
