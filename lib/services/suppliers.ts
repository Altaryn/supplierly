import "server-only";
import { randomUUID } from "node:crypto";
import { createReadClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, STORAGE_BUCKET, APP_USER } from "@/lib/env";
import { DEMO_SUPPLIERS } from "@/lib/data/mock";
import { parseCategories } from "@/lib/format";
import type {
  Supplier,
  SupplierInput,
  SupplierDocument,
  SupplierDocumentType,
  SupplierAuditLog,
  AuditAction,
} from "@/lib/types";

const TABLE = "suppliers";
const DOCS_TABLE = "supplier_documents";
const AUDIT_TABLE = "supplier_audit_logs";

// ── Normalización fila DB → modelo (rellena defaults y asegura tipos) ──
function normalizeRow(r: Record<string, unknown>): Supplier {
  const s = (v: unknown) => (v == null ? "" : String(v));
  return {
    id: s(r.id),
    razon_social: s(r.razon_social),
    nombre_fantasia: s(r.nombre_fantasia) || s(r.razon_social),
    codigo_sap: s(r.codigo_sap),
    rut_tax_id: s(r.rut_tax_id),
    giro: s(r.giro),
    categorias: parseCategories(r.categorias),
    subcategorias: parseCategories(r.subcategorias),
    empresa: s(r.empresa),
    pais: s(r.pais),
    ciudad: s(r.ciudad),
    comuna: s(r.comuna),
    direccion: s(r.direccion),
    codigo_postal: s(r.codigo_postal),
    telefono_empresa: s(r.telefono_empresa),
    web: s(r.web),
    contacto: s(r.contacto),
    cargo_contacto: s(r.cargo_contacto),
    genero: s(r.genero),
    telefono: s(r.telefono),
    email: s(r.email),
    cc_email: s(r.cc_email),
    condiciones_pago: s(r.condiciones_pago),
    forma_pago: s(r.forma_pago),
    tipo_doc: s(r.tipo_doc),
    moneda: s(r.moneda) || "CLP",
    banco: s(r.banco),
    tipo_cuenta: s(r.tipo_cuenta),
    cuenta_bancaria: s(r.cuenta_bancaria),
    tipo_contribuyente: s(r.tipo_contribuyente),
    regimen_tributario: s(r.regimen_tributario),
    rep_nombre: s(r.rep_nombre),
    rep_rut: s(r.rep_rut),
    rep_email: s(r.rep_email),
    estado: (s(r.estado) || "Activo") as Supplier["estado"],
    doc_estado: (s(r.doc_estado) || "Pendiente") as Supplier["doc_estado"],
    created_at: s(r.created_at),
    updated_at: s(r.updated_at),
  };
}

// Modelo → fila para insert/update (id y timestamps los gestiona Postgres).
function toRow(input: SupplierInput): Record<string, unknown> {
  return {
    razon_social: input.razon_social,
    nombre_fantasia: input.nombre_fantasia || input.razon_social,
    codigo_sap: input.codigo_sap || null,
    rut_tax_id: input.rut_tax_id,
    giro: input.giro,
    categorias: input.categorias,
    subcategorias: input.subcategorias,
    empresa: input.empresa,
    pais: input.pais,
    ciudad: input.ciudad,
    comuna: input.comuna,
    direccion: input.direccion,
    codigo_postal: input.codigo_postal,
    telefono_empresa: input.telefono_empresa,
    web: input.web,
    contacto: input.contacto,
    cargo_contacto: input.cargo_contacto,
    genero: input.genero,
    telefono: input.telefono,
    email: input.email,
    cc_email: input.cc_email,
    condiciones_pago: input.condiciones_pago,
    forma_pago: input.forma_pago,
    tipo_doc: input.tipo_doc,
    moneda: input.moneda || "CLP",
    banco: input.banco,
    tipo_cuenta: input.tipo_cuenta,
    cuenta_bancaria: input.cuenta_bancaria,
    tipo_contribuyente: input.tipo_contribuyente,
    regimen_tributario: input.regimen_tributario,
    rep_nombre: input.rep_nombre,
    rep_rut: input.rep_rut,
    rep_email: input.rep_email,
    estado: input.estado,
    doc_estado: input.doc_estado,
  };
}

function demoSupplier(input: SupplierInput): Supplier {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    ...input,
    nombre_fantasia: input.nombre_fantasia || input.razon_social,
    moneda: input.moneda || "CLP",
    created_at: now,
    updated_at: now,
  };
}

export const liveMode = () => isSupabaseConfigured();

// ─────────────────────────────── Reads ───────────────────────────────
export async function getSuppliers(): Promise<Supplier[]> {
  if (!isSupabaseConfigured()) return DEMO_SUPPLIERS;
  try {
    const sb = createReadClient();
    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .order("razon_social", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(normalizeRow);
  } catch (e) {
    console.error("[suppliers] read failed, falling back to demo:", e);
    return DEMO_SUPPLIERS;
  }
}

export async function getSupplierDocuments(
  supplierId: string,
): Promise<SupplierDocument[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const sb = createReadClient();
    const { data, error } = await sb
      .from(DOCS_TABLE)
      .select("*")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SupplierDocument[];
  } catch (e) {
    console.error("[documents] read failed:", e);
    return [];
  }
}

export async function getAuditLogs(
  supplierId: string,
): Promise<SupplierAuditLog[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const sb = createReadClient();
    const { data, error } = await sb
      .from(AUDIT_TABLE)
      .select("*")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as SupplierAuditLog[];
  } catch (e) {
    console.error("[audit] read failed:", e);
    return [];
  }
}

// ──────────────────────────── Mutations ─────────────────────────────
export async function insertSupplier(input: SupplierInput): Promise<Supplier> {
  const admin = createAdminClient();
  if (!admin) return demoSupplier(input);
  const { data, error } = await admin
    .from(TABLE)
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const supplier = normalizeRow(data);
  await logAudit(supplier.id, "supplier_created", `Proveedor creado: ${supplier.razon_social}`);
  return supplier;
}

export async function updateSupplier(
  id: string,
  input: SupplierInput,
): Promise<Supplier> {
  const admin = createAdminClient();
  if (!admin) return { ...demoSupplier(input), id };
  const { data, error } = await admin
    .from(TABLE)
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const supplier = normalizeRow(data);
  await logAudit(id, "supplier_updated", `Proveedor actualizado: ${supplier.razon_social}`);
  return supplier;
}

export async function deleteSupplier(id: string, label: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  // Los documentos se borran en cascada (FK). Registramos auditoría sin
  // supplier_id (queda como rastro histórico aunque la fila ya no exista).
  const { error } = await admin.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(null, "supplier_deleted", `Proveedor eliminado: ${label}`, { id });
}

export async function setEstadoDocumental(
  id: string,
  doc_estado: Supplier["doc_estado"],
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  const { error } = await admin
    .from(TABLE)
    .update({ doc_estado, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ──────────────────────── Documentos + Storage ──────────────────────
export interface UploadInput {
  supplierId: string;
  type: SupplierDocumentType;
  fileName: string;
  mimeType: string;
  bytes: ArrayBuffer;
}

const FOLDER: Record<SupplierDocumentType, string> = {
  generated_xlsx: "forms",
  imported_xlsx: "forms",
  signed_pdf: "signed",
};

export async function uploadDocument(
  input: UploadInput,
): Promise<SupplierDocument> {
  const admin = createAdminClient();
  const size = input.bytes.byteLength;
  const now = new Date().toISOString();

  if (!admin) {
    // Demo: no se persiste el binario; devolvemos metadatos sintéticos.
    return {
      id: randomUUID(),
      supplier_id: input.supplierId,
      document_type: input.type,
      file_name: input.fileName,
      file_path: `demo/${input.supplierId}/${input.fileName}`,
      file_url: null,
      mime_type: input.mimeType,
      file_size: size,
      status: input.type === "signed_pdf" ? "uploaded" : "uploaded",
      version: 1,
      uploaded_at: now,
      uploaded_by: APP_USER.name,
      created_at: now,
      updated_at: now,
    };
  }

  // Versionado: cuenta documentos previos del mismo tipo para este proveedor.
  const { count } = await admin
    .from(DOCS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", input.supplierId)
    .eq("document_type", input.type);
  const version = (count ?? 0) + 1;

  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${input.supplierId}/${FOLDER[input.type]}/v${version}-${safeName}`;

  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, input.bytes, { contentType: input.mimeType, upsert: true });
  if (upErr) throw new Error(`Storage: ${upErr.message}`);

  const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  const row = {
    supplier_id: input.supplierId,
    document_type: input.type,
    file_name: input.fileName,
    file_path: path,
    file_url: pub?.publicUrl ?? null,
    mime_type: input.mimeType,
    file_size: size,
    status: "uploaded",
    version,
    uploaded_by: APP_USER.name,
  };
  const { data, error } = await admin
    .from(DOCS_TABLE)
    .insert(row)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as SupplierDocument;
}

// URL firmada temporal para ver/descargar un documento privado.
export async function signedUrlFor(path: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function setDocumentStatus(
  docId: string,
  status: SupplierDocument["status"],
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  const { error } = await admin
    .from(DOCS_TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", docId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────── Audit ──────────────────────────────
export async function logAudit(
  supplierId: string | null,
  action: AuditAction,
  description: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    await admin.from(AUDIT_TABLE).insert({
      supplier_id: supplierId,
      action,
      description,
      metadata: metadata ?? null,
      created_by: APP_USER.name,
    });
  } catch (e) {
    console.error("[audit] write failed (non-fatal):", e);
  }
}
