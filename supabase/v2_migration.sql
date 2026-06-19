-- SQL Migration for FitClub V2 Evolution

-- 1. Alter profiles table to add goal tracking fields
alter table public.profiles 
add column if not exists daily_calorie_goal integer default null,
add column if not exists goal_type text default 'maintain' check (goal_type in ('lose_weight', 'maintain', 'gain_weight')),
add column if not exists target_weight numeric default null;

-- 2. Create comments table (limit to 300 characters)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid references public.meal_logs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content varchar(300) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create encouragements table (separately from comments, unique constraints for toggling)
create table if not exists public.encouragements (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid references public.meal_logs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(meal_log_id, user_id, text)
);

-- 4. Enable RLS on new tables
alter table public.comments enable row level security;
alter table public.encouragements enable row level security;

-- 5. Set up RLS policies for comments
create policy "Comments are viewable by club members" on public.comments
  for select using (
    exists (
      select 1 from public.meal_logs
      where meal_logs.id = comments.meal_log_id 
      and public.is_club_member(meal_logs.club_id, auth.uid())
    )
  );

create policy "Club members can insert comments" on public.comments
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.meal_logs
      where meal_logs.id = comments.meal_log_id 
      and public.is_club_member(meal_logs.club_id, auth.uid())
    )
  );

create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);

-- 6. Set up RLS policies for encouragements
create policy "Encouragements are viewable by club members" on public.encouragements
  for select using (
    exists (
      select 1 from public.meal_logs
      where meal_logs.id = encouragements.meal_log_id 
      and public.is_club_member(meal_logs.club_id, auth.uid())
    )
  );

create policy "Club members can toggle encouragements" on public.encouragements
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.meal_logs
      where meal_logs.id = encouragements.meal_log_id 
      and public.is_club_member(meal_logs.club_id, auth.uid())
    )
  );

create policy "Users can remove their own encouragements" on public.encouragements
  for delete using (auth.uid() = user_id);

-- 7. Add meal log update/delete policies
create policy "Users can update their own meal logs" on public.meal_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete their own meal logs" on public.meal_logs
  for delete using (auth.uid() = user_id);

-- 8. Consolidated streak recalculation trigger (handles deletes/updates)
create or replace function public.recalculate_user_streak(p_user_id uuid)
returns void as $$
declare
  v_current_streak integer := 0;
  v_longest_streak integer := 0;
  v_last_date date := null;
  v_rec record;
begin
  -- Retrieve and loop through distinct logged dates
  for v_rec in (
    select distinct (created_at at time zone 'utc')::date as log_date
    from public.meal_logs
    where user_id = p_user_id
    order by log_date asc
  ) loop
    if v_last_date is null then
      v_current_streak := 1;
    elsif v_rec.log_date = v_last_date then
      -- Same day, skip
    elsif v_rec.log_date = v_last_date + 1 then
      v_current_streak := v_current_streak + 1;
    else
      v_current_streak := 1;
    end if;

    if v_current_streak > v_longest_streak then
      v_longest_streak := v_current_streak;
    end if;

    v_last_date := v_rec.log_date;
  end loop;

  -- Reset current streak to 0 if they haven't logged today or yesterday
  if v_last_date is not null and v_last_date < current_date - 1 then
    v_current_streak := 0;
  end if;

  -- Upsert streak record
  insert into public.streaks (user_id, current_streak, longest_streak, last_logged_date)
  values (p_user_id, v_current_streak, v_longest_streak, v_last_date)
  on conflict (user_id) do update
  set current_streak = excluded.current_streak,
      longest_streak = excluded.longest_streak,
      last_logged_date = excluded.last_logged_date;
end;
$$ language plpgsql security definer;

create or replace function public.on_meal_log_change()
returns trigger as $$
declare
  v_user_id uuid;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    v_user_id := new.user_id;
  else
    v_user_id := old.user_id;
  end if;
  
  perform public.recalculate_user_streak(v_user_id);
  return null;
end;
$$ language plpgsql security definer;

-- Remove old single-action trigger
drop trigger if exists on_meal_logged on public.meal_logs;
drop trigger if exists on_meal_log_change_trigger on public.meal_logs;

-- Establish consolidated trigger for all modifications
create trigger on_meal_log_change_trigger
  after insert or update or delete on public.meal_logs
  for each row execute procedure public.on_meal_log_change();

-- 9. Add scale-optimized indexes for high volume queries (100k+ meal logs)
create index if not exists idx_meal_logs_club_created on public.meal_logs (club_id, created_at desc);
create index if not exists idx_meal_logs_user on public.meal_logs (user_id);
create index if not exists idx_comments_meal_log on public.comments (meal_log_id);
create index if not exists idx_encouragements_meal_log on public.encouragements (meal_log_id);
create index if not exists idx_reactions_meal_log on public.reactions (meal_log_id);

-- 10. Club owner can delete their own club (cascades to members, meal_logs, reactions, comments)
create policy "Club owners can delete their club" on public.clubs
  for delete using (auth.uid() = owner_id);
