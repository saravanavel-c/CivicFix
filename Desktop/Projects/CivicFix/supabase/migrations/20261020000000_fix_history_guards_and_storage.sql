-- =============================================================
-- CivicFix — Correctness fixes on top of the initial schema
-- Migration: 20261020000000_fix_history_guards_and_storage.sql
-- Apply via: Supabase Dashboard → SQL Editor, or supabase db push
-- SAFE TO RE-RUN: all statements are idempotent
--
-- What this fixes
--   1. Duplicate audit rows: history is written by ONE writer only.
--   2. Citizens could PATCH their own status / priority / assigned_to
--      directly through the anon key. Now blocked by a trigger guard.
--   3. Status + assignment changes are atomic RPCs (no read-then-write
--      race in the API layer).
--   4. Anonymous report insertion was allowed by RLS. Now tightened.
--   5. The report-images bucket + its policies are provisioned here
--      instead of being a commented-out block.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Single history writer
--    The trigger now reads the actor and comment from
--    transaction-local settings, so callers never insert history rows
--    themselves (which produced two rows per status change).
--    Settings are written by transition_report_status() / assign_report()
--    with set_config(..., is_local => true), i.e. scoped to the
--    transaction that PostgREST opens for the RPC call.
-- ---------------------------------------------------------------
create or replace function public.handle_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor   uuid;
  v_comment text;
begin
  if old.status is distinct from new.status then
    v_actor   := nullif(current_setting('civicfix.actor',   true), '')::uuid;
    v_comment := nullif(btrim(coalesce(current_setting('civicfix.comment', true), '')), '');

    insert into public.report_status_history
      (report_id, old_status, new_status, changed_by, comment)
    values
      (new.id, old.status, new.status, coalesce(v_actor, auth.uid()), v_comment);
  end if;
  return new;
end;
$$;

drop trigger if exists on_report_status_change on public.reports;
create trigger on_report_status_change
  after update of status on public.reports
  for each row execute procedure public.handle_report_status_change();

-- ---------------------------------------------------------------
-- 2. Column guard
--    RLS row policies cannot restrict individual columns. Without this
--    trigger a citizen who owns a report could rewrite its status or
--    priority through the anon key.
--
--    auth.uid() is null for the service_role key and for direct psql
--    sessions — those are trusted server-side callers.
-- ---------------------------------------------------------------
create or replace function public.guard_protected_report_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status      is distinct from old.status
     or new.priority is distinct from old.priority
     or new.assigned_to is distinct from old.assigned_to
  then
    if auth.uid() is not null and not public.is_officer_or_admin() then
      raise exception
        'Only officers or admins may change status, priority or assigned_to'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_protected_report_columns on public.reports;
create trigger guard_protected_report_columns
  before update on public.reports
  for each row execute procedure public.guard_protected_report_columns();

-- ---------------------------------------------------------------
-- 3. Atomic status transition
--    Replaces: read current status → update → insert history.
-- ---------------------------------------------------------------
create or replace function public.transition_report_status(
  p_report_id  uuid,
  p_new_status public.report_status,
  p_comment    text default null,
  p_changed_by uuid default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists  uuid;
  v_actor   uuid := coalesce(p_changed_by, auth.uid());
  v_updated public.reports;
begin
  select id into v_exists from public.reports where id = p_report_id for update;
  if v_exists is null then
    raise exception 'Report % not found', p_report_id using errcode = 'P0002';
  end if;

  perform set_config('civicfix.actor',   coalesce(v_actor::text, ''), true);
  perform set_config('civicfix.comment', coalesce(p_comment, ''), true);

  update public.reports
     set status      = p_new_status,
         resolved_at = case
                         when p_new_status = 'resolved'
                           then coalesce(resolved_at, timezone('utc', now()))
                         else null
                       end
   where id = p_report_id
  returning * into v_updated;

  return v_updated;
end;
$$;

revoke all on function public.transition_report_status(uuid, public.report_status, text, uuid) from public;
grant execute on function public.transition_report_status(uuid, public.report_status, text, uuid) to service_role;

-- ---------------------------------------------------------------
-- 4. Atomic assignment
-- ---------------------------------------------------------------
create or replace function public.assign_report(
  p_report_id  uuid,
  p_officer_id uuid,
  p_changed_by uuid default null,
  p_comment    text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role    public.user_role;
  v_prev    public.report_status;
  v_actor   uuid := coalesce(p_changed_by, auth.uid());
  v_comment text;
  v_updated public.reports;
begin
  select role into v_role from public.profiles where id = p_officer_id;
  if v_role is null or v_role not in ('officer', 'admin') then
    raise exception 'Target user is not a valid officer or admin' using errcode = '22023';
  end if;

  select status into v_prev from public.reports where id = p_report_id for update;
  if v_prev is null then
    raise exception 'Report % not found', p_report_id using errcode = 'P0002';
  end if;

  v_comment := coalesce(
    nullif(btrim(coalesce(p_comment, '')), ''),
    'Assigned to officer ' || p_officer_id::text
  );

  perform set_config('civicfix.actor',   coalesce(v_actor::text, ''), true);
  perform set_config('civicfix.comment', v_comment, true);

  update public.reports
     set assigned_to = p_officer_id,
         status      = 'under_review',
         resolved_at = null
   where id = p_report_id
  returning * into v_updated;

  -- Re-assigning a report that is already under_review does not change
  -- status, so the AFTER trigger stays silent. Record it explicitly.
  if v_prev = 'under_review' then
    insert into public.report_status_history
      (report_id, old_status, new_status, changed_by, comment)
    values
      (p_report_id, v_prev, v_prev, v_actor, v_comment);
  end if;

  return v_updated;
end;
$$;

revoke all on function public.assign_report(uuid, uuid, uuid, text) from public;
grant execute on function public.assign_report(uuid, uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------
-- 5. Tighten report insertion
--    The initial policy allowed user_id IS NULL, i.e. an anonymous
--    client could file reports that look system-generated.
-- ---------------------------------------------------------------
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated"
  on public.reports for insert
  with check (
    auth.role() = 'authenticated'
    and user_id = auth.uid()
  );

-- ---------------------------------------------------------------
-- 6. Storage bucket + object policies
--    Skipped automatically on databases without the storage schema
--    (e.g. a plain PostgreSQL instance).
-- ---------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not found — skipping bucket provisioning';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'report-images',
    'report-images',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
  on conflict (id) do update
    set public             = excluded.public,
        file_size_limit    = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
end $$;

do $$
begin
  if to_regclass('storage.buckets') is null then return; end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'storage_upload_own'
  ) then
    execute $policy$
      create policy "storage_upload_own"
        on storage.objects for insert
        with check (
          bucket_id = 'report-images'
          and auth.role() = 'authenticated'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $policy$;
  end if;
end $$;

do $$
begin
  if to_regclass('storage.buckets') is null then return; end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'storage_select_own_or_officer'
  ) then
    execute $policy$
      create policy "storage_select_own_or_officer"
        on storage.objects for select
        using (
          bucket_id = 'report-images'
          and (
            (storage.foldername(name))[1] = auth.uid()::text
            or public.is_officer_or_admin()
          )
        )
    $policy$;
  end if;
end $$;

do $$
begin
  if to_regclass('storage.buckets') is null then return; end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'storage_delete_own'
  ) then
    execute $policy$
      create policy "storage_delete_own"
        on storage.objects for delete
        using (
          bucket_id = 'report-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $policy$;
  end if;
end $$;
