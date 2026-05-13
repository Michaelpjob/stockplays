-- Replace 5 persona curators with a single "Plays Editorial" pseudo-profile.
-- This avoids attributing plays to people who didn't consent.
-- Michael Job stays attributed to AI Compute Stack — he's a real person.

-- 1. Editorial pseudo-profile.
insert into public.profiles (id, handle, display_name, bio, avatar, created_at, role) values
  ('e0e0e0e0-0000-0000-0000-000000000000', 'editorial', 'Plays Editorial',
   'Curated theses from the Plays editorial team. These plays are written and maintained by the platform.',
   'PE', '2026-01-01T00:00:00Z', 'curator')
on conflict (id) do update set
  handle = excluded.handle,
  display_name = excluded.display_name,
  bio = excluded.bio,
  avatar = excluded.avatar,
  role = excluded.role;

-- 2. Reparent every non-Michael play to editorial.
update public.plays
set author_id = 'e0e0e0e0-0000-0000-0000-000000000000'
where author_id <> '11111111-1111-1111-1111-111111111111';

-- 3. Reparent updates posted by personas.
update public.play_updates
set posted_by = 'e0e0e0e0-0000-0000-0000-000000000000'
where posted_by <> '11111111-1111-1111-1111-111111111111';

-- 4. Drop seeded discussion items (clean slate; real comments will replace).
delete from public.discussion_items
where id in (
  'cccc0001-0000-0000-0000-000000000001',
  'cccc0001-0000-0000-0000-000000000002'
);

-- 5. Drop the 5 persona profiles now that nothing references them.
delete from public.profiles
where id in (
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);
