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

export const FORMA_PAGO = [
  "Transferencia electrónica",
  "Cheque",
  "Efectivo",
  "Tarjeta",
  "Pago a la vista",
];

export const TIPO_DOC = [
  "Factura electrónica",
  "Boleta",
  "Factura exenta",
  "Nota de honorarios",
];

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
  "Ferretería",
  "Electricidad",
  "EPP",
  "Lubricantes",
  "Servicios mecánicos",
  "Insumos químicos",
  "Tecnología",
  "Logística",
];

// Etiquetas de los campos que el proveedor completa en la ficha .xlsx (chips de
// previsualización en el modal de ficha). Espejo client-safe de FICHA_SECTIONS
// en lib/ficha/excel.ts (que es server-only por importar SheetJS).
export const FICHA_FIELD_LABELS = [
  "Razón social",
  "Nombre de fantasía",
  "Código SAP",
  "RUT / Tax ID",
  "Giro",
  "País",
  "Ciudad",
  "Dirección",
  "Nombre de contacto",
  "Cargo",
  "E-mail",
  "Teléfono",
  "Categoría",
  "Condiciones de pago",
  "Forma de pago",
  "Moneda",
  "Banco",
  "Tipo de cuenta",
  "N° de cuenta",
  "Tipo de contribuyente",
  "Régimen tributario",
  "Representante legal",
  "Firma y timbre",
];

// Mapa de color para el badge de estado del proveedor → modificadores .badge
// del mockup (ver app/mockup.css: .badge.status-*).
export const ESTADO_BADGE: Record<SupplierEstado, string> = {
  Activo: "status-complete",
  Inactivo: "status-pending",
  Pendiente: "status-partial",
  Bloqueado: "status-urgent",
};
