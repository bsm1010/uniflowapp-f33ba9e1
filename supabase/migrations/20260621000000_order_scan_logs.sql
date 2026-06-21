-- order_scan_logs: tracks AI order scanning usage per user
create table if not exists public.order_scan_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  confidence text not null default 'low',
  items_found integer not null default 0,
  created_at timestamptz not null default now()
);

-- RLS: users can only see their own scan logs
alter table public.order_scan_logs enable row level security;

create policy "Users read own scan logs"
  on public.order_scan_logs for select
  using (auth.uid() = user_id);

create policy "Users insert own scan logs"
  on public.order_scan_logs for insert
  with check (auth.uid() = user_id);

-- Index for usage dashboards
create index if not exists idx_order_scan_logs_user_id
  on public.order_scan_logs (user_id, created_at desc);
