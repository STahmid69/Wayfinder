-- WAYFINDER SUPABASE ARCHITECTURE
-- Copy and paste this directly into your Supabase SQL Editor to instantly generate your entire backend database!

-- 1. Users (Profiles)
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  car_name text,
  color_hex text default '#FF6A00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Trips/Convoys
CREATE TABLE public.convoys (
  id uuid default gen_random_uuid() primary key,
  join_code text unique not null,
  name text not null,
  status text default 'ACTIVE',
  destination text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Convoy Members
CREATE TABLE public.convoy_members (
  id uuid default gen_random_uuid() primary key,
  convoy_id uuid references public.convoys on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  role text default 'DRIVER',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Live Locations (For Convoy Radar Map)
CREATE TABLE public.live_locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  convoy_id uuid references public.convoys on delete cascade not null,
  latitude double precision not null,
  longitude double precision not null,
  speed_mph numeric default 0,
  heading numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Chat Messages
CREATE TABLE public.messages (
  id uuid default gen_random_uuid() primary key,
  convoy_id uuid references public.convoys on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Votes / Pit-stops
CREATE TABLE public.votes (
  id uuid default gen_random_uuid() primary key,
  convoy_id uuid references public.convoys on delete cascade not null,
  proposed_by uuid references public.profiles not null,
  title text not null,
  status text default 'OPEN', -- OPEN, CLOSED
  closing_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.vote_options (
  id uuid default gen_random_uuid() primary key,
  vote_id uuid references public.votes on delete cascade not null,
  option_text text not null,
  votes_count integer default 0
);

-- Enable Realtime For Actionable Tables
BEGIN;
  -- If publication exists, this safely ignores throwing hard errors or we just use IF NOT EXISTS logic
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE live_locations, messages, votes, vote_options;
COMMIT;
