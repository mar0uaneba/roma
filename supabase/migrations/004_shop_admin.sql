-- Roma Pack: online shop (cash on delivery), drafts/offers, CRM, e-mail log, admin login throttling.
-- Run after 001, 002 and 003. Safe to run more than once.
-- The admin talks to these tables with the service-role key on the server only.
-- Row level security is enabled with no public policies, so the anon key cannot read them.

-- ── Products: shop fields ───────────────────────────────────────────────
alter table public.products
  add column if not exists price numeric(12, 2),
  add column if not exists compare_at_price numeric(12, 2),
  add column if not exists cost_price numeric(12, 2),
  add column if not exists stock integer,
  add column if not exists status text not null default 'active',
  add column if not exists unit text,
  add column if not exists unit_ar text,
  add column if not exists min_qty integer not null default 1,
  add column if not exists sku text,
  add column if not exists images text[] not null default '{}',
  add column if not exists feed_excluded boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_status_check') then
    alter table public.products
      add constraint products_status_check check (status in ('active', 'hidden', 'sold_out'));
  end if;
end;
$$;

-- ── Customers / CRM ─────────────────────────────────────────────────────
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  company text,
  email text,
  phone text,
  city text,
  address text,
  locale text not null default 'fr' check (locale in ('fr', 'ar')),
  stage text not null default 'lead' check (stage in ('lead', 'customer', 'vip', 'inactive')),
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_key on public.customers (lower(email)) where email is not null;
create index if not exists customers_phone_idx on public.customers (phone);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- ── Orders and drafts ───────────────────────────────────────────────────
create sequence if not exists public.shop_order_number_seq start 1001;

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('RP-' || nextval('public.shop_order_number_seq')::text),
  status text not null default 'pending' check (
    status in ('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')
  ),
  payment_method text not null default 'cod' check (payment_method in ('cod', 'transfer')),
  payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'paid', 'refunded', 'partially_refunded')
  ),
  source text not null default 'shop' check (source in ('shop', 'admin', 'quote', 'offer')),
  locale text not null default 'fr' check (locale in ('fr', 'ar')),
  customer_id uuid references public.customers (id) on delete set null,
  customer_name text not null default '',
  customer_company text,
  customer_email text,
  customer_phone text,
  customer_city text,
  customer_address text,
  customer_note text,
  subtotal numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  cost_total numeric(12, 2) not null default 0,
  refunded_amount numeric(12, 2) not null default 0,
  carrier text,
  tracking_number text,
  supplier_ref text,
  delivery_slot text,
  delivery_note text,
  damage_flag boolean not null default false,
  internal_note text,
  cancel_reason text,
  offer_token text unique,
  offer_expires_at timestamptz,
  offer_sent_at timestamptz,
  quote_id uuid references public.quote_requests (id) on delete set null,
  confirmed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_orders_status_idx on public.shop_orders (status, created_at desc);
create index if not exists shop_orders_customer_idx on public.shop_orders (customer_id);

drop trigger if exists shop_orders_set_updated_at on public.shop_orders;
create trigger shop_orders_set_updated_at
before update on public.shop_orders
for each row execute function public.set_updated_at();

create table if not exists public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders (id) on delete cascade,
  product_slug text,
  name text not null,
  image text,
  unit text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  unit_cost numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  position integer not null default 0
);

create index if not exists shop_order_items_order_idx on public.shop_order_items (order_id, position);

create table if not exists public.shop_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders (id) on delete cascade,
  kind text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists shop_order_events_order_idx on public.shop_order_events (order_id, created_at desc);

-- ── E-mail log (every e-mail the shop or the admin sends) ───────────────
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  order_id uuid references public.shop_orders (id) on delete set null,
  to_email text not null,
  subject text not null,
  html text not null,
  kind text not null default 'message',
  status text not null default 'sent' check (status in ('sent', 'failed', 'skipped')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists email_log_customer_idx on public.email_log (customer_id, created_at desc);
create index if not exists email_log_order_idx on public.email_log (order_id, created_at desc);

-- ── Settings and login throttling ───────────────────────────────────────
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_idx on public.admin_login_attempts (ip_hash, created_at desc);

-- Quotes can be turned into drafts.
alter table public.quote_requests
  add column if not exists draft_order_id uuid references public.shop_orders (id) on delete set null;

-- ── Row level security: server-only tables ──────────────────────────────
alter table public.customers enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;
alter table public.shop_order_events enable row level security;
alter table public.email_log enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_login_attempts enable row level security;
