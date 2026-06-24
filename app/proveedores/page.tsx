import { AppShell } from "@/components/shell/AppShell";
import { ProveedoresScreen } from "@/components/proveedores/ProveedoresScreen";
import { getSuppliers } from "@/lib/services/suppliers";
import { isSupabaseConfigured } from "@/lib/env";

// Datos siempre frescos: las Server Actions revalidan esta ruta tras escribir.
export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const suppliers = await getSuppliers();
  return (
    <AppShell>
      <ProveedoresScreen
        initialSuppliers={suppliers}
        isLive={isSupabaseConfigured()}
      />
    </AppShell>
  );
}
