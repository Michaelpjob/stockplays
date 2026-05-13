-- Plays — initial schema
-- This is v0. It covers the core surfaces (profiles, plays, holdings,
-- subscriptions, engagement, comments). Nightly performance, notifications,
-- admin review, and reports tables are intentionally simple here and can
-- be extended without breaking changes.

create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles — extends auth.users 1:1
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  handle          text unique not null check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name    text not null,
  bio             text,
  avatar          text,
  website         text,
  x_handle        text,
  linkedin        text,
  role            text not null default 'member' check (role in ('member','curator','reviewer','admin')),
  karma           int  not null default 0,
  strikes_count   int  not null default 0,
  privacy_show_karma boolean not null default true,
  created_at      timestamptz not null default now()
);

-- After-signup trigger to create an empty profile.
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', concat('user_', substr(replace(new.id::text, '-', ''), 1, 8))),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- plays — a thesis + basket
-- ============================================================
create type play_status as enum (
  'draft','submitted','in_review','approved','revisions_requested','rejected','unpublished'
);

create type rebalance_cadence as enum ('Quarterly','Monthly','Threshold-triggered','Manual');

create type category as enum ('AI','Power','Cyber','Biotech','Defense','Industrial');

create table public.plays (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  name            text not null,
  category        category not null,
  author_id       uuid not null references public.profiles(id) on delete restrict,
  thesis_short    text not null,
  thesis_long     text not null,
  benchmark       text not null,
  rebalance       rebalance_cadence not null default 'Quarterly',
  status          play_status not null default 'draft',
  subscribers     int not null default 0,
  kudos           int not null default 0,
  followers       int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  approved_at     timestamptz,
  reviewer_id     uuid references public.profiles(id),
  reviewer_notes  text
);

create index plays_status_idx on public.plays (status);
create index plays_category_idx on public.plays (category);
create index plays_author_idx on public.plays (author_id);

-- ============================================================
-- holdings — current weights for a play
-- ============================================================
create table public.play_holdings (
  play_id   uuid references public.plays(id) on delete cascade,
  ticker    text not null,
  weight    numeric(5,2) not null check (weight >= 0 and weight <= 50),
  primary key (play_id, ticker)
);

-- Historical record of every weight change (driven by triggers from app).
create table public.play_holdings_history (
  id              bigserial primary key,
  play_id         uuid not null references public.plays(id) on delete cascade,
  ticker          text not null,
  weight          numeric(5,2) not null,
  effective_from  date not null,
  effective_to    date
);

create index pl_holdings_hist_play_idx on public.play_holdings_history (play_id);

-- ============================================================
-- play updates (thesis updates / rebalance notes)
-- ============================================================
create table public.play_updates (
  id          uuid primary key default uuid_generate_v4(),
  play_id     uuid not null references public.plays(id) on delete cascade,
  body        text not null,
  posted_by   uuid not null references public.profiles(id),
  posted_at   timestamptz not null default now()
);

create index play_updates_play_idx on public.play_updates (play_id, posted_at desc);

-- ============================================================
-- subscriptions
-- ============================================================
create type subscription_status as enum ('active','paused','cancelled');

create table public.subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  play_id         uuid not null references public.plays(id) on delete cascade,
  inception_date  date not null,
  status          subscription_status not null default 'active',
  created_at      timestamptz not null default now(),
  cancelled_at    timestamptz
);

create unique index subscriptions_active_per_user_play
  on public.subscriptions (user_id, play_id)
  where status = 'active';

-- ============================================================
-- engagement: kudos, follows, saves
-- ============================================================
create table public.kudos (
  user_id uuid references public.profiles(id) on delete cascade,
  play_id uuid references public.plays(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, play_id)
);

create table public.follows (
  user_id uuid references public.profiles(id) on delete cascade,
  play_id uuid references public.plays(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, play_id)
);

create table public.saves (
  user_id uuid references public.profiles(id) on delete cascade,
  play_id uuid references public.plays(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, play_id)
);

-- user-to-user follows
create table public.user_follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  followed_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

-- ============================================================
-- discussion (comments + dissertations)
-- ============================================================
create type discussion_type as enum ('comment','dissertation');
create type discussion_visibility as enum (
  'visible','hidden_by_curator','hidden_by_admin','hidden_by_auto'
);

create table public.discussion_items (
  id           uuid primary key default uuid_generate_v4(),
  play_id      uuid not null references public.plays(id) on delete cascade,
  parent_id    uuid references public.discussion_items(id) on delete cascade,
  type         discussion_type not null default 'comment',
  author_id    uuid not null references public.profiles(id),
  title        text,
  body         text not null,
  pinned       boolean not null default false,
  visibility   discussion_visibility not null default 'visible',
  upvotes      int not null default 0,
  downvotes    int not null default 0,
  reply_count  int not null default 0,
  created_at   timestamptz not null default now()
);

create index discussion_items_play_idx on public.discussion_items (play_id, created_at desc);

create table public.comment_votes (
  user_id      uuid references public.profiles(id) on delete cascade,
  comment_id   uuid references public.discussion_items(id) on delete cascade,
  vote         smallint not null check (vote in (-1, 1)),
  created_at   timestamptz not null default now(),
  primary key (user_id, comment_id)
);

-- ============================================================
-- stocks (snapshot table — refreshed nightly from an external source)
-- ============================================================
create table public.stocks (
  ticker       text primary key,
  name         text not null,
  exchange     text not null,
  sector       text,
  industry     text,
  price        numeric(12,2),
  ytd          numeric(6,2),
  day_chg      numeric(6,2),
  market_cap_b numeric(10,2),
  pe           numeric(8,2),
  div_yield    numeric(6,3),
  w52_high     numeric(12,2),
  w52_low      numeric(12,2),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- notifications
-- ============================================================
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  payload     jsonb not null default '{}',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ============================================================
-- reports (moderation queue)
-- ============================================================
create type report_target as enum ('comment','play','user');
create type report_status as enum ('pending','dismissed','actioned_hide','actioned_strike');

create table public.reports (
  id           uuid primary key default uuid_generate_v4(),
  reporter_id  uuid not null references public.profiles(id),
  target_type  report_target not null,
  target_id    uuid not null,
  reason       text not null,
  note         text,
  status       report_status not null default 'pending',
  resolved_by  uuid references public.profiles(id),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- counter triggers — keep .subscribers / .kudos / .followers in sync
-- ============================================================
create or replace function public.bump_play_counter() returns trigger as $$
declare
  delta int;
  col   text;
begin
  if (tg_op = 'INSERT') then delta := 1;
  elsif (tg_op = 'DELETE') then delta := -1;
  else return null;
  end if;

  case tg_argv[0]
    when 'subscribers' then col := 'subscribers';
    when 'kudos'       then col := 'kudos';
    when 'followers'   then col := 'followers';
  end case;

  execute format('update public.plays set %I = greatest(0, %I + $1) where id = $2', col, col)
    using delta, coalesce(new.play_id, old.play_id);

  return null;
end;
$$ language plpgsql;

create trigger trg_sub_count
after insert or delete on public.subscriptions
for each row when (coalesce(new.status, old.status) = 'active')
execute function public.bump_play_counter('subscribers');

create trigger trg_kudos_count
after insert or delete on public.kudos
for each row execute function public.bump_play_counter('kudos');

create trigger trg_follows_count
after insert or delete on public.follows
for each row execute function public.bump_play_counter('followers');

-- updated_at trigger
create or replace function public.bump_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_plays_updated_at
before update on public.plays
for each row execute function public.bump_updated_at();
