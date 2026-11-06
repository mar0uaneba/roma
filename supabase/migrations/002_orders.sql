-- Commandes Roma Pack. À exécuter après 001_init.sql.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  company text not null,
  contact_name text not null,
  phone text not null,
  email text,
  product text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  status text not null default 'brouillon' check (
    status in ('brouillon', 'confirmee', 'en_preparation', 'livree', 'annulee')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

drop policy if exists "admin manage orders" on public.orders;
create policy "admin manage orders"
on public.orders for all
to authenticated
using (exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.role = 'admin'
))
with check (exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.role = 'admin'
));
