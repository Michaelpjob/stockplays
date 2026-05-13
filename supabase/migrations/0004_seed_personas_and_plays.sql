-- Seed the six curator personas + their plays.
-- Personas are profiles without matching auth.users rows.
-- Real signups still flow through the on_auth_user_created trigger and end up
-- with profile.id == auth.users.id (so RLS policies that compare to auth.uid()
-- continue to work for real users).

-- 1. Drop the profiles.id FK to allow standalone seed profiles.
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- 2. Plays need a performance JSON blob for the windows widget.
alter table public.plays add column if not exists performance jsonb not null default '{}'::jsonb;

-- 3. Curators (six seeded personas).
insert into public.profiles (id, handle, display_name, bio, avatar, created_at, x_handle, role) values
  ('11111111-1111-1111-1111-111111111111', 'michaelpjob',  'Michael Job',  'Building Plays. Studying capital cycles, semis, energy infra.', 'MJ', '2026-01-08T00:00:00Z', '@michaelpjob', 'curator'),
  ('22222222-2222-2222-2222-222222222222', 'sarakim',      'Sara Kim',     'Power markets, IRA, grid bottlenecks. Was a sell-side utility analyst.', 'SK', '2026-02-14T00:00:00Z', null, 'curator'),
  ('33333333-3333-3333-3333-333333333333', 'kirawallace',  'Kira Wallace', 'Reshoring, machinery, infra services. CHIPS Act-aligned plays.', 'KW', '2026-02-22T00:00:00Z', null, 'curator'),
  ('44444444-4444-4444-4444-444444444444', 'danreyes',     'Dan Reyes',    'Cyber budgets, platform consolidation. ZTNA / identity.', 'DR', '2026-01-30T00:00:00Z', null, 'curator'),
  ('55555555-5555-5555-5555-555555555555', 'alexh',        'Alex Hahn',    'Defense suppliers, primes, allied spending. Ex-Lockheed.', 'AH', '2026-02-06T00:00:00Z', null, 'curator'),
  ('66666666-6666-6666-6666-666666666666', 'priyas',       'Priya Shah',   'Biotech franchises, GLP-1 supply chain, drug-class TAM.', 'PS', '2026-01-15T00:00:00Z', null, 'curator')
on conflict (id) do update set
  handle = excluded.handle,
  display_name = excluded.display_name,
  bio = excluded.bio,
  avatar = excluded.avatar,
  role = excluded.role;

-- 4. Plays — matches src/data/seedPlays.ts.
insert into public.plays
  (id, slug, name, category, author_id, thesis_short, thesis_long, benchmark, rebalance, status, subscribers, kudos, followers, created_at, updated_at, performance)
values
  ('aaaa0000-0000-0000-0000-000000000001', 'ai-compute-stack', 'AI Compute Stack', 'AI',
   '11111111-1111-1111-1111-111111111111',
   'AI demand is driving a multi-year capex cycle. Own the picks-and-shovels: accelerators, foundries, custom silicon, and memory.',
   E'The shift from training to inference is the next leg. Inference workloads scale with usage, not with one-off training runs, so they pull harder on supply of GPUs, custom ASICs, HBM, and advanced packaging. NVDA still anchors training but custom silicon — Broadcom for Google/Meta, AWS Trainium — is taking inference share.\n\nThe risk is digestion. If hyperscaler capex pauses for one cycle the stack re-rates fast. We mitigate by overweighting names whose revenue is least concentrated in any single hyperscaler.',
   'SMH / SOXX', 'Quarterly', 'approved', 2840, 795, 4544,
   '2026-04-15T00:00:00Z', '2026-05-12T00:00:00Z',
   '{"1m": 5.8, "3m": 14.2, "ytd": 28.6, "1y": 42.4, "vs_spy": 18.8}'::jsonb),

  ('aaaa0000-0000-0000-0000-000000000002', 'electrify-the-grid', 'Electrify the Grid', 'Power',
   '22222222-2222-2222-2222-222222222222',
   'Data center load + electrification creates the first sustained US power demand growth in 20 years. Own the bottlenecks: generation, transmission, and grid equipment.',
   E'EIA load forecasts have re-rated up every quarter for two years. The constraint moves from generation to interconnection to transformers, and the equipment side is gross-margin accretive in a way utilities aren''t.\n\nWe overweight unregulated gencos (VST, CEG) for the demand pull and electrical equipment (ETN, GEV) for the bottleneck. NEE is the regulated anchor.',
   'XLE / XLU', 'Quarterly', 'approved', 1640, 412, 2090,
   '2026-03-22T00:00:00Z', '2026-05-08T00:00:00Z',
   '{"1m": 4.4, "3m": 18.6, "ytd": 36.2, "1y": 52.0, "vs_spy": 26.4}'::jsonb),

  ('aaaa0000-0000-0000-0000-000000000003', 'zero-trust-2026', 'Zero Trust 2026', 'Cyber',
   '44444444-4444-4444-4444-444444444444',
   'Endpoint and identity consolidate as the platforms. SASE/ZTNA names that own the data plane win on attach rate.',
   E'Cyber budgets are growing while everything else IT is flat-to-down. The platform consolidation that''s been talked about for three years is finally showing up in renewals — fewer SKUs, bigger commitments. CRWD and PANW are the obvious anchors.',
   'HACK', 'Quarterly', 'approved', 980, 244, 1180,
   '2026-02-10T00:00:00Z', '2026-04-30T00:00:00Z',
   '{"1m": 2.1, "3m": 7.4, "ytd": 12.0, "1y": 22.6, "vs_spy": 2.2}'::jsonb),

  ('aaaa0000-0000-0000-0000-000000000004', 'glp-1-leaders', 'GLP-1 Leaders', 'Biotech',
   '66666666-6666-6666-6666-666666666666',
   'LLY and NVO own a generational drug class. Pricing pressure is real but the TAM keeps expanding faster than the discount.',
   E'Obesity is shifting from indication to chronic-care platform. New mechanisms in trial keep extending the franchise''s runway. We anchor on LLY and NVO and use REGN as a CRISPR/biologics tail option.',
   'XBI / IBB', 'Quarterly', 'approved', 720, 168, 920,
   '2026-01-18T00:00:00Z', '2026-05-04T00:00:00Z',
   '{"1m": 1.2, "3m": 4.8, "ytd": 9.4, "1y": 14.0, "vs_spy": -0.4}'::jsonb),

  ('aaaa0000-0000-0000-0000-000000000005', 'primes-and-suppliers', 'Primes and Suppliers', 'Defense',
   '55555555-5555-5555-5555-555555555555',
   'Reshored production and a flat-but-growing top-line for the primes. Suppliers (engines, electronics) get the operating leverage.',
   'Allied defense spending is structurally higher post-2022. The primes get steady revenue; suppliers like RTX get the margin lift. Weighting tilts to suppliers and away from pure primes.',
   'ITA', 'Quarterly', 'approved', 540, 108, 612,
   '2026-02-26T00:00:00Z', '2026-05-01T00:00:00Z',
   '{"1m": 1.8, "3m": 6.0, "ytd": 16.4, "1y": 24.2, "vs_spy": 6.2}'::jsonb),

  ('aaaa0000-0000-0000-0000-000000000006', 'industrial-renaissance', 'Industrial Renaissance', 'Industrial',
   '33333333-3333-3333-3333-333333333333',
   'CHIPS, IRA, and reshoring all hit at the same time. Heavy machinery and infrastructure services are the cleanest beneficiaries.',
   'PWR / CAT / DE / PH have multi-year backlogs that lock in pricing. The right way to play it is overweight services + infrastructure, underweight pure cyclical machinery.',
   'XLI', 'Quarterly', 'approved', 810, 192, 1014,
   '2026-03-04T00:00:00Z', '2026-05-06T00:00:00Z',
   '{"1m": 3.2, "3m": 10.4, "ytd": 18.2, "1y": 27.4, "vs_spy": 8.4}'::jsonb)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  category = excluded.category,
  thesis_short = excluded.thesis_short,
  thesis_long = excluded.thesis_long,
  benchmark = excluded.benchmark,
  rebalance = excluded.rebalance,
  status = excluded.status,
  subscribers = excluded.subscribers,
  kudos = excluded.kudos,
  followers = excluded.followers,
  performance = excluded.performance,
  updated_at = excluded.updated_at;

-- 5. Holdings for each play.
delete from public.play_holdings where play_id in (
  'aaaa0000-0000-0000-0000-000000000001',
  'aaaa0000-0000-0000-0000-000000000002',
  'aaaa0000-0000-0000-0000-000000000003',
  'aaaa0000-0000-0000-0000-000000000004',
  'aaaa0000-0000-0000-0000-000000000005',
  'aaaa0000-0000-0000-0000-000000000006'
);
insert into public.play_holdings (play_id, ticker, weight) values
  -- AI Compute Stack
  ('aaaa0000-0000-0000-0000-000000000001', 'NVDA',  17),
  ('aaaa0000-0000-0000-0000-000000000001', 'TSM',   14),
  ('aaaa0000-0000-0000-0000-000000000001', 'AVGO',  12),
  ('aaaa0000-0000-0000-0000-000000000001', 'AMD',   10),
  ('aaaa0000-0000-0000-0000-000000000001', 'MU',     9),
  ('aaaa0000-0000-0000-0000-000000000001', 'ARM',    8),
  ('aaaa0000-0000-0000-0000-000000000001', 'MSFT',  11),
  ('aaaa0000-0000-0000-0000-000000000001', 'GOOGL', 10),
  ('aaaa0000-0000-0000-0000-000000000001', 'META',   9),
  -- Electrify the Grid
  ('aaaa0000-0000-0000-0000-000000000002', 'VST',   18),
  ('aaaa0000-0000-0000-0000-000000000002', 'CEG',   16),
  ('aaaa0000-0000-0000-0000-000000000002', 'GEV',   16),
  ('aaaa0000-0000-0000-0000-000000000002', 'ETN',   14),
  ('aaaa0000-0000-0000-0000-000000000002', 'NEE',   14),
  ('aaaa0000-0000-0000-0000-000000000002', 'PWR',   12),
  ('aaaa0000-0000-0000-0000-000000000002', 'PH',    10),
  -- Zero Trust 2026
  ('aaaa0000-0000-0000-0000-000000000003', 'CRWD',  26),
  ('aaaa0000-0000-0000-0000-000000000003', 'PANW',  24),
  ('aaaa0000-0000-0000-0000-000000000003', 'ZS',    18),
  ('aaaa0000-0000-0000-0000-000000000003', 'NET',   16),
  ('aaaa0000-0000-0000-0000-000000000003', 'MSFT',  16),
  -- GLP-1 Leaders
  ('aaaa0000-0000-0000-0000-000000000004', 'LLY',   42),
  ('aaaa0000-0000-0000-0000-000000000004', 'NVO',   32),
  ('aaaa0000-0000-0000-0000-000000000004', 'REGN',  26),
  -- Primes and Suppliers
  ('aaaa0000-0000-0000-0000-000000000005', 'LMT',   22),
  ('aaaa0000-0000-0000-0000-000000000005', 'RTX',   26),
  ('aaaa0000-0000-0000-0000-000000000005', 'NOC',   18),
  ('aaaa0000-0000-0000-0000-000000000005', 'GD',    18),
  ('aaaa0000-0000-0000-0000-000000000005', 'ETN',   16),
  -- Industrial Renaissance
  ('aaaa0000-0000-0000-0000-000000000006', 'PWR',   26),
  ('aaaa0000-0000-0000-0000-000000000006', 'CAT',   22),
  ('aaaa0000-0000-0000-0000-000000000006', 'DE',    20),
  ('aaaa0000-0000-0000-0000-000000000006', 'PH',    18),
  ('aaaa0000-0000-0000-0000-000000000006', 'ETN',   14);

-- 6. Play updates (only the two plays that have them in the seed).
insert into public.play_updates (id, play_id, body, posted_by, posted_at) values
  ('bbbb0001-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001',
   'Quarterly review — trimming NVDA 19% → 17%, adding 2% to AVGO. Custom silicon is taking more inference share than I modeled in February.',
   '11111111-1111-1111-1111-111111111111', '2026-05-12T00:00:00Z'),
  ('bbbb0001-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000001',
   'Q1 results across the basket beat on data center revenue. Maintaining weights ahead of next earnings cycle.',
   '11111111-1111-1111-1111-111111111111', '2026-04-29T00:00:00Z'),
  ('bbbb0002-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000002',
   'VST upgraded by two sell-side after PJM auction clearing prices. Keeping at 18% — re-rating story is intact.',
   '22222222-2222-2222-2222-222222222222', '2026-05-08T00:00:00Z')
on conflict (id) do update set
  body = excluded.body,
  posted_at = excluded.posted_at;

-- 7. Discussion items (one dissertation + one comment on AI Compute Stack).
insert into public.discussion_items (id, play_id, type, author_id, title, body, pinned, upvotes, downvotes, reply_count, created_at) values
  ('cccc0001-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001',
   'dissertation', '44444444-4444-4444-4444-444444444444',
   'Reconsidering NVDA share durability',
   'NVDA at 17% assumes its inference moat holds. But the AVGO/GOOGL silicon ramp and Trainium2 data points suggest inference share could shift faster than training. Worth a 12% target with the spread reallocated to AVGO + MU.',
   true, 142, 8, 23, '2026-05-10T00:00:00Z'),
  ('cccc0001-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000001',
   'comment', '66666666-6666-6666-6666-666666666666',
   null,
   'The memory weight (MU+HBM exposure) feels light vs how tight HBM3e capacity is. Considering a 12-13% slot for MU.',
   false, 38, 2, 4, '2026-05-08T00:00:00Z')
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  upvotes = excluded.upvotes,
  downvotes = excluded.downvotes,
  pinned = excluded.pinned;

-- Counter triggers fire on subscription/kudos/follow inserts/deletes — for seed
-- rows we set the columns directly so they don't drift if no engagement events
-- ever happen.
update public.plays set
  subscribers = case id
    when 'aaaa0000-0000-0000-0000-000000000001' then 2840
    when 'aaaa0000-0000-0000-0000-000000000002' then 1640
    when 'aaaa0000-0000-0000-0000-000000000003' then 980
    when 'aaaa0000-0000-0000-0000-000000000004' then 720
    when 'aaaa0000-0000-0000-0000-000000000005' then 540
    when 'aaaa0000-0000-0000-0000-000000000006' then 810
  end
where id in (
  'aaaa0000-0000-0000-0000-000000000001',
  'aaaa0000-0000-0000-0000-000000000002',
  'aaaa0000-0000-0000-0000-000000000003',
  'aaaa0000-0000-0000-0000-000000000004',
  'aaaa0000-0000-0000-0000-000000000005',
  'aaaa0000-0000-0000-0000-000000000006'
);
