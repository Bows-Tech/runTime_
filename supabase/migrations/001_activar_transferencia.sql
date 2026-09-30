-- =============================================================================
-- MIGRACIÓN 001 — habilita el cobro por transferencia bancaria
-- =============================================================================
-- Tu base tiene una versión anterior del esquema. Esta migración NO recrea
-- nada: solo corrige lo que bloquea las ventas por transferencia.
--
-- Cómo aplicarla: SQL Editor de Supabase → pega todo → Run.
-- Es idempotente: puedes ejecutarla más de una vez sin romper nada.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Permitir 'transferencia' como método de pago  <-- BLOQUEANTE
-- -----------------------------------------------------------------------------
-- Ahora el CHECK solo acepta ('stripe','paypal'). Con esa restricción,
-- CADA intento de crear una orden por transferencia falla con:
--   new row violates check constraint "orders_payment_method_check"
-- El flujo de cobro no funciona en absoluto hasta arreglarlo.
alter table public.orders drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('stripe','paypal','transferencia'));

-- -----------------------------------------------------------------------------
-- 2. Crear la tabla de comprobantes  <-- BLOQUEANTE
-- -----------------------------------------------------------------------------
-- No existía. /api/transferencia inserta aquí el comprobante que sube el
-- comprador; sin la tabla, la ruta falla después de crear la orden.
create table if not exists public.transfer_receipts (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  file_path   text not null,
  file_size   integer not null default 0,
  note        text,
  reviewed    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.transfer_receipts enable row level security;

-- Sin policies: el comprobante contiene datos bancarios del comprador.
-- Solo se lee con la service role desde /api/admin/receipts/<orderId>.

create index if not exists transfer_receipts_order_idx
  on public.transfer_receipts (order_id);

-- -----------------------------------------------------------------------------
-- 3. Limpiar columnas de Stripe (opcional)
-- -----------------------------------------------------------------------------
-- Quedaron de cuando usábamos Stripe. No molestan, pero confunden.
-- Si más adelante te convence la vía Atlas, puedes comentarlas.
alter table public.orders drop column if exists stripe_session_id;
alter table public.orders drop column if exists stripe_payment_intent;

-- -----------------------------------------------------------------------------
-- 4. Scripts publicados sin archivo  <-- IMPORTANTE, no bloquea pero confunde
-- -----------------------------------------------------------------------------
-- Hay 3 scripts en estado 'publicado' con file_path = NULL. Aparecen en la
-- tienda y se pueden agregar al carrito, pero el checkout los descarta
-- ("Ese script todavía no está disponible para descarga").
--
-- Un cliente ve productos que no puede comprar. Los volvemos a 'borrador':
-- cuando subas el archivo desde /es/admin/scripts, vuelve a 'publicado'.
update public.scripts
   set status = 'borrador'
 where status = 'publicado'
   and file_path is null;

-- =============================================================================
-- 5. PENDIENTE: crear el bucket de comprobantes (NO se hace por SQL desde aquí)
-- =============================================================================
-- Storage → New bucket
--   Name:           receipts
--   Public bucket:  DESACTIVADO
--   File size:      10 MB
--
-- El bucket 'scripts' ya existe y está correctamente en privado.
-- Si lo crees por SQL (necesita ser superuser/owner):
--
--   insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   values (
--     'receipts', 'receipts', false, 10485760,
--     array['image/jpeg','image/png','image/webp','application/pdf']
--   )
--   on conflict (id) do update
--     set public = false,
--         file_size_limit = excluded.file_size_limit,
--         allowed_mime_types = excluded.allowed_mime_types;
-- =============================================================================

-- =============================================================================
-- VERIFICACIÓN (ejecuta esto después y dime qué sale)
-- =============================================================================
-- Debe salir 'transferencia'Enabled en el CHECK:
--   select pg_get_constraintdef(oid)
--     from pg_constraint
--    where conname = 'orders_payment_method_check';
--
-- Debe salir t/f/t:
--   select has_table_privilege('authenticated','public.profiles','UPDATE'),
--          has_column_privilege('authenticated','public.profiles','is_admin','UPDATE'),
--          has_column_privilege('authenticated','public.profiles','full_name','UPDATE');
--
-- Debe salir 1 fila:
--   select count(*) from information_schema.tables
--    where table_name = 'transfer_receipts';
--
-- Debe salir 0 filas (los publicados tienen archivo):
--   select slug, status from public.scripts where file_path is null and status = 'publicado';
-- =============================================================================
