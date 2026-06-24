// Empresas emisoras (compradoras) que solicitan la ficha al proveedor. Al generar
// la ficha .xlsx el usuario elige una; sus datos rellenan automáticamente la
// sección EMPRESA SOLICITANTE. Este archivo es client-safe (sin "server-only"):
// lo consumen el selector en la UI y la generación de la ficha en el servidor.

export interface EmisorCompany {
  key: string;
  razon: string;
  rut: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  emailFacturas: string;
}

export const EMISOR_COMPANIES: EmisorCompany[] = [
  {
    key: "knauf_chile",
    razon: "Knauf Chile SpA",
    rut: "76.201.342-8",
    giro: "Imp. Exp. Fab. Planchas Yeso, venta al por mayor y menor de Mat",
    direccion: "Avenida del Valle Sur 650, Piso 2, Of 21 y 22",
    comuna: "Huechuraba",
    ciudad: "Santiago",
    emailFacturas: "knaufadmin_dte@paperless.cl",
  },
  {
    key: "knauf_aquapanel",
    razon: "Knauf Aquapanel SpA",
    rut: "76.908.529-7",
    giro: "Fabricación de cemento, cal y yeso",
    direccion: "Avenida Juanita Oriente 01751",
    comuna: "Puente Alto",
    ciudad: "Santiago",
    emailFacturas: "aquapaneladmin@paperless.cl",
  },
];

export const DEFAULT_EMISOR_KEY = EMISOR_COMPANIES[0].key;

// Resuelve la empresa emisora por su `key`; cae a la primera si no coincide.
export function emisorByKey(key: string | null | undefined): EmisorCompany {
  return EMISOR_COMPANIES.find((c) => c.key === key) ?? EMISOR_COMPANIES[0];
}
