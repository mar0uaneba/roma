-- Quote requests: reply from the admin and keep the e-mail history per request.
alter table public.email_log
  add column if not exists quote_id uuid references public.quote_requests (id) on delete set null;

create index if not exists email_log_quote_idx on public.email_log (quote_id, created_at desc);

alter table public.quote_requests
  add column if not exists replied_at timestamptz;
