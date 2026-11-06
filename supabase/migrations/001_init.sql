-- Roma Pack schema
-- Run this in the Supabase SQL editor after creating a project.
-- Then create an auth user and promote it:
--   update public.profiles set role = 'admin' where email = 'vous@exemple.com';

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  summary text not null,
  description text not null,
  applications text[] not null default '{}',
  formats text[] not null default '{}',
  image_url text not null,
  image_alt text not null default '',
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  city text,
  sector text not null,
  product text,
  quantity text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_review', 'quoted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists quote_requests_created_at_idx on public.quote_requests (created_at desc);
create index if not exists quote_requests_status_idx on public.quote_requests (status);
create index if not exists products_published_idx on public.products (published, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.quote_requests enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "public read published products" on public.products;
create policy "public read published products"
on public.products for select
to anon, authenticated
using (published = true or exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.role = 'admin'
));

drop policy if exists "admin write products" on public.products;
create policy "admin write products"
on public.products for all
to authenticated
using (exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.role = 'admin'
))
with check (exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.role = 'admin'
));

drop policy if exists "public insert quotes" on public.quote_requests;
create policy "public insert quotes"
on public.quote_requests for insert
to anon, authenticated
with check (true);

drop policy if exists "admin read quotes" on public.quote_requests;
create policy "admin read quotes"
on public.quote_requests for select
to authenticated
using (exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.role = 'admin'
));

drop policy if exists "admin update quotes" on public.quote_requests;
create policy "admin update quotes"
on public.quote_requests for update
to authenticated
using (exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.role = 'admin'
))
with check (exists (
  select 1 from public.profiles
  where profiles.id = auth.uid() and profiles.role = 'admin'
));

drop function if exists public.public_products();
create function public.public_products()
returns table (
  slug text,
  name text,
  category text,
  summary text,
  description text,
  applications text[],
  formats text[],
  image_url text,
  image_alt text,
  featured boolean,
  published boolean,
  sort_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    slug,
    case when published then name else '' end,
    case when published then category else '' end,
    case when published then summary else '' end,
    case when published then description else '' end,
    case when published then applications else '{}'::text[] end,
    case when published then formats else '{}'::text[] end,
    case when published then image_url else '' end,
    case when published then image_alt else '' end,
    featured,
    published,
    sort_order
  from public.products;
$$;

grant execute on function public.public_products() to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');

drop policy if exists "admin write product images" on storage.objects;
create policy "admin write product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
