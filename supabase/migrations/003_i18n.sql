-- Roma Pack: bilingual content (French / Arabic). Run after 001_init.sql and 002_orders.sql.
-- Safe to run more than once.

alter table public.products
  add column if not exists name_ar text,
  add column if not exists summary_ar text,
  add column if not exists description_ar text,
  add column if not exists applications_ar text[],
  add column if not exists formats_ar text[],
  add column if not exists image_alt_ar text;

alter table public.quote_requests
  add column if not exists locale text not null default 'fr';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quote_requests_locale_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_locale_check check (locale in ('fr', 'ar'));
  end if;
end;
$$;

-- Basic length limits on public input, so the open insert policy cannot be used to store huge rows.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quote_requests_lengths_check') then
    alter table public.quote_requests
      add constraint quote_requests_lengths_check check (
        char_length(company) <= 120
        and char_length(contact_name) <= 120
        and char_length(email) <= 180
        and char_length(phone) <= 30
        and char_length(coalesce(city, '')) <= 80
        and char_length(sector) <= 80
        and char_length(coalesce(product, '')) <= 160
        and char_length(coalesce(quantity, '')) <= 120
        and char_length(message) <= 4000
      ) not valid;
  end if;
end;
$$;

-- The return type changes, so the function has to be dropped first.
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
  sort_order integer,
  name_ar text,
  summary_ar text,
  description_ar text,
  applications_ar text[],
  formats_ar text[],
  image_alt_ar text
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
    sort_order,
    case when published then name_ar end,
    case when published then summary_ar end,
    case when published then description_ar end,
    case when published then applications_ar end,
    case when published then formats_ar end,
    case when published then image_alt_ar end
  from public.products;
$$;

grant execute on function public.public_products() to anon, authenticated;

-- Admins can delete product images they uploaded.
drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
