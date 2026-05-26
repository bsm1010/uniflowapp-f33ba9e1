-- Payment auto-verify settings for admin merchants
create table public.payment_auto_verify_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  enabled boolean not null default false,
  pattern text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.payment_auto_verify_settings enable row level security;

create policy "Users can view their own payment settings"
  on public.payment_auto_verify_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own payment settings"
  on public.payment_auto_verify_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own payment settings"
  on public.payment_auto_verify_settings for update
  to authenticated
  using (auth.uid() = user_id);

create trigger set_payment_auto_verify_settings_updated_at
  before update on public.payment_auto_verify_settings
  for each row execute function public.set_updated_at();
