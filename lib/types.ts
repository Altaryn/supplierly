// ============================================================================
// Modelo de dominio del módulo Proveedores.
//
// Las claves usan snake_case para coincidir 1:1 con las columnas de Postgres
// (supabase/schema.sql) y evitar capas de mapeo propensas a errores. El tipo
// reúne los campos exigidos por la issue (KNO-79 §8) con los campos extendidos
// del mockup (drawer: Datos generales / Contacto / Banco / Rep. legal / Ficha).
// ============================================================================

export type SupplierEstado = "Activo" | "Inactivo" | "Pendiente" | "Bloqueado";

// Estado documental del proveedor (issue §15).
export type DocEstado =
  | "Pendiente"
  | "Ficha generada"
  | "Ficha importada"
  | "PDF firmado pendiente"
  | "PDF firmado recibido"
  | "Validado"
  | "Rechazado";

export interface Supplier {
  id: string;
  // Identificación
  razon_social: string; // requerido (reemplaza "Proveedor")
  nombre_fantasia: string;
  codigo_sap: string; // opcional, alfanumérico
  rut_tax_id: string;
  giro: string;
  categorias: string[];
  // Ubicación
  pais: string;
  ciudad: string;
  comuna: string;
  direccion: string;
  codigo_postal: string;
  telefono_empresa: string;
  web: string;
  // Contacto principal
  contacto: string;
  cargo_contacto: string;
  genero: string;
  telefono: string;
  email: string;
  cc_email: string;
  // Comercial / bancario
  condiciones_pago: string;
  forma_pago: string;
  tipo_doc: string;
  moneda: string;
  banco: string;
  tipo_cuenta: string;
  cuenta_bancaria: string;
  // Tributario
  tipo_contribuyente: string;
  regimen_tributario: string;
  // Representante legal
  rep_nombre: string;
  rep_rut: string;
  rep_email: string;
  // Estados
  estado: SupplierEstado;
  doc_estado: DocEstado;
  // Auditoría
  created_at: string;
  updated_at: string;
}

// Campos editables (todo menos id / timestamps gestionados por el servidor).
export type SupplierInput = Omit<Supplier, "id" | "created_at" | "updated_at">;

export type SupplierDocumentType =
  | "generated_xlsx"
  | "imported_xlsx"
  | "signed_pdf";

export type SupplierDocumentStatus =
  | "pending"
  | "uploaded"
  | "validated"
  | "rejected"
  | "replaced";

export interface SupplierDocument {
  id: string;
  supplier_id: string;
  document_type: SupplierDocumentType;
  file_name: string;
  file_path: string;
  file_url: string | null;
  mime_type: string;
  file_size: number;
  status: SupplierDocumentStatus;
  version: number;
  uploaded_at: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AuditAction =
  | "supplier_created"
  | "supplier_updated"
  | "supplier_deleted"
  | "ficha_generated"
  | "ficha_imported"
  | "signed_pdf_uploaded"
  | "document_replaced"
  | "document_validated"
  | "document_rejected";

export interface SupplierAuditLog {
  id: string;
  supplier_id: string | null;
  action: AuditAction;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}

// Resultado uniforme de las Server Actions, consumido por la UI para toasts.
export type ActionResult<T = unknown> =
  | { ok: true; data: T; demo?: boolean; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
