create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  name text not null default '',
  picture text not null default '',
  place text not null default '',
  country text not null default 'India',
  gender text not null default '',
  age integer,
  height_cm numeric(6, 2),
  weight_kg numeric(6, 2),
  activity_level text not null default '',
  timezone text not null default 'Asia/Kolkata',
  daily_targets jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at timestamptz not null,
  date_key date not null,
  input_text text not null default '',
  photo_path text not null default '',
  photo_url text not null default '',
  ai_provider text not null default '',
  ai_extracted_items jsonb not null default '[]'::jsonb,
  final_items jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  totals jsonb not null default '{}'::jsonb,
  target_comparison jsonb not null default '{}'::jsonb,
  missing_nutrients jsonb not null default '[]'::jsonb,
  feedback_tips jsonb not null default '[]'::jsonb,
  meal_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date_key)
);

create index if not exists idx_meal_entries_user_date on public.meal_entries (user_id, date_key desc, logged_at desc);
create index if not exists idx_daily_summaries_user_date on public.daily_summaries (user_id, date_key desc);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_meal_entries_updated_at on public.meal_entries;
create trigger trg_meal_entries_updated_at
before update on public.meal_entries
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_daily_summaries_updated_at on public.daily_summaries;
create trigger trg_daily_summaries_updated_at
before update on public.daily_summaries
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.meal_entries enable row level security;
alter table public.daily_summaries enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "meal_entries_select_own"
on public.meal_entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "meal_entries_insert_own"
on public.meal_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "meal_entries_update_own"
on public.meal_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "meal_entries_delete_own"
on public.meal_entries
for delete
to authenticated
using (auth.uid() = user_id);

create policy "daily_summaries_select_own"
on public.daily_summaries
for select
to authenticated
using (auth.uid() = user_id);

create policy "daily_summaries_insert_own"
on public.daily_summaries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "daily_summaries_update_own"
on public.daily_summaries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "daily_summaries_delete_own"
on public.daily_summaries
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

create policy "meal_photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'meal-photos');

create policy "meal_photos_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "meal_photos_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "meal_photos_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
