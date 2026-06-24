import "server-only";
import * as XLSX from "xlsx";
import { normLabel, joinCategories, parseCategories } from "@/lib/format";
import type { Supplier, SupplierInput } from "@/lib/types";

// Empresa emisora por defecto (el comprador). En el mockup se elige desde el
// módulo de empresas; aquí, al estar acotados a Proveedores, usamos un emisor
// configurable por constante.
const EMISOR = {
  razon: "Supplierly · Compras",
  rut: "",
  giro: "",
  direccion: "",
  comuna: "",
  ciudad: "",
  telefono: "",
  emailFacturas: "",
};

// Campos del proveedor en la ficha, agrupados según las secciones de la issue
// (§12). `key` es el campo interno; `label` es lo que ve el proveedor en Excel.
interface FichaField {
  key: keyof Supplier;
  label: string;
}
interface FichaSection {
  title: string;
  fields: FichaField[];
}

export const FICHA_SECTIONS: FichaSection[] = [
  {
    title: "INFORMACIÓN GENERAL",
    fields: [
      { key: "razon_social", label: "Razón social" },
      { key: "nombre_fantasia", label: "Nombre de fantasía" },
      { key: "codigo_sap", label: "Código SAP" },
      { key: "rut_tax_id", label: "RUT / Tax ID" },
      { key: "giro", label: "Giro" },
      { key: "pais", label: "País" },
      { key: "ciudad", label: "Ciudad" },
      { key: "comuna", label: "Comuna" },
      { key: "direccion", label: "Dirección" },
      { key: "codigo_postal", label: "Código postal" },
    ],
  },
  {
    title: "INFORMACIÓN DE CONTACTO",
    fields: [
      { key: "contacto", label: "Nombre de la persona de contacto" },
      { key: "cargo_contacto", label: "Cargo" },
      { key: "email", label: "E-mail de contacto" },
      { key: "cc_email", label: "CC E-mail" },
      { key: "telefono", label: "Teléfono de contacto" },
      { key: "telefono_empresa", label: "Teléfono empresa" },
      { key: "web", label: "Sitio web" },
    ],
  },
  {
    title: "INFORMACIÓN COMERCIAL",
    fields: [
      { key: "categorias", label: "Categoría de productos/servicios" },
      { key: "condiciones_pago", label: "Condiciones de pago" },
      { key: "forma_pago", label: "Forma de pago" },
      { key: "moneda", label: "Moneda" },
      { key: "banco", label: "Nombre del banco" },
      { key: "tipo_cuenta", label: "Tipo de cuenta para pago" },
      { key: "cuenta_bancaria", label: "Número de cuenta bancaria (solo números)" },
    ],
  },
  {
    title: "INFORMACIÓN TRIBUTARIA",
    fields: [
      { key: "tipo_contribuyente", label: "Tipo de contribuyente" },
      { key: "regimen_tributario", label: "Régimen tributario" },
      { key: "tipo_doc", label: "Tipo de documento tributario" },
    ],
  },
];

// Representante legal (sección de firma).
const REP_FIELDS: FichaField[] = [
  { key: "rep_nombre", label: "Nombre del representante legal" },
  { key: "rep_rut", label: "RUT del representante legal" },
  { key: "rep_email", label: "E-mail del representante legal" },
];

// Sinónimos de etiqueta → campo interno, para que el import tolere variaciones
// (incluye los labels del mockup original).
const LABEL_SYNONYMS: Record<string, keyof Supplier> = {
  "razon social": "razon_social",
  "nombre de fantasia": "nombre_fantasia",
  "codigo sap": "codigo_sap",
  rut: "rut_tax_id",
  "rut tax id": "rut_tax_id",
  giro: "giro",
  pais: "pais",
  ciudad: "ciudad",
  comuna: "comuna",
  direccion: "direccion",
  "codigo postal": "codigo_postal",
  "nombre de la persona de contacto": "contacto",
  "nombre de contacto": "contacto",
  cargo: "cargo_contacto",
  "e mail de contacto": "email",
  "e mail de la persona de contacto": "email",
  "email de contacto": "email",
  email: "email",
  "cc e mail": "cc_email",
  "telefono de contacto": "telefono",
  "telefono de la persona de contacto": "telefono",
  "telefono empresa": "telefono_empresa",
  telefono: "telefono_empresa",
  "sitio web": "web",
  web: "web",
  "categoria de productos servicios": "categorias",
  categoria: "categorias",
  categorias: "categorias",
  "condiciones de pago": "condiciones_pago",
  "forma de pago": "forma_pago",
  moneda: "moneda",
  "nombre del banco": "banco",
  banco: "banco",
  "tipo de cuenta para pago": "tipo_cuenta",
  "tipo de cuenta": "tipo_cuenta",
  "numero de cuenta bancaria": "cuenta_bancaria",
  "numero de cuenta": "cuenta_bancaria",
  "tipo de contribuyente": "tipo_contribuyente",
  "regimen tributario": "regimen_tributario",
  "tipo de documento tributario": "tipo_doc",
  "nombre del representante legal": "rep_nombre",
  "nombre del representante legal de la empresa": "rep_nombre",
  "rut del representante legal": "rep_rut",
  "e mail del representante legal": "rep_email",
  "e mail del representante legal de la empresa": "rep_email",
};

function fieldValue(supplier: Supplier | null, key: keyof Supplier): string {
  if (!supplier) return "";
  if (key === "categorias") return joinCategories(supplier.categorias);
  const v = supplier[key];
  return v == null ? "" : String(v);
}

// ── Generación de la ficha .xlsx (Array-of-Arrays + estilos básicos) ──
export function buildFichaBuffer(supplier: Supplier | null): {
  buffer: ArrayBuffer;
  fileName: string;
} {
  const aoa: (string | number)[][] = [];
  aoa.push(["FICHA DE REGISTRO DE PROVEEDOR"]);
  aoa.push([]);
  aoa.push(["EMPRESA SOLICITANTE (emisor)"]);
  aoa.push(["Empresa", EMISOR.razon]);
  aoa.push(["RUT", EMISOR.rut]);
  aoa.push(["Email recepción facturas", EMISOR.emailFacturas]);
  aoa.push([]);

  for (const section of FICHA_SECTIONS) {
    aoa.push([section.title + " (a completar por el proveedor)"]);
    for (const f of section.fields) {
      aoa.push([f.label, fieldValue(supplier, f.key)]);
    }
    aoa.push([]);
  }

  aoa.push(["DECLARACIONES Y APROBACIONES"]);
  for (const f of REP_FIELDS) {
    aoa.push([f.label, fieldValue(supplier, f.key)]);
  }
  aoa.push(["Fecha", ""]);
  aoa.push(["Cargo del representante legal", ""]);
  aoa.push(["Firma", ""]);
  aoa.push(["Timbre", ""]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 46 }, { wch: 44 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ficha Proveedor");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

  const base = supplier?.razon_social || supplier?.nombre_fantasia || "proveedor";
  const fileName = `Ficha_Proveedor_${base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}.xlsx`;
  return { buffer: out, fileName };
}

// ── Parseo de una ficha .xlsx completada → campos detectados ──
export interface ParsedFicha {
  fields: Partial<SupplierInput>;
  detected: { label: string; value: string }[];
}

export function parseFichaBuffer(bytes: ArrayBuffer): ParsedFicha {
  const wb = XLSX.read(bytes, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("El archivo no contiene hojas válidas.");
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const fields: Partial<SupplierInput> = {};
  const detected: { label: string; value: string }[] = [];

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const label = String(row[0] ?? "").trim();
    const value = String(row[1] ?? "").trim();
    if (!label || !value) continue;
    const key = LABEL_SYNONYMS[normLabel(label)];
    if (!key) continue;
    if (key === "categorias") {
      fields.categorias = parseCategories(value);
    } else {
      // @ts-expect-error índice dinámico controlado por LABEL_SYNONYMS
      fields[key] = value;
    }
    detected.push({ label, value });
  }

  if (!fields.nombre_fantasia && fields.razon_social) {
    fields.nombre_fantasia = fields.razon_social;
  }
  return { fields, detected };
}
