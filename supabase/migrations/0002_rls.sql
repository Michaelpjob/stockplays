-- Plays — Row-Level Security policies
-- Default deny everything, then explicit grants per surface.

alter table public.profiles                enable row level security;
alter table public.plays                   enable row level security;
alter table public.play_holdings           enable row level security;
alter table public.play_holdings_history   enable row level security;
alter table public.play_updates            enable row level security;
alter table public.subscriptions           enable row level security;
alter table public.kudos                   enable row level security;
alter table public.follows                 enable row level security;
alter table public.saves                   enable row level security;
alter table public.user_follows            enable row level security;
alter table public.discussion_items        enable row level security;
alter table public.comment_votes           enable row level security;
alter table public.stocks                  enable row level security;
alter table public.notifications           enable row level security;
alter table public.reports                 enable row level security;

-- ============================================================
-- profiles: public read; owner-only write
-- ============================================================
create policy "profiles readable" on public.profiles
  for select using (true);

create policy "profile self-update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- plays: published are public; drafts visible to owner;
-- writes restricted to author (and reviewers for approval)
-- ============================================================
create policy "approved plays readable" on public.plays
  for select using (status in ('approved','unpublished') or author_id = auth.uid());

create policy "draft plays owner-only" on public.plays
  for select using (status in ('draft','submitted','in_review','revisions_requested','rejected')
                     and author_id = auth.uid());

create policy "play insert by author" on public.plays
  for insert with check (auth.uid() = author_id);

create policy "play update by author when draft/revisions" on public.plays
  for update using (
    auth.uid() = author_id
    and status in ('draft','revisions_requested','approved','unpublished')
  ) with check (auth.uid() = author_id);

create policy "play status by reviewer" on public.plays
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('reviewer','admin'))
  );

-- ============================================================
-- play_holdings: visible iff parent play is visible
-- ============================================================
create policy "holdings readable with play" on public.play_holdings
  for select using (
    exists (
      select 1 from public.plays p
      where p.id = play_holdings.play_id
        and (p.status in ('approved','unpublished') or p.author_id = auth.uid())
    )
  );

create policy "holdings write by author" on public.play_holdings
  for all using (
    exists (
      select 1 from public.plays p
      where p.id = play_holdings.play_id and p.author_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.plays p
      where p.id = play_holdings.play_id and p.author_id = auth.uid()
    )
  );

create policy "holdings history readable with play" on public.play_holdings_history
  for select using (
    exists (
      select 1 from public.plays p
      where p.id = play_holdings_history.play_id
        and p.status in ('approved','unpublished')
    )
  );

-- ============================================================
-- play_updates: same visibility as parent
-- ============================================================
create policy "play updates readable" on public.play_updates
  for select using (
    exists (
      select 1 from public.plays p
      where p.id = play_updates.play_id and p.status in ('approved','unpublished')
    )
  );

create policy "play updates write by author" on public.play_updates
  for insert with check (
    posted_by = auth.uid()
    and exists (
      select 1 from public.plays p
      where p.id = play_updates.play_id and p.author_id = auth.uid()
    )
  );

-- ============================================================
-- subscriptions: each user reads/writes their own
-- ============================================================
create policy "subs self read" on public.subscriptions
  for select using (auth.uid() = user_id);
create policy "subs self insert" on public.subscriptions
  for insert with check (auth.uid() = user_id);
create policy "subs self update" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- engagement: each user reads/writes their own row
-- ============================================================
create policy "kudos self" on public.kudos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "follows self" on public.follows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saves self" on public.saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_follows self" on public.user_follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- ============================================================
-- discussion: visible items public; author writes own
-- ============================================================
create policy "discussion readable" on public.discussion_items
  for select using (visibility = 'visible' or author_id = auth.uid());

create policy "discussion insert by author" on public.discussion_items
  for insert with check (auth.uid() = author_id);

create policy "discussion update self" on public.discussion_items
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "discussion hide by curator" on public.discussion_items
  for update using (
    exists (
      select 1 from public.plays p
      where p.id = discussion_items.play_id and p.author_id = auth.uid()
    )
  );

-- comment votes
create policy "comment_votes self" on public.comment_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- stocks: public read, write only by service role
-- ============================================================
create policy "stocks public read" on public.stocks for select using (true);

-- ============================================================
-- notifications: self-only
-- ============================================================
create policy "notif self read" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notif self update" on public.notifications
  for update using (auth.uid() = user_id);

-- ============================================================
-- reports: reporter self; reviewers can list/update
-- ============================================================
create policy "reports self insert" on public.reports
  for insert with check (auth.uid() = reporter_id);
create policy "reports self read" on public.reports
  for select using (auth.uid() = reporter_id);
create policy "reports admin all" on public.reports
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('reviewer','admin'))
  );
