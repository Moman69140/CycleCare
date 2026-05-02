-- Use only if a previous failed setup created partial objects.
-- This deletes CycleCare tables/types/functions from a fresh Supabase project.

drop trigger if exists on_auth_user_created on auth.users;

drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists cycle_profiles_set_updated_at on public.cycle_profiles;
drop trigger if exists partners_set_updated_at on public.partners;
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;

drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();
drop function if exists public.current_month_key();
drop function if exists public.get_my_current_send_count();
drop function if exists public.has_couple_plus();

drop table if exists public.consent_events cascade;
drop table if exists public.partner_replies cascade;
drop table if exists public.notification_events cascade;
drop table if exists public.monthly_send_quotas cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.partners cascade;
drop table if exists public.cycle_profiles cascade;
drop table if exists public.profiles cascade;

drop type if exists public.notification_status;
drop type if exists public.subscription_tier;
drop type if exists public.notification_channel;
