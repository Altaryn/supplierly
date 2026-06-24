-- ============================================================================
-- Supplierly — esquema del módulo Proveedores (Supabase / PostgreSQL)
--
-- Ejecuta este archivo completo en: Supabase Studio → SQL Editor → New query.
-- Es idempotente (usa IF NOT EXISTS / CREATE OR REPLACE) y deja listo:
--   • tablas  suppliers / supplier_documents / supplier_audit_logs
--   • índices de búsqueda
--   • trigger updated_at
--   • RLS (lectura pública anon · escritura solo service_role)
--   • bucket de Storage  supplier-docs  + políticas
-- ============================================================================

create extension if not exists pgcrypto;

-- ─────────────────────────────── suppliers ─────────────────────────────────
create table if not exists public.suppliers (
  id                  uuid primary key default gen_random_uuid(),
  -- Identificación
  razon_social        text not null,
  nombre_fantasia     text not null default '',
  codigo_sap          text,                       -- opcional, alfanumérico
  rut_tax_id          text not null default '',
  giro                text not null default '',
  categorias          text[] not null default '{}',
  subcategorias       text[] not null default '{}',  -- tipo de material por categoría
  -- Ubicación
  pais                text not null default '',
  ciudad              text not null default '',
  comuna              text not null default '',
  direccion           text not null default '',
  codigo_postal       text not null default '',
  telefono_empresa    text not null default '',
  web                 text not null default '',
  -- Contacto principal
  contacto            text not null default '',
  cargo_contacto      text not null default '',
  genero              text not null default '',
  telefono            text not null default '',
  email               text not null default '',
  cc_email            text not null default '',
  -- Comercial / bancario
  condiciones_pago    text not null default '',
  forma_pago          text not null default '',
  tipo_doc            text not null default '',
  moneda              text not null default 'CLP',
  banco               text not null default '',
  tipo_cuenta         text not null default '',
  cuenta_bancaria     text not null default '',
  -- Tributario
  tipo_contribuyente  text not null default '',
  regimen_tributario  text not null default '',
  -- Representante legal
  rep_nombre          text not null default '',
  rep_rut             text not null default '',
  rep_email           text not null default '',
  -- Estados
  estado              text not null default 'Activo'
                        check (estado in ('Activo','Inactivo','Pendiente','Bloqueado')),
  doc_estado          text not null default 'Pendiente',
  -- Auditoría
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Índices de búsqueda (issue §25). trigram para búsqueda parcial rápida.
create extension if not exists pg_trgm;
create index if not exists idx_suppliers_razon_social on public.suppliers using gin (razon_social gin_trgm_ops);
create index if not exists idx_suppliers_nombre_fantasia on public.suppliers using gin (nombre_fantasia gin_trgm_ops);
create index if not exists idx_suppliers_codigo_sap on public.suppliers (codigo_sap);
create index if not exists idx_suppliers_rut on public.suppliers (rut_tax_id);
create index if not exists idx_suppliers_pais on public.suppliers (pais);
create index if not exists idx_suppliers_ciudad on public.suppliers (ciudad);
create index if not exists idx_suppliers_email on public.suppliers (email);
create index if not exists idx_suppliers_estado on public.suppliers (estado);
create index if not exists idx_suppliers_categorias on public.suppliers using gin (categorias);
create index if not exists idx_suppliers_subcategorias on public.suppliers using gin (subcategorias);

-- ────────────────────────── supplier_documents ─────────────────────────────
create table if not exists public.supplier_documents (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid not null references public.suppliers(id) on delete cascade,
  document_type text not null check (document_type in ('generated_xlsx','imported_xlsx','signed_pdf')),
  file_name     text not null,
  file_path     text not null,
  file_url      text,
  mime_type     text not null default '',
  file_size     bigint not null default 0,
  status        text not null default 'uploaded'
                  check (status in ('pending','uploaded','validated','rejected','replaced')),
  version       integer not null default 1,
  uploaded_at   timestamptz not null default now(),
  uploaded_by   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_supplier_documents_supplier on public.supplier_documents (supplier_id);
create index if not exists idx_supplier_documents_type on public.supplier_documents (document_type);

-- ────────────────────────── supplier_audit_logs ────────────────────────────
create table if not exists public.supplier_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  action      text not null,
  description text not null default '',
  metadata    jsonb,
  created_at  timestamptz not null default now(),
  created_by  text
);
create index if not exists idx_supplier_audit_supplier on public.supplier_audit_logs (supplier_id);
create index if not exists idx_supplier_audit_created on public.supplier_audit_logs (created_at desc);

-- ───────────────────────── trigger updated_at ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_suppliers_updated on public.suppliers;
create trigger trg_suppliers_updated before update on public.suppliers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_supplier_documents_updated on public.supplier_documents;
create trigger trg_supplier_documents_updated before update on public.supplier_documents
  for each row execute function public.set_updated_at();

-- ─────────────────────────────── RLS ───────────────────────────────────────
-- Lectura pública con la anon key (la app lee así); escritura solo vía
-- service_role (las Server Actions). service_role siempre salta RLS.
alter table public.suppliers          enable row level security;
alter table public.supplier_documents enable row level security;
alter table public.supplier_audit_logs enable row level security;

drop policy if exists "suppliers_read" on public.suppliers;
create policy "suppliers_read" on public.suppliers for select to anon, authenticated using (true);

drop policy if exists "supplier_documents_read" on public.supplier_documents;
create policy "supplier_documents_read" on public.supplier_documents for select to anon, authenticated using (true);

drop policy if exists "supplier_audit_read" on public.supplier_audit_logs;
create policy "supplier_audit_read" on public.supplier_audit_logs for select to anon, authenticated using (true);

-- ───────────────────────────── Storage ─────────────────────────────────────
-- Bucket privado para la documentación de proveedores.
insert into storage.buckets (id, name, public)
values ('supplier-docs', 'supplier-docs', false)
on conflict (id) do nothing;

-- Lectura del bucket con anon (la app usa URLs firmadas vía service_role; esta
-- política permite además lectura directa si decides hacerlo público).
drop policy if exists "supplier_docs_read" on storage.objects;
create policy "supplier_docs_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'supplier-docs');
