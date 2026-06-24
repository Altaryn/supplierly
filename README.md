# Supplierly — Módulo Proveedores

Implementación funcional del **módulo Proveedores** (issue KNO-79), portado 1:1
desde el mockup `quotify-mockup` a una app real con **Next.js 15 + TypeScript +
Tailwind v4 + Supabase**, lista para desplegar en **Vercel**.

Mantiene 100% de fidelidad visual con el mockup (sistema de diseño, layout,
sidebar, topbar, tablas, modales, drawer, badges, temas claro/oscuro) y añade el
backend real: CRUD, búsqueda/filtros, generación e importación de ficha `.xlsx`,
carga de PDF firmado a Storage, gestión documental y trazabilidad.

## Modo demo (arranca sin configurar nada)

Sin variables de Supabase, la app corre en **modo demo**: lee un set de
proveedores de ejemplo en memoria y simula las escrituras (no se persisten). Es
totalmente navegable para revisar el diseño y los flujos.

```bash
npm install
npm run dev      # http://localhost:3000  → redirige a /proveedores
```

## Conectar Supabase (modo real)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL**: abre *SQL Editor → New query*, pega y ejecuta
   [`supabase/schema.sql`](supabase/schema.sql). Crea las tablas `suppliers`,
   `supplier_documents`, `supplier_audit_logs`, índices de búsqueda, RLS,
   trigger `updated_at` y el bucket de Storage `supplier-docs`.
   (El mismo contenido está versionado en `supabase/migrations/` para flujos CLI.)
3. **Variables**: copia `.env.example` a `.env.local` y completa:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...        # Settings → API → anon public
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...            # Settings → API → service_role (¡solo servidor!)
   SUPABASE_STORAGE_BUCKET=supplier-docs
   ```

4. `npm run dev`. El banner del módulo pasará de **Modo demo** a **Conectado a
   Supabase**.

> **Seguridad**: el `anon key` es público por diseño y solo permite lectura
> (RLS). Las escrituras y subidas a Storage pasan por **Server Actions** que usan
> el `service_role` en el servidor (nunca llega al navegador). La validación es
> doble: cliente (Zod en el formulario) y servidor (Zod antes de escribir).

## Deploy en Vercel

1. Importa el repo en Vercel (framework Next.js, autodetectado).
2. En *Project → Settings → Environment Variables* añade las cuatro variables de
   arriba.
3. Deploy. El build ya está validado (`npm run build`).

## Cambios de campos solicitados (§7)

| Cambio | Estado |
| --- | --- |
| `Proveedor` → **Razón Social** (obligatorio) | ✅ campo principal del formulario |
| **Nombre de Fantasía** (debajo de Razón Social) | ✅ buscable, visible, editable |
| **Código SAP** (opcional, alfanumérico) | ✅ columna en tabla, búsqueda y filtros |
| **Estado** (Activo/Inactivo/Pendiente/Bloqueado) | ✅ badge + filtro |

## Funcionalidades

- **CRUD** completo (crear, editar, ver detalle en drawer, eliminar con confirmación).
- **Búsqueda parcial e instantánea** (debounced) por razón social, nombre de
  fantasía, código SAP, categoría, país, ciudad, RUT, email y estado; filtros por
  categoría y estado.
- **Ficha `.xlsx`**: generación con SheetJS (secciones General / Contacto /
  Comercial / Tributaria / Declaraciones), descarga automática y archivado en
  Storage.
- **Importación `.xlsx`**: carga → parseo → vista previa → completar
  (categoría/CC/web + PDF opcional) → detección de duplicados (RUT / Código SAP /
  Razón social) → crear o actualizar.
- **PDF firmado**: subida a Supabase Storage, ver/descargar, estado documental.
- **Gestión documental** y **trazabilidad** (`supplier_audit_logs`) en el drawer.
- **Responsive**: tabla en desktop/tablet, tarjetas en móvil; temas claro/oscuro.

## Estructura

```
app/
  layout.tsx                  Root: fuentes, bootstrap de tema, globals.css
  globals.css                 Tailwind v4 + mockup.css (diseño portado) + supplements.css
  page.tsx                    Redirige a /proveedores
  proveedores/
    page.tsx                  Server Component: carga proveedores (SSR) + shell
    actions.ts                Server Actions: CRUD, ficha, import, PDF, auditoría
components/
  shell/                      AppShell, Sidebar, Topbar, ThemeToggle
  proveedores/                ProveedoresScreen, SupplierModal, SupplierDrawer,
                              ImportModal, FichaModal, ConfirmDialog, TagInput, StatusBadge
  ui/                         Modal, Toast
  icons.tsx
lib/
  types.ts  validation.ts  constants.ts  format.ts  env.ts  events.ts  supplier-form.ts
  supabase/{client,server,admin}.ts
  services/suppliers.ts       Lecturas + mutaciones + Storage + auditoría (fallback demo)
  ficha/excel.ts              Generación y parseo de ficha .xlsx (SheetJS)
  data/mock.ts                Proveedores demo
  client/files.ts             Helpers base64/descarga (navegador)
supabase/
  schema.sql                  Esquema completo idempotente
  migrations/0001_*.sql       Migración inicial
```

## Scripts

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```
