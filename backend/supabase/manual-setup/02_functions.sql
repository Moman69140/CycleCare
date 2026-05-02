create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger cycle_profiles_set_updated_at
  before update on public.cycle_profiles
  for each row execute function public.set_updated_at();

create trigger partners_set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', ''))
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, tier)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_month_key()
returns text
language sql
stable
as $$
  select to_char(now(), 'YYYY-MM');
$$;

create or replace function public.get_my_current_send_count()
returns int
language sql
security invoker
stable
as $$
  select coalesce(
    (
      select send_count
      from public.monthly_send_quotas
      where user_id = auth.uid()
        and month_key = public.current_month_key()
    ),
    0
  );
$$;

create or replace function public.has_couple_plus()
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = auth.uid()
      and tier = 'couple_plus'
      and (active_until is null or active_until > now())
  );
$$;
