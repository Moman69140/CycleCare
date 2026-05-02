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

create index cycle_profiles_user_id_idx on public.cycle_profiles(user_id);
create index partners_user_id_idx on public.partners(user_id);
create index notification_events_user_id_idx on public.notification_events(user_id);
create index notification_events_partner_id_idx on public.notification_events(partner_id);
create index partner_replies_user_id_idx on public.partner_replies(user_id);
create index consent_events_user_id_idx on public.consent_events(user_id);
