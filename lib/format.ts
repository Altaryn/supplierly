// Helpers de formato y normalización, portados del mockup (app.js) para que la
// app funcional se comporte igual: categorías, slug de archivos, inferencias al
// importar, validación de email, tamaño de archivo, iniciales del avatar.

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

export function joinCategories(cats: string[] | null | undefined): string {
  return Array.isArray(cats) ? cats.filter(Boolean).join(", ") : "";
}

export function parseCategories(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  if (value == null) return [];
  return String(value)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function slug(s: string): string {
  return (
    String(s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "proveedor"
  );
}

// Normaliza una etiqueta para matching tolerante (ficha .xlsx → campo interno).
export function normLabel(s: unknown): string {
  return String(s == null ? "" : s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function todayISO(): string {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function fmtBytes(n: number): string {
  n = Number(n) || 0;
  if (n < 1024) return n + " B";
  if (n < 1048576) return Math.round(n / 1024) + " KB";
  return (n / 1048576).toFixed(1) + " MB";
}

export function initials(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

// ── Inferencia de género y país al importar (heurística del mockup) ──
const NAMES_F = new Set(["maria","camila","valentina","andrea","paula","francisca","javiera","catalina","constanza","antonia","sofia","isidora","fernanda","daniela","carolina","patricia","rosa","ana","claudia","veronica","gabriela","natalia","barbara","monica","alejandra","marcela","pamela","cecilia","lorena","ximena","carmen","elena","laura","beatriz","teresa","raquel","silvia","nicole","ignacia","josefa","martina","emilia","florencia","agustina","trinidad","amanda","paz","macarena"]);
const NAMES_M = new Set(["jose","juan","rodrigo","diego","felipe","jorge","hector","carlos","luis","pedro","pablo","andres","cristian","sebastian","matias","benjamin","vicente","tomas","nicolas","francisco","manuel","ricardo","gonzalo","ignacio","alejandro","fernando","mauricio","marcelo","patricio","rafael","victor","eduardo","claudio","rene","oscar","gabriel","daniel","alberto","roberto","enrique","esteban","camilo","joaquin","agustin","martin","maximiliano","alvaro","hernan"]);

export function inferGender(fullName: string): string {
  const first = String(fullName || "").trim().split(/\s+/)[0] || "";
  const n = first.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (!n) return "";
  if (NAMES_F.has(n)) return "Femenino";
  if (NAMES_M.has(n)) return "Masculino";
  if (/(a|ia|ela|ina)$/.test(n)) return "Femenino";
  if (/(o|os|el|an|in|or|er)$/.test(n)) return "Masculino";
  return "";
}

const CC_COUNTRY: Record<string, string> = { "56":"Chile","54":"Argentina","51":"Perú","591":"Bolivia","57":"Colombia","52":"México","55":"Brasil","598":"Uruguay","34":"España","1":"Estados Unidos","86":"China" };

export function inferCountry(phone: string): string {
  const m = String(phone || "").replace(/[^\d+]/g, "").match(/^\+?(\d{1,3})/);
  if (m) {
    const d = m[1];
    for (const len of [3, 2, 1]) {
      const p = d.slice(0, len);
      if (CC_COUNTRY[p]) return CC_COUNTRY[p];
    }
  }
  return "";
}
