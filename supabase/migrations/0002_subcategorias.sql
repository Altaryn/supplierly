-- Migración 0002: agrega la columna `subcategorias` (tipo de material por
-- categoría) al maestro de proveedores. Idempotente.
--
-- Si tu despliegue ya está conectado a Supabase (modo live), ejecuta este SQL
-- en Supabase Studio → SQL Editor ANTES de usar la nueva versión, o el alta/
-- edición de proveedores fallará al escribir la columna inexistente.

alter table public.suppliers
  add column if not exists subcategorias text[] not null default '{}';

create index if not exists idx_suppliers_subcategorias
  on public.suppliers using gin (subcategorias);
