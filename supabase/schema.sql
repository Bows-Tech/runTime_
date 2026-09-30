-- =============================================================================
-- runtime_ — esquema de Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto SUPERVISADO antes de arrancar.
-- ADVERTENCIA: revísalo contra las tablas que YA tienes. No asumes que tus
-- datos tienen esta forma; si ya existen, migra en vez de crear duplicados.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Perfiles (extiende auth.users) + flag de administrador
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helper: ¿el usuario actual es admin?
-- SECURITY DEFINER porque las policies se evalúan con RLS activo sobre
-- `profiles`; sin esto habría recursión (policy de profiles → is_admin()
-- → lee profiles → policy de profiles → ...).
-- search_path fijo para que nadie redirija la resolución de nombres.
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path to public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;

-- PostgreSQL no tiene `create policy if not exists`, así que el SQL
-- aborta en la segunda ejecución. Por eso cada policy se borra antes.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- IMPORTANTE: no hay policy de UPDATE para perfiles.
-- Con `for update using (auth.uid() = id)` cualquier usuario autenticado
-- podría hacer update { is_admin: true } sobre su propio registro y
-- convertirse en administrador. Para evitarlo, la escritura de is_admin
-- queda restringida así:
--
--   1) La columna se toca solo desde el SQL Editor o con service role.
--   2) El usuario autenticado puede editar su perfil, pero únicamente
--      full_name (ver la policy de abajo + el revoke de la columna).
--
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Crea el perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Scripts (el catálogo que vendes)
-- -----------------------------------------------------------------------------
create table if not exists public.scripts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  extension    text not null default 'py',        -- py | sh | js | ts | rb ...
  category     text not null default 'herramientas',
  price_cents  integer not null check (price_cents >= 0),
  -- Traducciones: { "es": "...", "en": "..." }
  description   jsonb not null default '{}'::jsonb,
  long_description jsonb not null default '{}'::jsonb,
  status       text not null default 'borrador'
                 check (status in ('borrador','publicado','archivado')),
  file_path    text,        -- ruta en el bucket privado "scripts"
  file_size    integer,
  download_count integer not null default 0,
  sales_count  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.scripts enable row level security;

drop policy if exists "scripts_public_read" on public.scripts;
create policy "scripts_public_read" on public.scripts
  for select using (status = 'publicado');

drop policy if exists "scripts_admin_all" on public.scripts;
create policy "scripts_admin_all" on public.scripts
  for all using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. Órdenes (ventas) y sus items
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  amount_cents   integer not null check (amount_cents >= 0),
  currency       text not null default 'usd',
  status         text not null default 'pendiente'
                   check (status in ('pendiente','pagado','fallido','reembolsado')),
  payment_method text check (payment_method in ('paypal','transferencia')),
  paypal_order_id     text unique,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);

alter table public.orders enable row level security;

-- El comprador solo puede ver sus órdenes SI ha iniciado sesión.
-- OJO: en la venta por transferencia el comprador NO se registra, así que
-- la página de su orden y /api/transferencia/<id>/status usan la service
-- role (el orderId UUIDv4 de la URL hace de credencial).
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (
    auth.uid() is not null and email = auth.jwt() ->> 'email'
  );

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all using (public.is_admin());

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  script_id   uuid references public.scripts (id) on delete set null,
  script_name text not null,        -- snapshot: el nombre no cambia aunque el script sí
  unit_cents  integer not null,
  quantity    integer not null default 1
);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and auth.uid() is not null
        and o.email = auth.jwt() ->> 'email'
    )
  );

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all" on public.order_items
  for all using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Tokens de descarga (un uso, con expiración)
-- -----------------------------------------------------------------------------
create table if not exists public.download_tokens (
  token      text primary key default encode(gen_random_bytes(24), 'hex'),
  order_id   uuid not null references public.orders (id) on delete cascade,
  script_id  uuid not null references public.scripts (id) on delete cascade,
  email      text not null,
  used       boolean not null default false,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

alter table public.download_tokens enable row level security;

-- Nadie lee tokens desde el cliente; solo la ruta de descarga (service role).
-- Por eso NO hay policies de select: se acceden vía API con service role.

-- -----------------------------------------------------------------------------
-- 5. Publicaciones (blog / anuncios, p.ej. "próximamente")
-- -----------------------------------------------------------------------------
create table if not exists public.publications (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       jsonb not null default '{}'::jsonb,
  body        jsonb not null default '{}'::jsonb,
  status      text not null default 'borrador'
                check (status in ('borrador','publicado','archivado')),
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.publications enable row level security;

drop policy if exists "publications_public_read" on public.publications;
create policy "publications_public_read" on public.publications
  for select using (status = 'publicado');

drop policy if exists "publications_admin_all" on public.publications;
create policy "publications_admin_all" on public.publications
  for all using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5b. Contador de ventas (lo invoca el webhook de Stripe)
-- -----------------------------------------------------------------------------
create or replace function public.increment_sales_count(p_script_id uuid)
returns void
language sql
security definer set search_path = public as $$
  update public.scripts
     set sales_count = sales_count + 1
   where id = p_script_id;
$$;

revoke all on function public.increment_sales_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_sales_count(uuid) to service_role;

create or replace function public.increment_download_count(p_script_id uuid)
returns void
language sql
security definer set search_path = public as $$
  update public.scripts
     set download_count = download_count + 1
   where id = p_script_id;
$$;

revoke all on function public.increment_download_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_download_count(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- 5c. Comprobantes de transferencia (Ecuador)
-- -----------------------------------------------------------------------------
-- El comprador crea la orden, transfiere por banco, y sube el
-- comprobante. El admin lo revisa en /admin/ventas y confirma; esa
-- confirmación llama a markOrderPaidAndIssueTokens, que ya emite los
-- tokens de descarga. No hay webhook: la confirmación es humana.
create table if not exists public.transfer_receipts (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  file_path   text not null,          -- comprobante en el bucket "receipts"
  file_size   integer not null default 0,
  note        text,                   -- nota opcional del comprador
  -- Si el admin lo marca, la orden queda en 'pagado' y se emiten tokens.
  reviewed    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.transfer_receipts enable row level security;

-- Sin policies: se accede solo con service role (el comprobante es un
-- documento del comprador, no debe ser legible por el anon).
create index if not exists transfer_receipts_order_idx
  on public.transfer_receipts (order_id);

-- -----------------------------------------------------------------------------
-- 6. Suscriptores del boletín
-- -----------------------------------------------------------------------------
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Inserción pública (el formulario es anónimo), pero lectura solo admin.
drop policy if exists "subscribers_public_insert" on public.subscribers;
create policy "subscribers_public_insert" on public.subscribers
  for insert with check (true);

drop policy if exists "subscribers_admin_read" on public.subscribers;
create policy "subscribers_admin_read" on public.subscribers
  for select using (public.is_admin());

-- =============================================================================
-- 7. Datos de ejemplo (opcional, solo para probar en desarrollo)
-- =============================================================================
-- Insertan los scripts que tenía el sitio estático original.
-- Nacen en 'borrador' y SIN file_path, así que todavía NO son vendibles:
-- sube el archivo desde el panel (admin → scripts → editar) y cambia el
-- estado a 'publicado'. El checkout filtra por file_path, así que un
-- script sin archivo no entra en el carrito.
--
-- on conflict evita duplicados si ejecutas esto más de una vez.
insert into public.scripts (slug, name, extension, category, price_cents, description, status)
values
  ('backup-cli', 'backup-cli', 'py', 'herramientas', 1200,
   '{"es":"Respaldos incrementales a S3 con cifrado y rotación automática.",
     "en":"Incremental S3 backups with encryption and automatic rotation."}',
   'borrador'),
  ('server-init', 'server-init', 'sh', 'devops', 800,
   '{"es":"Aprovisiona un servidor Ubuntu limpio en menos de 3 minutos.",
     "en":"Provisions a clean Ubuntu server in under 3 minutes."}',
   'borrador'),
  ('scrape-kit', 'scrape-kit', 'js', 'scraping', 1500,
   '{"es":"Toolkit de scraping con reintentos, colas y export a CSV/JSON.",
     "en":"Scraping toolkit with retries, queues and CSV/JSON export."}',
   'borrador'),
  ('log-watch', 'log-watch', 'py', 'devops', 1000,
   '{"es":"Monitorea logs en tiempo real y dispara alertas por patrón.",
     "en":"Monitors logs in real time and triggers pattern alerts."}',
   'borrador')
on conflict (slug) do nothing;

-- =============================================================================
-- 8. Pasos manuales (no hay forma de hacerlos desde SQL)
-- =============================================================================
-- a) CREA EL BUCKET. No basta con que exista: debe ser PRIVADO.
--      Storage → New bucket
--        Name:            scripts
--        Public bucket:   DESACTIVADO  <-- importante
--        File size limit: 25 MB
--
--    Con "public bucket" activado cualquiera que conozca la ruta podría
--    descargar los scripts sin pagar. Si ya lo creaste público:
--      update storage.buckets set public = false where name = 'scripts';
--
-- b) Los permisos del bucket: solo el service role escribe y lee.
--    No añadas policies de select para el rol `anon`; el servicio de
--    pagos salta RLS y por eso ya tiene acceso.
--
-- c) Convierte tu cuenta en admin:
--      update public.profiles set is_admin = true where email = 'tu@email.com';
--    Ejecútalo DESPUÉS de haber iniciado sesión al menos una vez, para que
--    el trigger handle_new_user haya creado tu perfil. Si no, el UPDATE
--    no afecta a ninguna fila y no sabrás por qué.
--
-- d) Verifica que la policy de profiles quedó bien (debe salir 0 filas):
--      select * from public.profiles where is_admin = true;
--
-- e) Prueba de humo: entra a /es/admin → scripts, sube un archivo a uno
--    de los ejemplos y ponlo en 'publicado'. Luego agrégalo al carrito.
--    Si el checkout responde "Ese script todavía no está disponible para
--    descarga", es que file_path quedó NULL.
-- =============================================================================
