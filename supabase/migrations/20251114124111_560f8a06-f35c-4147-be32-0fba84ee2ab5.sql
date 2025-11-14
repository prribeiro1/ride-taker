-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create routes table
create table public.routes (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.routes enable row level security;

create policy "Users can view their own routes"
  on public.routes for select
  using (auth.uid() = user_id);

create policy "Users can create their own routes"
  on public.routes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own routes"
  on public.routes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own routes"
  on public.routes for delete
  using (auth.uid() = user_id);

-- Create points table
create table public.points (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  route_id uuid not null references public.routes on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.points enable row level security;

create policy "Users can view their own points"
  on public.points for select
  using (auth.uid() = user_id);

create policy "Users can create their own points"
  on public.points for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own points"
  on public.points for update
  using (auth.uid() = user_id);

create policy "Users can delete their own points"
  on public.points for delete
  using (auth.uid() = user_id);

-- Create children table
create table public.children (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  point_id uuid not null references public.points on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.children enable row level security;

create policy "Users can view their own children"
  on public.children for select
  using (auth.uid() = user_id);

create policy "Users can create their own children"
  on public.children for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own children"
  on public.children for update
  using (auth.uid() = user_id);

create policy "Users can delete their own children"
  on public.children for delete
  using (auth.uid() = user_id);

-- Create attendance table
create table public.attendance (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  child_id uuid not null references public.children on delete cascade,
  route_id uuid not null references public.routes on delete cascade,
  date date not null default current_date,
  status text not null check (status in ('present', 'absent')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(child_id, date)
);

alter table public.attendance enable row level security;

create policy "Users can view their own attendance"
  on public.attendance for select
  using (auth.uid() = user_id);

create policy "Users can create their own attendance"
  on public.attendance for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own attendance"
  on public.attendance for update
  using (auth.uid() = user_id);

create policy "Users can delete their own attendance"
  on public.attendance for delete
  using (auth.uid() = user_id);

-- Create function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for automatic timestamp updates
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_routes_updated_at
  before update on public.routes
  for each row execute function public.update_updated_at_column();

create trigger update_points_updated_at
  before update on public.points
  for each row execute function public.update_updated_at_column();

create trigger update_children_updated_at
  before update on public.children
  for each row execute function public.update_updated_at_column();

create trigger update_attendance_updated_at
  before update on public.attendance
  for each row execute function public.update_updated_at_column();

-- Create function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Create trigger for automatic profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();