// Listas de opciones del módulo Proveedores. Centralizadas para que formulario,
// drawer, ficha .xlsx e importación compartan exactamente los mismos valores.

import type { SupplierEstado, DocEstado } from "@/lib/types";

export const ESTADOS: SupplierEstado[] = [
  "Activo",
  "Inactivo",
  "Pendiente",
  "Bloqueado",
];

export const DOC_ESTADOS: DocEstado[] = [
  "Pendiente",
  "Ficha generada",
  "Ficha importada",
  "PDF firmado pendiente",
  "PDF firmado recibido",
  "Validado",
  "Rechazado",
];

export const GENEROS = ["Femenino", "Masculino", "Otro"];

export const FORMA_PAGO = ["Transferencia Bancaria", "Vale Vista BCI"];

export const TIPO_DOC = [
  "Factura",
  "Factura No Afecta o Exenta",
  "Boleta de Honorarios",
];

export const CONDICION_PAGO = [
  "Contado",
  "Plazo",
  "Anticipado",
  "Primer Pago al Contado y Segundo Pago a Plazo",
  "Anticipo y restante contra entrega",
];

export const PLAZO_PAGO = ["0 días", "15 días", "30 días", "60 días"];

export const TIPO_CUENTA = [
  "Cuenta corriente",
  "Cuenta vista",
  "Cuenta de ahorro",
  "Cuenta RUT",
];

export const MONEDAS = ["CLP", "USD", "EUR", "UF"];

export const TIPO_CONTRIBUYENTE = [
  "Primera categoría",
  "Segunda categoría",
  "Pro pyme",
  "Régimen general",
  "Exento",
];

export const REGIMEN_TRIBUTARIO = [
  "Pro Pyme General (14 D N°3)",
  "Pro Pyme Transparente (14 D N°8)",
  "Régimen General (Semi Integrado)",
  "Renta Presunta",
  "Contribuyente no domiciliado",
];

export const PAISES = [
  "Chile",
  "Argentina",
  "Perú",
  "Bolivia",
  "Colombia",
  "México",
  "Brasil",
  "Uruguay",
  "España",
  "Estados Unidos",
  "China",
];

// Categorías sugeridas (autocompletado). La fuente real son las categorías
// presentes en los proveedores; esto solo siembra el datalist inicial.
export const CATEGORIAS_SEED = [
  "Perfiles",
  "Ferretería",
  "Electricidad",
  "EPP",
  "Lubricantes",
  "Servicios mecánicos",
  "Insumos químicos",
  "Tecnología",
  "Logística",
];

// Taxonomía Categoría → Subcategorías (el "tipo de material" de cada categoría).
// Al elegir una categoría en el formulario se sugieren sus subcategorías. Es
// extensible: las subcategorías son de texto libre, así que el usuario puede
// agregar otras aunque la categoría no esté mapeada aquí.
// TODO(taxonomía): completar con el catálogo real de materiales por categoría.
export const CATEGORIA_SUBCATEGORIAS: Record<string, string[]> = {
  Perfiles: [
    "Perimetral",
    "Travesaño",
    "Montante",
    "Canal",
    "Omega",
    "Esquinero",
  ],
};

// Sugerencias de subcategoría para las categorías seleccionadas. Si ninguna de
// las categorías está mapeada, ofrece todas las subcategorías conocidas.
export function subcategoriaSuggestions(categorias: string[]): string[] {
  const norm = (s: string) => s.trim().toLowerCase();
  const out = new Set<string>();
  for (const c of categorias) {
    const key = Object.keys(CATEGORIA_SUBCATEGORIAS).find(
      (k) => norm(k) === norm(c),
    );
    if (key) CATEGORIA_SUBCATEGORIAS[key].forEach((s) => out.add(s));
  }
  if (out.size === 0) {
    Object.values(CATEGORIA_SUBCATEGORIAS)
      .flat()
      .forEach((s) => out.add(s));
  }
  return Array.from(out);
}

// Etiquetas de los campos que el proveedor completa en la ficha .xlsx (chips de
// previsualización en el modal de ficha). Espejo client-safe de FICHA_SECTIONS
// en lib/ficha/excel.ts (que es server-only por importar SheetJS).
export const FICHA_FIELD_LABELS = [
  "Razón social",
  "Nombre de fantasía",
  "RUT / Tax ID",
  "Giro",
  "País",
  "Región",
  "Ciudad",
  "Comuna",
  "Dirección",
  "Código postal",
  "Nombre de contacto",
  "Cargo",
  "E-mail",
  "Teléfono",
  "Condición de pago",
  "Plazo de pago",
  "Forma de pago",
  "Moneda",
  "Banco",
  "Tipo de cuenta",
  "N° de cuenta",
  "Tipo de documento tributario",
  "Representante legal",
  "Firma",
];

// Mapa de color para el badge de estado del proveedor → modificadores .badge
// del mockup (ver app/mockup.css: .badge.status-*).
export const ESTADO_BADGE: Record<SupplierEstado, string> = {
  Activo: "status-complete",
  Inactivo: "status-pending",
  Pendiente: "status-partial",
  Bloqueado: "status-urgent",
};
