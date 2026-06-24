// Helpers de formulario y filtrado del lado cliente (puros, sin dependencias de
// servidor). Centralizan la forma vacía del formulario, el mapeo desde un
// Supplier existente y la lógica de búsqueda/filtro (issue §9).

import type { Supplier, SupplierInput } from "@/lib/types";
import { joinCategories } from "@/lib/format";

export function emptyInput(): SupplierInput {
  return {
    razon_social: "",
    nombre_fantasia: "",
    codigo_sap: "",
    rut_tax_id: "",
    giro: "",
    categorias: [],
    subcategorias: [],
    empresa: "",
    pais: "",
    ciudad: "",
    comuna: "",
    direccion: "",
    codigo_postal: "",
    telefono_empresa: "",
    web: "",
    contacto: "",
    cargo_contacto: "",
    genero: "",
    telefono: "",
    email: "",
    cc_email: "",
    condiciones_pago: "",
    forma_pago: "",
    tipo_doc: "",
    moneda: "CLP",
    banco: "",
    tipo_cuenta: "",
    cuenta_bancaria: "",
    tipo_contribuyente: "",
    regimen_tributario: "",
    rep_nombre: "",
    rep_rut: "",
    rep_email: "",
    estado: "Activo",
    doc_estado: "Pendiente",
  };
}

// Proveedor "en blanco" (id vacío) para generar una ficha plantilla sin datos
// precargados desde la barra de herramientas.
export function blankSupplier(): Supplier {
  return { ...emptyInput(), id: "", created_at: "", updated_at: "" };
}

export function toInput(s: Supplier): SupplierInput {
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = s;
  void _id;
  void _c;
  void _u;
  return { ...rest };
}

// Predicado de búsqueda parcial e insensible a mayúsculas/acentos sobre los
// campos exigidos por la issue: razón social, nombre fantasía, código SAP,
// categoría, país, ciudad, RUT, email y estado.
function norm(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function matchesSearch(s: Supplier, query: string): boolean {
  const q = norm(query.trim());
  if (!q) return true;
  const haystack = norm(
    [
      s.razon_social,
      s.nombre_fantasia,
      s.codigo_sap,
      joinCategories(s.categorias),
      joinCategories(s.subcategorias),
      s.empresa,
      s.pais,
      s.ciudad,
      s.rut_tax_id,
      s.email,
      s.estado,
      s.contacto,
    ].join(" "),
  );
  return haystack.includes(q);
}

export function filterSuppliers(
  list: Supplier[],
  opts: { search: string; cat: string; estado: string },
): Supplier[] {
  return list.filter((s) => {
    if (!matchesSearch(s, opts.search)) return false;
    if (opts.cat && !s.categorias.includes(opts.cat)) return false;
    if (opts.estado && s.estado !== opts.estado) return false;
    return true;
  });
}

export function allCategories(list: Supplier[]): string[] {
  const set = new Set<string>();
  for (const s of list) for (const c of s.categorias) if (c) set.add(c);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
