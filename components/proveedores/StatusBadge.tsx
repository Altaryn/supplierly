import { ESTADO_BADGE } from "@/lib/constants";
import type { SupplierEstado } from "@/lib/types";

export function StatusBadge({ estado }: { estado: SupplierEstado }) {
  return <span className={`badge ${ESTADO_BADGE[estado]}`}>{estado}</span>;
}
