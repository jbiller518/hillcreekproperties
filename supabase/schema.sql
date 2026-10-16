-- ============================================================
--  Hillcreek Properties - Supabase schema
--  Paste this whole file into Supabase > SQL Editor > New query
--  and press Run. Safe to run more than once.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- properties ----------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  street text not null,
  unit text default '',
  city text not null default 'Columbus',
  state text not null default 'OH',
  zip text default '',
  type text not null default 'single-family' check (type in ('single-family','duplex')),
  beds numeric,
  baths numeric,
  sqft integer,
  rent integer,
  deposit integer,
  pets text,
  available_date date,
  lease_term text default '12 months',
  description text,
  features text[] default '{}',
  is_available boolean not null default false,
  cover_url text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists properties_touch on public.properties;
create trigger properties_touch before update on public.properties for each row execute function public.touch_updated_at();

-- ---------- gallery photos ----------
create table if not exists public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  caption text default '',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ---------- inquiries (applications / tours / waitlist) ----------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  property_name text,
  kind text not null default 'apply' check (kind in ('apply','tour','waitlist','contact')),
  name text not null,
  email text not null,
  phone text,
  move_in date,
  occupants text,
  pets text,
  message text,
  created_at timestamptz default now()
);

-- ---------- row level security ----------
alter table public.properties enable row level security;
alter table public.property_photos enable row level security;
alter table public.inquiries enable row level security;

-- Anyone can read homes & photos
drop policy if exists "public read properties" on public.properties;
create policy "public read properties" on public.properties for select using (true);
drop policy if exists "public read photos" on public.property_photos;
create policy "public read photos" on public.property_photos for select using (true);

-- Anyone can submit an inquiry, nobody anonymous can read them
drop policy if exists "public insert inquiries" on public.inquiries;
create policy "public insert inquiries" on public.inquiries for insert with check (true);

-- Signed-in owner (any authenticated user) can do everything
drop policy if exists "owner all properties" on public.properties;
create policy "owner all properties" on public.properties for all to authenticated using (true) with check (true);
drop policy if exists "owner all photos" on public.property_photos;
create policy "owner all photos" on public.property_photos for all to authenticated using (true) with check (true);
drop policy if exists "owner all inquiries" on public.inquiries;
create policy "owner all inquiries" on public.inquiries for all to authenticated using (true) with check (true);

-- ---------- storage bucket for photos ----------
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public read property photos" on storage.objects;
create policy "public read property photos" on storage.objects for select using (bucket_id = 'property-photos');
drop policy if exists "owner upload property photos" on storage.objects;
create policy "owner upload property photos" on storage.objects for insert to authenticated with check (bucket_id = 'property-photos');
drop policy if exists "owner update property photos" on storage.objects;
create policy "owner update property photos" on storage.objects for update to authenticated using (bucket_id = 'property-photos');
drop policy if exists "owner delete property photos" on storage.objects;
create policy "owner delete property photos" on storage.objects for delete to authenticated using (bucket_id = 'property-photos');

-- ---------- seed the 13 homes (skips any that already exist) ----------
insert into public.properties (slug, name, street, unit, city, zip, type, sort_order) values
  ('parkgate',       'The Parkgate House',     '1760 Parkgate Road',     '',       'Columbus',  '43229', 'single-family', 1),
  ('bremen',         'The Bremen Cottage',     '3368 Bremen Street',     '',       'Columbus',  '43224', 'single-family', 2),
  ('weber',          'The Weber House',        '1678 East Weber Road',   '',       'Columbus',  '43211', 'single-family', 3),
  ('urana',          'The Urana Bungalow',     '1067 Urana Avenue',      '',       'Columbus',  '43224', 'single-family', 4),
  ('collingwood',    'The Collingwood House',  '659 Collingwood Avenue', '',       'Whitehall', '43213', 'single-family', 5),
  ('hillcreek-3500', 'Hillcreek Court · 3500', '3500 Hillcreek Court',   '',       'Columbus',  '43224', 'duplex', 6),
  ('hillcreek-3502', 'Hillcreek Court · 3502', '3502 Hillcreek Court',   '',       'Columbus',  '43224', 'duplex', 7),
  ('hillcreek-3480', 'Hillcreek Court · 3480', '3480 Hillcreek Court',   '',       'Columbus',  '43224', 'duplex', 8),
  ('hillcreek-3482', 'Hillcreek Court · 3482', '3482 Hillcreek Court',   '',       'Columbus',  '43224', 'duplex', 9),
  ('hillcreek-3477', 'Hillcreek Court · 3477', '3477 Hillcreek Court',   '',       'Columbus',  '43224', 'duplex', 10),
  ('hillcreek-3479', 'Hillcreek Court · 3479', '3479 Hillcreek Court',   '',       'Columbus',  '43224', 'duplex', 11),
  ('beulah-a',       'Beulah Road · Unit A',   '3713 Beulah Road',       'Unit A', 'Columbus',  '43224', 'duplex', 12),
  ('beulah-b',       'Beulah Road · Unit B',   '3713 Beulah Road',       'Unit B', 'Columbus',  '43224', 'duplex', 13)
on conflict (slug) do nothing;
