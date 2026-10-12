-- The Eye Analyst: subscriber article submissions and editorial workflow.
-- Run in Supabase SQL Editor. Subscribers must create an account/sign in to submit articles.
-- Then create/log in to the site-owner account through Supabase Auth and promote it
-- using the final UPDATE statement below (replace the email).
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'writer' check (role in ('writer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null check (char_length(author_name) between 1 and 80),
  author_email text not null check (char_length(author_email) between 3 and 150),
  title text not null check (char_length(title) between 1 and 140),
  category text not null check (char_length(category) between 1 and 80),
  summary text not null check (char_length(summary) between 1 and 3000),
  status text not null default 'pending' check (status in ('pending','approved','rejected','published')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists articles_status_created_at_idx on public.articles(status, created_at desc);
create index if not exists articles_published_at_idx on public.articles(published_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''), 'writer')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_eye_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_eye_admin() from public;
grant execute on function public.is_eye_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.articles enable row level security;

drop policy if exists "Users read own profile or admins read all" on public.profiles;
create policy "Users read own profile or admins read all" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_eye_admin());

drop policy if exists "Public read published articles" on public.articles;
create policy "Public read published articles" on public.articles
for select to anon, authenticated using (status = 'published' or public.is_eye_admin());

drop policy if exists "Public submit pending articles" on public.articles;
drop policy if exists "Subscribers submit their own pending articles" on public.articles;
create policy "Subscribers submit their own pending articles" on public.articles
for insert to authenticated with check (
  status = 'pending'
  and author_id = auth.uid()
  and char_length(author_name) between 1 and 80
  and char_length(author_email) between 3 and 150
  and char_length(title) between 1 and 140
  and char_length(summary) between 1 and 3000
);

drop policy if exists "Admins update articles" on public.articles;
create policy "Admins update articles" on public.articles
for update to authenticated using (public.is_eye_admin()) with check (public.is_eye_admin());

drop policy if exists "Admins delete articles" on public.articles;
create policy "Admins delete articles" on public.articles
for delete to authenticated using (public.is_eye_admin());

grant select on public.profiles to authenticated;
grant select on public.articles to anon, authenticated;
revoke insert on public.articles from anon;
grant insert on public.articles to authenticated;
grant update, delete on public.articles to authenticated;

-- After you create your account in Supabase Auth, promote that exact account:
-- UPDATE public.profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR-ADMIN-EMAIL');
