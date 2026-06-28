import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Gate de autenticación: corre en todas las rutas salvo estáticos. Refresca la
// sesión de Supabase y redirige a /login si no hay usuario (cuando Supabase está
// configurado). En modo demo deja pasar todo.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Todo excepto estáticos de Next, favicon e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
