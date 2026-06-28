import { AppShell } from "@/components/shell/AppShell";
import { ProveedoresScreen } from "@/components/proveedores/ProveedoresScreen";
import { getSuppliers } from "@/lib/services/suppliers";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/auth";

// Datos siempre frescos: las Server Actions revalidan esta ruta tras escribir.
export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const [suppliers, user] = await Promise.all([getSuppliers(), getCurrentUser()]);
  return (
    <AppShell userEmail={user?.email}>
      <ProveedoresScreen
        initialSuppliers={suppliers}
        isLive={isSupabaseConfigured()}
      />
    </AppShell>
  );
}
