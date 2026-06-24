import { redirect } from "next/navigation";

// El módulo activo de la plataforma es Proveedores.
export default function Home() {
  redirect("/proveedores");
}
