create extension if not exists pgcrypto;

create type public.notification_channel as enum ('email', 'sms');
create type public.subscription_tier as enum ('free', 'couple_plus');
create type public.notification_status as enum ('draft', 'sent', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cycle_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_period_date date not null,
  cycle_length int not null check (cycle_length between 20 and 45),
  period_length int not null check (period_length between 2 and 10),
  personal_needs text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  email text,
  phone text,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  sharing_consent boolean not null default false,
  reply_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  apple_original_transaction_id text,
  active_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_send_quotas (
  user_id uuid not null references public.profiles(id) on delete cascade,
  month_key text not null,
  send_count int not null default 0 check (send_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  channel public.notification_channel not null,
  status public.notification_status not null default 'draft',
  phase text not null,
  message_preview text not null,
  sent_at timestamptz,
  reply_token_hash text,
  reply_used boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.partner_replies (
  id uuid primary key default gen_random_uuid(),
  notification_event_id uuid not null references public.notification_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  body text not null check (char_length(body) <= 180),
  created_at timestamptz not null default now()
);

create table public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.cycle_profiles enable row level security;
alter table public.partners enable row level security;
alter table public.subscriptions enable row level security;
alter table public.monthly_send_quotas enable row level security;
alter table public.notification_events enable row level security;
alter table public.partner_replies enable row level security;
alter table public.consent_events enable row level security;

create policy "profiles owner access"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "cycle owner access"
  on public.cycle_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "partners owner access"
  on public.partners for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subscriptions owner read"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "quota owner read"
  on public.monthly_send_quotas for select
  using (auth.uid() = user_id);

create policy "notifications owner access"
  on public.notification_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "replies owner read"
  on public.partner_replies for select
  using (auth.uid() = user_id);

create policy "consent owner access"
  on public.consent_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
