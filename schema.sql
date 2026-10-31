-- Run this whole file once in Supabase > SQL Editor
create table profiles(id uuid primary key references auth.users on delete cascade, name text, role text default 'fresher' check (role in ('fresher','owner')));
create table listings(id uuid primary key default gen_random_uuid(), owner_id uuid references profiles(id) on delete cascade, owner_name text, title text not null, type text not null check (type in ('PG','Flat','Hostel')), area text not null, rent int not null, gender text default 'Any', distance_km numeric default 1, amenities text[] default '{}', description text, contact text, created_at timestamptz default now());
create table messes(id uuid primary key default gen_random_uuid(), name text not null, area text not null, price_per_meal int, kind text);
create table enquiries(id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete cascade, user_id uuid references profiles(id) on delete cascade, message text, created_at timestamptz default now());
create table saved(user_id uuid references profiles(id) on delete cascade, listing_id uuid references listings(id) on delete cascade, primary key(user_id, listing_id));

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,name,role) values (new.id, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role','fresher')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security; alter table listings enable row level security; alter table messes enable row level security; alter table enquiries enable row level security; alter table saved enable row level security;
create policy "profiles readable" on profiles for select using (true);
create policy "listings public read" on listings for select using (true);
create policy "owners add listings" on listings for insert to authenticated with check (owner_id = auth.uid());
create policy "owners edit listings" on listings for update to authenticated using (owner_id = auth.uid());
create policy "owners delete listings" on listings for delete to authenticated using (owner_id = auth.uid());
create policy "messes public read" on messes for select using (true);
create policy "send enquiry" on enquiries for insert to authenticated with check (user_id = auth.uid());
create policy "read own or received enquiries" on enquiries for select to authenticated using (user_id = auth.uid() or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
create policy "own saved" on saved for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Sample data (edit rent, area and contact to real values)
insert into listings(owner_name,title,type,area,rent,gender,distance_km,amenities,description,contact) values
('Samarth PG House','Samarth PG House','PG','Karve Nagar',9500,'Any',1.2,'{WiFi,Meals,Laundry,Power backup}','Established PG with multiple branches, furnished rooms and meals included.','+91 90000 00001'),
('Dream Team PG House','Dream Team PG House','PG','Karve Nagar',6500,'Any',1.8,'{WiFi,Meals}','Small, friendly single-location PG with budget rooms for freshers.','+91 90000 00002');
insert into messes(name,area,price_per_meal,kind) values
('Annapurna Mess','Karve Nagar',70,'Veg'),('Student Tiffin Corner','Karve Nagar',60,'Veg / Non-veg'),('Campus Canteen Point','Karve Nagar',50,'Snacks & meals');
