create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  restrictions text[] not null default '{}',
  favorites text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'name',''), new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create type public.app_role as enum ('admin', 'staff');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create policy "Own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  restaurant_id text not null,
  table_id text not null,
  slot text not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, table_id, slot)
);
grant select, insert, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Own bookings read" on public.bookings for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'staff') or public.has_role(auth.uid(),'admin'));
create policy "Own bookings insert" on public.bookings for insert to authenticated with check (auth.uid() = user_id);
create policy "Own bookings delete" on public.bookings for delete to authenticated using (auth.uid() = user_id);

create or replace function public.booked_tables()
returns table (restaurant_id text, table_id text, slot text)
language sql stable security definer set search_path = public as $$
  select b.restaurant_id, b.table_id, b.slot from public.bookings b
$$;
grant execute on function public.booked_tables() to anon, authenticated;

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  restaurant_id text not null,
  reason text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.feedback to authenticated;
grant all on public.feedback to service_role;
alter table public.feedback enable row level security;
create policy "Own feedback insert" on public.feedback for insert to authenticated with check (auth.uid() = user_id);
create policy "Staff read feedback" on public.feedback for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'staff') or public.has_role(auth.uid(),'admin'));