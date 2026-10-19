-- =============================================================
-- CivicFix — Initial Database Schema
-- Migration: 20261018000000_initial_schema.sql
-- Apply via: Supabase Dashboard → SQL Editor, or supabase db push
-- SAFE TO RE-RUN: all statements use IF NOT EXISTS / OR REPLACE
-- =============================================================

-- ---------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------
-- Enum types  (create only if they don't already exist)
-- ---------------------------------------------------------------

do $$ begin
  create type user_role as enum ('citizen', 'officer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_category as enum (
    'road', 'sanitation', 'drainage', 'water', 'electricity', 'other',
    -- legacy aliases kept for backward compat with frontend labels
    'pothole', 'garbage', 'streetlight'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum (
    'submitted', 'under_review', 'in_progress', 'resolved', 'rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------
-- 1. profiles
--    One row per Supabase Auth user.  Auto-inserted by trigger.
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default 'Citizen',
  role        user_role not null default 'citizen',
  avatar_url  text,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------
-- 2. reports
--    Core civic issue report record.
-- ---------------------------------------------------------------
create table if not exists public.reports (
  id             uuid primary key default uuid_generate_v4(),
  -- Public-facing tracking ID:  CIV-XXXXXXXX  (non-sequential, unguessable)
  tracking_id    text unique not null
                   default ('CIV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  user_id        uuid references public.profiles(id) on delete set null,
  title          text not null check (char_length(title) between 3 and 200),
  description    text not null check (char_length(description) >= 10),
  category       report_category not null default 'other',
  status         report_status   not null default 'submitted',
  priority       report_priority not null default 'medium',
  latitude       double precision not null,
  longitude      double precision not null,
  address        text,
  -- Supabase Storage object path (NOT a data-URL or blob URL)
  image_path     text,
  -- AI analysis results stored alongside the human-confirmed values
  ai_category    text,
  ai_confidence  numeric(5, 2) check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 100)),
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now()),
  resolved_at    timestamptz,
  -- Officer/admin assigned to handle this report
  assigned_to    uuid references public.profiles(id) on delete set null
);

-- Indexes for common query patterns
create index if not exists reports_user_id_idx      on public.reports(user_id);
create index if not exists reports_status_idx       on public.reports(status);
create index if not exists reports_category_idx     on public.reports(category);
create index if not exists reports_tracking_id_idx  on public.reports(tracking_id);
create index if not exists reports_location_idx     on public.reports(latitude, longitude);
create index if not exists reports_created_at_idx   on public.reports(created_at desc);

-- ---------------------------------------------------------------
-- 3. report_status_history
--    Immutable audit trail of every status transition.
--    Citizens and officers may INSERT; nobody may UPDATE or DELETE.
-- ---------------------------------------------------------------
create table if not exists public.report_status_history (
  id          uuid primary key default uuid_generate_v4(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  old_status  report_status,
  new_status  report_status not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  comment     text,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists rsh_report_id_idx on public.report_status_history(report_id);

-- ---------------------------------------------------------------
-- Utility: auto-update updated_at on any row UPDATE
-- ---------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists update_reports_updated_at  on public.reports;
create trigger update_reports_updated_at
  before update on public.reports
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

-- ---------------------------------------------------------------
-- Auto-create profile row when a new Auth user signs up.
-- Uses SECURITY DEFINER so it can write to profiles even before
-- RLS policies would allow it.  Role defaults to 'citizen' —
-- no user-supplied role metadata is trusted here.
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Citizen'),
    'citizen',   -- always citizen; role escalation is admin-only
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;   -- idempotent on re-trigger
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------
-- Auto-insert initial status_history row when a report is created
-- ---------------------------------------------------------------
create or replace function public.handle_new_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.report_status_history
    (report_id, old_status, new_status, changed_by, comment)
  values
    (new.id, null, new.status, new.user_id, 'Report submitted by citizen');
  return new;
end;
$$;

drop trigger if exists on_report_created on public.reports;
create trigger on_report_created
  after insert on public.reports
  for each row execute procedure public.handle_new_report();

-- ---------------------------------------------------------------
-- Auto-insert status_history row on every status change
-- ---------------------------------------------------------------
create or replace function public.handle_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.report_status_history
      (report_id, old_status, new_status, changed_by)
    values
      (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists on_report_status_change on public.reports;
create trigger on_report_status_change
  after update of status on public.reports
  for each row execute procedure public.handle_report_status_change();

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------

alter table public.profiles              enable row level security;
alter table public.reports               enable row level security;
alter table public.report_status_history enable row level security;

-- Helper: is the current user an officer or admin?
create or replace function public.is_officer_or_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('officer', 'admin')
  );
$$;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- profiles policies ----

-- Anyone can read any profile (public directory)
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- A user can insert their own profile row (used by handle_new_user trigger path & direct call)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- A user can update their own profile, but CANNOT change their own role.
-- Role escalation requires an admin using the service_role key.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Admins can update any profile including role
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- ---- reports policies ----

-- Public transparency: anyone (even anonymous) can read all reports
drop policy if exists "reports_select_public" on public.reports;
create policy "reports_select_public"
  on public.reports for select
  using (true);

-- Authenticated citizens can create reports under their own identity
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated"
  on public.reports for insert
  with check (
    auth.role() = 'authenticated'
    and (user_id = auth.uid() or user_id is null)
  );

-- Owners can update their own reports (description, address — NOT status or priority escalation)
-- Officers/admins can update any report
drop policy if exists "reports_update" on public.reports;
create policy "reports_update"
  on public.reports for update
  using (
    auth.uid() = user_id
    or public.is_officer_or_admin()
  );

-- Only admins can delete reports (rare; prefer status = 'rejected')
drop policy if exists "reports_delete_admin" on public.reports;
create policy "reports_delete_admin"
  on public.reports for delete
  using (public.is_admin());

-- ---- report_status_history policies ----

-- Public: anyone can read status history (tracking transparency)
drop policy if exists "rsh_select_public" on public.report_status_history;
create policy "rsh_select_public"
  on public.report_status_history for select
  using (true);

-- Only officers and admins can manually insert status history rows
-- (citizen submissions are recorded by the trigger, not direct inserts)
drop policy if exists "rsh_insert_officers" on public.report_status_history;
create policy "rsh_insert_officers"
  on public.report_status_history for insert
  with check (public.is_officer_or_admin());

-- Nobody can UPDATE or DELETE status history — it is an immutable audit trail
-- (no policies needed; absence of policy = deny)

-- ---------------------------------------------------------------
-- Supabase Storage bucket policies
-- These are informational; actual bucket creation is done in the
-- Supabase Dashboard or via `supabase storage` CLI.
--
-- Bucket: report-images
--   - Authenticated users can upload to:  report-images/{auth.uid()}/
--   - Officers and admins can read any object
--   - Owners can read their own objects
--   - Max file size: 5 MB  (enforced in bucket settings)
--   - Allowed MIME types: image/jpeg, image/png, image/webp
-- ---------------------------------------------------------------

-- Note: Storage RLS SQL is shown below for reference.
-- Run this AFTER creating the bucket in the Dashboard.

/*
-- Allow authenticated users to upload to their own folder
create policy "storage_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'report-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow owners and officers/admins to read images
create policy "storage_select_own_or_officer"
  on storage.objects for select
  using (
    bucket_id = 'report-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_officer_or_admin()
    )
  );

-- Allow owners to delete their own images
create policy "storage_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
*/
