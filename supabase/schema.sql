-- SQL Schema for FitClub MVP

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Linked to Auth users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Streaks Table
create table public.streaks (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_logged_date date
);

-- 3. Clubs Table
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null,
  invite_code text unique not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Club Members Table
create table public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(club_id, user_id)
);

-- 5. Meal Logs Table
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  food_name text not null,
  calories integer not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Reactions Table
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid references public.meal_logs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(meal_log_id, user_id, emoji)
);

-- -------------------------------------------------------------
-- Triggers and Functions
-- -------------------------------------------------------------

-- Trigger function for automated user profile and streak initialization
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  insert into public.streaks (user_id, current_streak, longest_streak)
  values (new.id, 0, 0);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger function for daily streak logging mechanics
create or replace function public.update_user_streak()
returns trigger as $$
declare
  last_log date;
  curr_streak integer;
  long_streak integer;
  today date := current_date;
begin
  -- Retrieve current streaks
  select last_logged_date, current_streak, longest_streak
  into last_log, curr_streak, long_streak
  from public.streaks
  where user_id = new.user_id;

  if last_log is null then
    curr_streak := 1;
  elsif last_log = today then
    -- Already logged today, keep streak unchanged
    return new;
  elsif last_log = today - 1 then
    -- Logged yesterday, increment streak
    curr_streak := curr_streak + 1;
  else
    -- Missed a day or more, reset streak to 1
    curr_streak := 1;
  end if;

  if curr_streak > long_streak then
    long_streak := curr_streak;
  end if;

  update public.streaks
  set current_streak = curr_streak,
      longest_streak = long_streak,
      last_logged_date = today
  where user_id = new.user_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_meal_logged
  after insert on public.meal_logs
  for each row execute procedure public.update_user_streak();

-- Active Streaks View (resets current streak dynamically if missed yesterday)
create or replace view public.active_streaks as
select
  user_id,
  case 
    when last_logged_date is null then 0
    when last_logged_date < current_date - 1 then 0
    else current_streak
  end as current_streak,
  longest_streak,
  last_logged_date
from public.streaks;

-- -------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- -------------------------------------------------------------

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.streaks enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.meal_logs enable row level security;
alter table public.reactions enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Streaks Policies
create policy "Streaks are viewable by everyone" on public.streaks
  for select using (true);

-- -------------------------------------------------------------
-- Club Membership Helper Function (Security Definer)
-- -------------------------------------------------------------
-- Bypasses RLS circular evaluation by running membership queries under the owner's privileges.
create or replace function public.is_club_member(club_id uuid, user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.club_members
    where club_members.club_id = $1 and club_members.user_id = $2
  );
end;
$$ language plpgsql security definer;

-- Clubs Policies
create policy "Clubs are viewable by authenticated users" on public.clubs
  for select using (
    auth.uid() is not null
  );

create policy "Authenticated users can create clubs" on public.clubs
  for insert with check (auth.uid() = owner_id);

-- Club Members Policies
create policy "Club members are viewable by other members" on public.club_members
  for select using (
    public.is_club_member(club_id, auth.uid())
  );

create policy "Users can join clubs" on public.club_members
  for insert with check (auth.uid() = user_id);

create policy "Members can leave clubs" on public.club_members
  for delete using (auth.uid() = user_id);

-- Meal Logs Policies
create policy "Meal logs are viewable by club members" on public.meal_logs
  for select using (
    public.is_club_member(club_id, auth.uid())
  );

create policy "Club members can insert meal logs" on public.meal_logs
  for insert with check (
    auth.uid() = user_id and
    public.is_club_member(club_id, auth.uid())
  );

-- Reactions Policies
create policy "Reactions are viewable by club members" on public.reactions
  for select using (
    exists (
      select 1 from public.meal_logs
      where meal_logs.id = reactions.meal_log_id 
      and public.is_club_member(meal_logs.club_id, auth.uid())
    )
  );

create policy "Club members can react to meal logs" on public.reactions
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.meal_logs
      where meal_logs.id = reactions.meal_log_id 
      and public.is_club_member(meal_logs.club_id, auth.uid())
    )
  );

create policy "Users can remove their own reactions" on public.reactions
  for delete using (auth.uid() = user_id);
