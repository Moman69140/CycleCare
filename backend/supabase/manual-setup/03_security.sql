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
