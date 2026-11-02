-- =============================================================================
-- HayatLink — Pakistan Blood Donation Network
-- Production-ready PostgreSQL / Supabase initialization script
--
-- How to apply:
--   1. Create a Supabase project (https://supabase.com)
--   2. Open SQL Editor → New query
--   3. Paste this entire file and run it
--
-- This script is idempotent: it can be re-run safely. It creates tables,
-- check constraints, indexes, a 90-day donation cooldown view, and Row
-- Level Security policies tailored to a public donor directory.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Shared domain helpers
-- -----------------------------------------------------------------------------

-- Pakistani mobile formats accepted by the product:
--   03XXXXXXXXX     (local, 11 digits)
--   +923XXXXXXXXX   (E.164)
create or replace function public.is_pakistani_mobile(value text)
returns boolean
language sql
immutable
as $$
  select value ~ '^(03[0-9]{9}|\+923[0-9]{9})$';
$$;

comment on function public.is_pakistani_mobile(text) is
  'True when the value matches 03XXXXXXXXX or +923XXXXXXXXX.';

-- WHO whole-blood guideline: donors are not available for 90 days after a donation.
create or replace function public.donor_currently_available(
  is_available boolean,
  last_donation_date date
)
returns boolean
language sql
stable
as $$
  select
    coalesce(is_available, false)
    and (
      last_donation_date is null
      or last_donation_date <= (current_date - interval '90 days')
    );
$$;

comment on function public.donor_currently_available(boolean, date) is
  'Applies the 90-day cooldown on top of the donor''s own availability switch.';

create or replace function public.to_whatsapp_e164(phone text)
returns text
language sql
immutable
as $$
  select case
    when phone ~ '^\+923[0-9]{9}$' then substr(phone, 2)
    when phone ~ '^03[0-9]{9}$' then '92' || substr(phone, 2)
    else null
  end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — registered donors, 1:1 with auth.users
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  phone_number text not null,
  alt_phone_number text,
  blood_group text not null,
  city text not null check (char_length(btrim(city)) between 2 and 80),
  area text not null check (char_length(btrim(area)) between 2 and 80),
  is_available boolean not null default true,
  last_donation_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_pk_format
    check (public.is_pakistani_mobile(phone_number)),
  constraint profiles_alt_phone_pk_format
    check (alt_phone_number is null or public.is_pakistani_mobile(alt_phone_number)),
  constraint profiles_blood_group_valid
    check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint profiles_last_donation_not_future
    check (last_donation_date is null or last_donation_date <= current_date)
);

comment on table public.profiles is
  'Registered blood donors. Phone numbers are stored for WhatsApp deep-links and must never be rendered as plain text in the public UI.';
comment on column public.profiles.area is
  'Town, phase, or sector (e.g. Johar Town, Clifton, DHA, G-11).';
comment on column public.profiles.is_available is
  'Donor-controlled switch. The 90-day cooldown still hides the profile even when this is true.';

create index if not exists profiles_lookup_idx
  on public.profiles (blood_group, city, area);

create index if not exists profiles_city_group_idx
  on public.profiles (city, blood_group);

create index if not exists profiles_availability_idx
  on public.profiles (is_available, last_donation_date);

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);

-- -----------------------------------------------------------------------------
-- blood_requests — public hospital appeals
-- -----------------------------------------------------------------------------

create table if not exists public.blood_requests (
  id bigint generated always as identity primary key,
  requester_name text not null check (char_length(btrim(requester_name)) between 2 and 80),
  contact_info text not null check (char_length(btrim(contact_info)) between 5 and 80),
  blood_group text not null,
  hospital_name text not null check (char_length(btrim(hospital_name)) between 2 and 120),
  city text not null check (char_length(btrim(city)) between 2 and 80),
  area text not null check (char_length(btrim(area)) between 2 and 80),
  urgency_level text not null default 'Urgent',
  details text,
  created_at timestamptz not null default now(),
  constraint blood_requests_blood_group_valid
    check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint blood_requests_urgency_valid
    check (urgency_level in ('Critical', 'Urgent', 'Routine'))
);

comment on table public.blood_requests is
  'Public emergency feed of hospital blood appeals posted by seekers.';
comment on column public.blood_requests.contact_info is
  'WhatsApp or phone number for the seeker. Not a donor number.';
comment on column public.blood_requests.hospital_name is
  'e.g. Shaukat Khanum, Jinnah Hospital, Aga Khan, PIMS.';

create index if not exists blood_requests_lookup_idx
  on public.blood_requests (blood_group, city, area);

create index if not exists blood_requests_created_at_idx
  on public.blood_requests (created_at desc);

create index if not exists blood_requests_urgency_idx
  on public.blood_requests (urgency_level, created_at desc);

-- -----------------------------------------------------------------------------
-- Smart cooldown engine — public search view
-- -----------------------------------------------------------------------------

create or replace view public.available_donors
with (security_invoker = true) as
select
  p.id,
  p.full_name,
  p.blood_group,
  p.city,
  p.area,
  p.phone_number,
  p.last_donation_date,
  p.created_at,
  public.to_whatsapp_e164(p.phone_number) as whatsapp_e164
from public.profiles p
where public.donor_currently_available(p.is_available, p.last_donation_date);

comment on view public.available_donors is
  'Donors who opted in and are outside the 90-day post-donation cooldown. Query this view for the public search grid.';

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-provision a profile from auth.users metadata at sign-up
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_full_name text := nullif(btrim(meta->>'full_name'), '');
  v_phone text := nullif(btrim(meta->>'phone_number'), '');
  v_alt text := nullif(btrim(meta->>'alt_phone_number'), '');
  v_group text := nullif(btrim(meta->>'blood_group'), '');
  v_city text := nullif(btrim(meta->>'city'), '');
  v_area text := nullif(btrim(meta->>'area'), '');
  v_last date;
begin
  if v_full_name is null or v_phone is null or v_group is null
     or v_city is null or v_area is null then
    return new;
  end if;

  begin
    v_last := nullif(meta->>'last_donation_date', '')::date;
  exception
    when others then
      v_last := null;
  end;

  insert into public.profiles (
    id,
    full_name,
    phone_number,
    alt_phone_number,
    blood_group,
    city,
    area,
    last_donation_date
  )
  values (
    new.id,
    v_full_name,
    v_phone,
    v_alt,
    v_group,
    v_city,
    v_area,
    v_last
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.blood_requests enable row level security;

-- Profiles: public may read rows so the directory can render names, groups,
-- and locations. The application never prints phone_number as text; it only
-- builds a wa.me deep-link. Donors may insert/update/delete only their row.
drop policy if exists "Public can read donor profiles" on public.profiles;
create policy "Public can read donor profiles"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users delete their own profile" on public.profiles;
create policy "Users delete their own profile"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- Blood requests: the emergency feed is public. Anyone may post an appeal
-- (seekers often are not registered donors). Mutations after insert are
-- reserved for the service role / dashboard operators.
drop policy if exists "Public can read blood requests" on public.blood_requests;
create policy "Public can read blood requests"
  on public.blood_requests
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can post a blood request" on public.blood_requests;
create policy "Anyone can post a blood request"
  on public.blood_requests
  for insert
  to anon, authenticated
  with check (true);

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;

grant select, insert on public.blood_requests to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

grant select on public.available_donors to anon, authenticated;

grant execute on function public.is_pakistani_mobile(text) to anon, authenticated;
grant execute on function public.donor_currently_available(boolean, date) to anon, authenticated;
grant execute on function public.to_whatsapp_e164(text) to anon, authenticated;
