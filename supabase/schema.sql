-- Apni Dukaan — database schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_name text not null default 'My Shop',
  owner_name text not null default '',
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "own profile select" on public.profiles;
create policy "own profile select" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, shop_name, owner_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'shop_name', 'My Shop'),
    coalesce(new.raw_user_meta_data ->> 'owner_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ shop data ============
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  urdu text not null default '',
  category text not null default 'Grocery',
  unit text not null default 'kg',
  stock numeric not null default 0,
  low_stock_at numeric not null default 5,
  buy_price numeric not null default 0,
  sell_price numeric not null default 0,
  supplier text not null default '',
  barcode text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null default '',
  area text not null default '',
  balance numeric not null default 0,
  last_paid timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null default '',
  city text not null default '',
  payable numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text not null default '',
  items integer not null default 0,
  total numeric not null default 0,
  status text not null default 'unpaid',
  at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'Chai / Misc',
  amount numeric not null default 0,
  at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'Salesman',
  phone text not null default '',
  salary numeric not null default 0,
  shift text not null default '',
  active boolean not null default true,
  today_sales numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lines jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  cost numeric not null default 0,
  method text not null default 'cash',
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  at timestamptz not null default now()
);

create table if not exists public.stock_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  type text not null default 'adjust',
  qty numeric not null default 0,
  note text not null default '',
  at timestamptz not null default now()
);

-- ============ grants + RLS (owner-only) ============
do $$
declare t text;
begin
  foreach t in array array[
    'products','customers','suppliers','purchases','expenses','staff','sales','stock_moves'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner all" on public.%I', t);
    execute format(
      'create policy "owner all" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
    execute format('create index if not exists %I on public.%I(user_id)', t || '_user_id_idx', t);
  end loop;
end $$;
