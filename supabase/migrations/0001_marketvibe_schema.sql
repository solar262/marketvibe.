create extension if not exists "uuid-ossp";

create table if not exists admins (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text default '',
  image text default '',
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  description text not null,
  images text[] default '{}',
  category_id uuid references categories(id),
  supplier_name text,
  supplier_url text,
  supplier_cost numeric(10,2) not null default 0,
  selling_price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  sku text,
  stock integer not null default 0,
  shipping_time text,
  tags text[] default '{}',
  seo_title text,
  seo_description text,
  active boolean default true,
  featured boolean default false,
  affiliate_url text,
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  address text,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  customer_id uuid references customers(id),
  status text not null default 'pending',
  fulfillment_status text not null default 'new',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  profit numeric(10,2) not null default 0,
  stripe_session_id text,
  tracking_number text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  title text not null,
  quantity integer not null,
  supplier_url text,
  supplier_cost numeric(10,2) not null default 0,
  selling_price numeric(10,2) not null default 0
);

create table if not exists cart_sessions (
  id uuid primary key default uuid_generate_v4(),
  session_key text unique not null,
  items jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists settings (
  id integer primary key default 1,
  store_name text not null,
  logo_url text,
  accent_color text default '#111827',
  support_email text,
  currency text default 'USD',
  default_shipping_message text,
  homepage_hero_text text,
  seo_title text,
  seo_description text,
  constraint one_settings_row check (id = 1)
);

create table if not exists import_batches (
  id uuid primary key default uuid_generate_v4(),
  filename text,
  status text not null default 'preview',
  row_count integer default 0,
  errors jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table admins enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table customers enable row level security;
alter table settings enable row level security;

create policy "Public can read active products" on products for select using (active = true);
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read settings" on settings for select using (true);
