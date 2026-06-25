import "server-only";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { normLabel, joinCategories, parseCategories } from "@/lib/format";
import { emisorByKey } from "@/lib/companies";
import { CONDICION_PAGO, PLAZO_PAGO, FORMA_PAGO, TIPO_DOC, TIPO_CUENTA } from "@/lib/constants";
import { REGIONES_CHILE, COMUNAS_CHILE, CIUDADES_CHILE } from "@/lib/data/chile";
import { KNAUF_LOGO_BASE64 } from "./knauf-logo";
import type { Supplier, SupplierInput } from "@/lib/types";

// Campos del proveedor en la ficha, agrupados según las secciones de la issue
// (§12). `key` es el campo interno (omitido en campos solo-plantilla como Región
// o Plazo de pago); `label` es lo que ve el proveedor; `list` referencia una de
// las listas desplegables (validación de datos) definidas en la hoja "Listas".
interface FichaField {
  key?: keyof Supplier;
  label: string;
  list?: ListName;
}
interface FichaSection {
  title: string;
  fields: FichaField[];
}

// Listas desplegables disponibles en la ficha.
type ListName =
  | "region"
  | "ciudad"
  | "comuna"
  | "condicion_pago"
  | "plazo_pago"
  | "forma_pago"
  | "tipo_cuenta"
  | "tipo_doc";

// Origen de cada lista. Las geográficas se ordenan alfabéticamente.
const LIST_SOURCES: Record<ListName, string[]> = {
  region: REGIONES_CHILE,
  ciudad: [...CIUDADES_CHILE].sort((a, b) => a.localeCompare(b, "es")),
  comuna: [...COMUNAS_CHILE].sort((a, b) => a.localeCompare(b, "es")),
  condicion_pago: CONDICION_PAGO,
  plazo_pago: PLAZO_PAGO,
  forma_pago: FORMA_PAGO,
  tipo_cuenta: TIPO_CUENTA,
  tipo_doc: TIPO_DOC,
};

// Listas con opciones cerradas (rechazan otros valores). Las geográficas quedan
// "blandas" (sugieren pero permiten escribir otra, por si falta una localidad).
const STRICT_LISTS = new Set<ListName>([
  "condicion_pago",
  "plazo_pago",
  "forma_pago",
  "tipo_cuenta",
  "tipo_doc",
]);

export const FICHA_SECTIONS: FichaSection[] = [
  {
    title: "INFORMACIÓN GENERAL",
    fields: [
      { key: "razon_social", label: "Razón social" },
      { key: "nombre_fantasia", label: "Nombre de fantasía" },
      { key: "rut_tax_id", label: "RUT / Tax ID" },
      { key: "giro", label: "Giro" },
      { key: "pais", label: "País" },
      { label: "Región", list: "region" },
      { key: "ciudad", label: "Ciudad", list: "ciudad" },
      { key: "comuna", label: "Comuna", list: "comuna" },
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
      { key: "telefono", label: "Teléfono de contacto" },
    ],
  },
  {
    title: "INFORMACIÓN COMERCIAL",
    fields: [
      { key: "condiciones_pago", label: "Condición de pago", list: "condicion_pago" },
      { label: "Plazo de pago", list: "plazo_pago" },
      { key: "forma_pago", label: "Forma de pago", list: "forma_pago" },
      { key: "moneda", label: "Moneda" },
      { key: "banco", label: "Nombre del banco" },
      { key: "tipo_cuenta", label: "Tipo de cuenta para pago", list: "tipo_cuenta" },
      { key: "cuenta_bancaria", label: "Número de cuenta bancaria (solo números)" },
    ],
  },
  {
    title: "INFORMACIÓN TRIBUTARIA",
    fields: [
      { key: "tipo_doc", label: "Tipo de documento tributario", list: "tipo_doc" },
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
// (incluye los labels del mockup original). Se conservan "codigo sap" y
// "telefono empresa" para seguir importando fichas antiguas que aún los traigan,
// aunque la ficha nueva ya no los genere.
const LABEL_SYNONYMS: Record<string, keyof Supplier> = {
  "razon social": "razon_social",
  "nombre de fantasia": "nombre_fantasia",
  // "Empresa" de la sección EMPRESA SOLICITANTE → empresa emisora del proveedor.
  empresa: "empresa",
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
  "condicion de pago": "condiciones_pago",
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

function fieldValue(supplier: Supplier | null, key?: keyof Supplier): string {
  if (!supplier || !key) return "";
  if (key === "categorias") return joinCategories(supplier.categorias);
  const v = supplier[key];
  return v == null ? "" : String(v);
}

// ── Paleta y estilos de la ficha ──
// El tema cambia según la empresa emisora para diferenciarlas de un vistazo:
// Knauf Chile en celeste (azul corporativo) y Knauf Aquapanel en verde claro.
interface FichaTheme {
  title: string; // color del texto del título
  header: string; // relleno de los encabezados de sección
  label: string; // relleno de los enunciados (etiquetas)
}
const THEMES: Record<string, FichaTheme> = {
  knauf_chile: { title: "FF00A0E1", header: "FFAEDDF6", label: "FFD6EEFB" },
  knauf_aquapanel: { title: "FF4E9A2E", header: "FFCDE9B5", label: "FFE6F4DA" },
};
const DEFAULT_THEME = THEMES.knauf_chile;
const TEXT_DARK = "FF1F2937";
const TEXT_VALUE = "FF111827";

const ALL_BORDERS: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

// ── Generación de la ficha .xlsx con ExcelJS (logo, colores, bordes, firma) ──
// `emisorKey` selecciona la empresa solicitante (Knauf Chile / Knauf Aquapanel),
// cuyos datos rellenan la sección EMPRESA SOLICITANTE.
export async function buildFichaBuffer(
  supplier: Supplier | null,
  emisorKey?: string | null,
): Promise<{ buffer: ArrayBuffer; fileName: string }> {
  const emisor = emisorByKey(emisorKey);
  const theme = THEMES[emisor.key] ?? DEFAULT_THEME;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Supplierly";
  const ws = wb.addWorksheet("Ficha Proveedor", {
    views: [{ showGridLines: false }],
  });
  ws.columns = [{ width: 42 }, { width: 54 }];

  // ── Hoja oculta "Listas": fuente de las validaciones de datos (desplegables).
  // Cada lista va en su propia columna; se referencia por rango. Para listas
  // largas (comunas/ciudades) no se puede usar la fórmula inline de 255 chars.
  const listsWs = wb.addWorksheet("Listas", { state: "hidden" });
  // Letra de columna desde el índice (1→A, 26→Z, 27→AA…); robusto ante cualquier
  // número de listas (evita quedarse sin letras al agregar una nueva).
  const colLetter = (n: number): string => {
    let s = "";
    while (n > 0) {
      const m = (n - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };
  const listRanges = {} as Record<ListName, string>;
  (Object.keys(LIST_SOURCES) as ListName[]).forEach((name, idx) => {
    const arr = LIST_SOURCES[name];
    const col = idx + 1;
    const letter = colLetter(col);
    arr.forEach((v, i) => {
      listsWs.getCell(i + 1, col).value = v; // (fila, columna) numéricos
    });
    listRanges[name] = `Listas!$${letter}$1:$${letter}$${arr.length}`;
  });

  // ── Encabezado: logo arriba-izquierda + título al centro ──
  ws.mergeCells("A1:B3");
  const titleCell = ws.getCell("A1");
  titleCell.value = "FICHA DE REGISTRO DE PROVEEDOR";
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: theme.title } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 28;
  ws.getRow(2).height = 28;
  ws.getRow(3).height = 28;

  const logoId = wb.addImage({ base64: KNAUF_LOGO_BASE64, extension: "png" });
  // Tamaño acorde (~168×85 px, conserva el ratio 2363×1196 del original).
  // Flotante sobre la esquina superior izquierda, sin invadir el título centrado.
  ws.addImage(logoId, {
    tl: { col: 0.12, row: 0.35 },
    ext: { width: 168, height: 85 },
    editAs: "oneCell",
  });

  // ── Helpers de construcción de filas ──
  const sectionHeader = (title: string) => {
    const row = ws.addRow([title]);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    const c = row.getCell(1);
    c.font = { bold: true, size: 11, color: { argb: TEXT_DARK } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.header } };
    c.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    c.border = ALL_BORDERS;
    row.getCell(2).border = ALL_BORDERS;
    row.height = 22;
  };

  const dataRow = (label: string, value: string, list?: ListName) => {
    const row = ws.addRow([label, value]);
    const lab = row.getCell(1);
    lab.font = { size: 10, color: { argb: TEXT_DARK } };
    lab.fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.label } };
    lab.alignment = { horizontal: "left", vertical: "middle", indent: 1, wrapText: true };
    lab.border = ALL_BORDERS;
    const val = row.getCell(2);
    val.font = { size: 10, color: { argb: TEXT_VALUE } };
    val.alignment = { horizontal: "left", vertical: "middle", indent: 1, wrapText: true };
    val.border = ALL_BORDERS;
    // Desplegable (validación de lista) sobre la celda de valor.
    if (list) {
      const strict = STRICT_LISTS.has(list);
      val.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [listRanges[list]],
        showErrorMessage: strict,
        errorStyle: "warning",
        errorTitle: "Valor fuera de la lista",
        error: "Selecciona una opción del desplegable.",
        showInputMessage: false,
      };
    }
    // Altura automática: no se fija para permitir que Excel ajuste el alto
    // cuando un valor largo (giro, dirección) hace wrap.
  };

  const spacer = (h = 6) => {
    ws.addRow([]).height = h;
  };

  // ── EMPRESA SOLICITANTE (rellenada desde la empresa emisora elegida) ──
  // Etiquetas con sufijo "de la empresa" a propósito: evitan colisionar con los
  // sinónimos del proveedor (RUT, Giro, Dirección…) al reimportar la ficha.
  spacer(6);
  sectionHeader("EMPRESA SOLICITANTE");
  dataRow("Empresa", emisor.razon);
  dataRow("RUT de la empresa", emisor.rut);
  dataRow("Giro de la empresa", emisor.giro);
  dataRow("Dirección de la empresa", emisor.direccion);
  dataRow("Comuna de la empresa", emisor.comuna);
  dataRow("Ciudad de la empresa", emisor.ciudad);
  dataRow("Email recepción facturas", emisor.emailFacturas);
  spacer();

  // ── Secciones que completa el proveedor ──
  for (const section of FICHA_SECTIONS) {
    sectionHeader(section.title + " (a completar por el proveedor)");
    for (const f of section.fields) {
      dataRow(f.label, fieldValue(supplier, f.key), f.list);
    }
    spacer();
  }

  // ── Declaraciones y firma del representante legal ──
  sectionHeader("DECLARACIONES Y APROBACIONES");
  for (const f of REP_FIELDS) {
    dataRow(f.label, fieldValue(supplier, f.key));
  }
  dataRow("Fecha", "");

  // Campo de firma agrandado (sin timbre): etiqueta + caja alta para firmar.
  const firmaStart = ws.addRow(["Firma del representante legal", ""]).number;
  const FIRMA_ROWS = 5;
  for (let i = 1; i < FIRMA_ROWS; i++) ws.addRow([]);
  const firmaEnd = firmaStart + FIRMA_ROWS - 1;
  ws.mergeCells(`A${firmaStart}:A${firmaEnd}`);
  ws.mergeCells(`B${firmaStart}:B${firmaEnd}`);
  const firmaLab = ws.getCell(`A${firmaStart}`);
  firmaLab.value = "Firma del representante legal";
  firmaLab.font = { size: 10, color: { argb: TEXT_DARK } };
  firmaLab.fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.label } };
  firmaLab.alignment = { horizontal: "left", vertical: "middle", indent: 1, wrapText: true };
  ws.getCell(`B${firmaStart}`).alignment = { horizontal: "center", vertical: "bottom" };
  for (let rr = firmaStart; rr <= firmaEnd; rr++) {
    ws.getRow(rr).height = 26;
    ws.getCell(`A${rr}`).border = ALL_BORDERS;
    ws.getCell(`B${rr}`).border = ALL_BORDERS;
  }

  const written = await wb.xlsx.writeBuffer();
  const nodeBuf = written as unknown as Buffer;
  const buffer = nodeBuf.buffer.slice(
    nodeBuf.byteOffset,
    nodeBuf.byteOffset + nodeBuf.byteLength,
  ) as ArrayBuffer;

  const base = supplier?.razon_social || supplier?.nombre_fantasia || "proveedor";
  const fileName = `Ficha_Proveedor_${base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}.xlsx`;
  return { buffer, fileName };
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
