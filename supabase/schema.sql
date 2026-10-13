-- Analyst database foundation for Supabase (PostgreSQL).
-- Apply only to a NEW Supabase project after reviewing the setup guide.
-- This schema is a starting point; it does not connect the current static website
-- to a database and does not move or pay real money.

create extension if not exists pgcrypto;

do $$ begin
  create type public.analyst_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ledger_entry_type as enum ('admin_credit', 'admin_debit', 'withdrawal_debit', 'withdrawal_refund');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.withdrawal_status as enum ('pending', 'approved', 'rejected', 'paid');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.analyst_role not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  currency text not null default 'UGX' check (currency = 'UGX'),
  created_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(user_id) on delete restrict,
  amount bigint not null check (amount > 0),
  entry_type public.ledger_entry_type not null,
  note text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(user_id) on delete restrict,
  amount bigint not null check (amount > 0),
  status public.withdrawal_status not null default 'pending',
  user_note text not null default '',
  admin_note text not null default '',
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz
);

create index if not exists ledger_entries_user_created_idx
  on public.ledger_entries (user_id, created_at desc);
create index if not exists withdrawal_requests_user_created_idx
  on public.withdrawal_requests (user_id, created_at desc);
create index if not exists withdrawal_requests_status_created_idx
  on public.withdrawal_requests (status, created_at desc);

-- Security-definer helper avoids recursive RLS checks against profiles.
create or replace function public.is_analyst_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'::public.analyst_role
  );
$$;

revoke all on function public.is_analyst_admin() from public;
grant execute on function public.is_analyst_admin() to authenticated;

-- Create a basic user profile and empty account whenever Supabase Auth creates a user.
create or replace function public.handle_new_analyst_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;

  insert into public.accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_analyst on auth.users;
create trigger on_auth_user_created_analyst
  after insert on auth.users
  for each row execute procedure public.handle_new_analyst_user();

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.withdrawal_requests enable row level security;

-- Users can read their own profile; only an existing admin can read all profiles.
drop policy if exists "Read own profile or admin reads all" on public.profiles;
create policy "Read own profile or admin reads all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_analyst_admin()));

-- No client-side INSERT/UPDATE/DELETE policy on profiles: users cannot promote themselves.
drop policy if exists "Read own account or admin reads all" on public.accounts;
create policy "Read own account or admin reads all"
  on public.accounts for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_analyst_admin()));

drop policy if exists "Read own ledger or admin reads all" on public.ledger_entries;
create policy "Read own ledger or admin reads all"
  on public.ledger_entries for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_analyst_admin()));

drop policy if exists "Read own withdrawals or admin reads all" on public.withdrawal_requests;
create policy "Read own withdrawals or admin reads all"
  on public.withdrawal_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_analyst_admin()));

-- Users may request a withdrawal for themselves. The status is forced to pending;
-- direct client updates/deletes are deliberately not permitted.
drop policy if exists "Users can request own withdrawals" on public.withdrawal_requests;
create policy "Users can request own withdrawals"
  on public.withdrawal_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'::public.withdrawal_status
    and reviewed_by is null
    and reviewed_at is null
    and paid_at is null
  );

-- Only authenticated users can execute these server-side database functions.
-- They validate role, account ownership, positive whole UGX amounts and balance.
create or replace function public.admin_adjust_balance(
  p_user_id uuid,
  p_amount bigint,
  p_direction text,
  p_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance bigint;
  v_reserved bigint;
  v_entry_id uuid;
  v_amount bigint;
begin
  if auth.uid() is null or not public.is_analyst_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_user_id is null or p_amount is null or p_amount <= 0 then
    raise exception 'Enter a positive whole amount in UGX';
  end if;
  if p_direction not in ('credit', 'debit') then
    raise exception 'Direction must be credit or debit';
  end if;
  if length(coalesce(p_note, '')) > 500 then
    raise exception 'Note must be 500 characters or fewer';
  end if;

  perform 1 from public.accounts where user_id = p_user_id for update;
  if not found then raise exception 'Account not found'; end if;

  select coalesce(sum(
    case
      when entry_type in ('admin_credit', 'withdrawal_refund') then amount
      else -amount
    end
  ), 0)::bigint
  into v_balance
  from public.ledger_entries
  where user_id = p_user_id;

  select coalesce(sum(amount), 0)::bigint into v_reserved
  from public.withdrawal_requests
  where user_id = p_user_id and status in ('pending', 'approved');

  if p_direction = 'debit' and p_amount > v_balance - v_reserved then
    raise exception 'Insufficient available balance after pending withdrawals';
  end if;

  v_amount := p_amount;
  insert into public.ledger_entries (user_id, amount, entry_type, note, created_by)
  values (
    p_user_id,
    v_amount,
    case when p_direction = 'credit'
      then 'admin_credit'::public.ledger_entry_type
      else 'admin_debit'::public.ledger_entry_type
    end,
    coalesce(p_note, ''),
    auth.uid()
  )
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

create or replace function public.request_analyst_withdrawal(
  p_amount bigint,
  p_user_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance bigint;
  v_pending bigint;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in required' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter a positive whole amount in UGX';
  end if;
  if length(coalesce(p_user_note, '')) > 500 then
    raise exception 'Note must be 500 characters or fewer';
  end if;

  perform 1 from public.accounts where user_id = v_user_id for update;
  if not found then raise exception 'Account not found'; end if;

  select coalesce(sum(
    case
      when entry_type in ('admin_credit', 'withdrawal_refund') then amount
      else -amount
    end
  ), 0)::bigint
  into v_balance
  from public.ledger_entries
  where user_id = v_user_id;

  select coalesce(sum(amount), 0)::bigint into v_pending
  from public.withdrawal_requests
  where user_id = v_user_id and status in ('pending', 'approved');

  if p_amount > v_balance - v_pending then
    raise exception 'Insufficient available balance';
  end if;

  insert into public.withdrawal_requests (user_id, amount, user_note)
  values (v_user_id, p_amount, coalesce(p_user_note, ''))
  returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.admin_review_withdrawal(
  p_request_id uuid,
  p_decision text,
  p_admin_note text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.withdrawal_requests%rowtype;
  v_balance bigint;
begin
  if auth.uid() is null or not public.is_analyst_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_decision not in ('approve', 'reject', 'mark_paid') then
    raise exception 'Decision must be approve, reject, or mark_paid';
  end if;
  if length(coalesce(p_admin_note, '')) > 500 then
    raise exception 'Note must be 500 characters or fewer';
  end if;

  select * into v_request
  from public.withdrawal_requests
  where id = p_request_id
  for update;
  if not found then raise exception 'Withdrawal request not found'; end if;

  if p_decision = 'approve' then
    if v_request.status <> 'pending' then raise exception 'Only pending requests can be approved'; end if;
    update public.withdrawal_requests
      set status = 'approved', admin_note = coalesce(p_admin_note, ''),
          reviewed_by = auth.uid(), reviewed_at = now()
      where id = p_request_id;
    return;
  end if;

  if p_decision = 'reject' then
    if v_request.status not in ('pending', 'approved') then
      raise exception 'This request has already been completed';
    end if;
    update public.withdrawal_requests
      set status = 'rejected', admin_note = coalesce(p_admin_note, ''),
          reviewed_by = auth.uid(), reviewed_at = now()
      where id = p_request_id;
    return;
  end if;

  if v_request.status <> 'approved' then
    raise exception 'Only approved requests can be marked paid';
  end if;

  perform 1 from public.accounts where user_id = v_request.user_id for update;
  select coalesce(sum(
    case
      when entry_type in ('admin_credit', 'withdrawal_refund') then amount
      else -amount
    end
  ), 0)::bigint
  into v_balance
  from public.ledger_entries
  where user_id = v_request.user_id;

  if v_request.amount > v_balance then
    raise exception 'Insufficient balance to complete this withdrawal';
  end if;

  insert into public.ledger_entries (user_id, amount, entry_type, note, created_by)
  values (
    v_request.user_id, v_request.amount, 'withdrawal_debit',
    'Withdrawal request ' || p_request_id::text, auth.uid()
  );

  update public.withdrawal_requests
    set status = 'paid', admin_note = coalesce(p_admin_note, ''),
        reviewed_by = auth.uid(), reviewed_at = coalesce(reviewed_at, now()), paid_at = now()
    where id = p_request_id;
end;
$$;

revoke all on function public.admin_adjust_balance(uuid, bigint, text, text) from public;
revoke all on function public.request_analyst_withdrawal(bigint, text) from public;
revoke all on function public.admin_review_withdrawal(uuid, text, text) from public;
grant execute on function public.admin_adjust_balance(uuid, bigint, text, text) to authenticated;
grant execute on function public.request_analyst_withdrawal(bigint, text) to authenticated;
grant execute on function public.admin_review_withdrawal(uuid, text, text) to authenticated;

-- IMPORTANT: designate the first trusted administrator manually in the Supabase SQL
-- editor after verifying the user's auth.users ID:
-- update public.profiles set role = 'admin' where id = '<trusted-auth-user-uuid>';
-- Never expose a service-role key in browser code or commit it to Git.
