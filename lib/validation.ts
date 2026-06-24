// Validación con Zod, compartida cliente/servidor (issue §22: no confiar solo en
// el frontend). El formulario valida en vivo con estas reglas y la Server Action
// vuelve a validar antes de escribir.

import { z } from "zod";
import { ESTADOS, DOC_ESTADOS } from "@/lib/constants";

const optionalStr = z.string().trim().optional().default("");

export const supplierInputSchema = z.object({
  // Identificación
  razon_social: z.string().trim().min(1, "La razón social es obligatoria"),
  nombre_fantasia: optionalStr,
  codigo_sap: optionalStr, // opcional, alfanumérico (SAP-1001, 10002345, PROV-001…)
  rut_tax_id: optionalStr, // opcional en alta manual; requerido al importar (§13)
  giro: optionalStr,
  categorias: z
    .array(z.string().trim().min(1))
    .min(1, "Agrega al menos una categoría"),
  // Ubicación
  pais: z.string().trim().min(1, "El país es obligatorio"),
  ciudad: optionalStr,
  comuna: optionalStr,
  direccion: optionalStr,
  codigo_postal: optionalStr,
  telefono_empresa: optionalStr,
  web: optionalStr,
  // Contacto principal
  contacto: z.string().trim().min(1, "El contacto es obligatorio"),
  cargo_contacto: optionalStr,
  genero: optionalStr,
  telefono: optionalStr,
  email: z
    .string()
    .trim()
    .min(1, "El email es obligatorio")
    .email("Email inválido"),
  cc_email: z
    .string()
    .trim()
    .email("CC Email inválido")
    .optional()
    .or(z.literal("")),
  // Comercial / bancario
  condiciones_pago: optionalStr,
  forma_pago: optionalStr,
  tipo_doc: optionalStr,
  moneda: optionalStr,
  banco: optionalStr,
  tipo_cuenta: optionalStr,
  cuenta_bancaria: optionalStr,
  // Tributario
  tipo_contribuyente: optionalStr,
  regimen_tributario: optionalStr,
  // Representante legal
  rep_nombre: optionalStr,
  rep_rut: optionalStr,
  rep_email: z
    .string()
    .trim()
    .email("Email del rep. legal inválido")
    .optional()
    .or(z.literal("")),
  // Estados
  estado: z.enum(ESTADOS as [string, ...string[]]).default("Activo"),
  doc_estado: z.enum(DOC_ESTADOS as [string, ...string[]]).default("Pendiente"),
});

export type SupplierInputParsed = z.infer<typeof supplierInputSchema>;

// Aplana errores de Zod a { campo: mensaje } para pintarlos en el formulario.
export function flattenZodErrors(
  err: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
