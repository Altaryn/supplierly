-- Migración 0003: agrega la columna `empresa` (empresa solicitante/emisora a la
-- que corresponde el proveedor) al maestro de proveedores. Idempotente.
--
-- En modo live (Supabase) ejecuta este SQL en Supabase Studio → SQL Editor antes
-- de usar la nueva versión, o el alta/edición de proveedores fallará al escribir
-- la columna inexistente.

alter table public.suppliers
  add column if not exists empresa text not null default '';

create index if not exists idx_suppliers_empresa on public.suppliers (empresa);
