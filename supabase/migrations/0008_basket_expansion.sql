-- Basket expansion per PLAYS_BASKET_EXPANSION_HANDOFF.md.
-- Replaces holdings + thesis for 6 plays, adds 7th (Edge AI), inserts ~60
-- new placeholder stock rows. Refresh-prices will hydrate the placeholders
-- with real Polygon data on its next run.

-- ============================================================
-- 1. New stock placeholders (refresh-prices upserts real data nightly).
--    Exchange is a best-guess; Polygon reference call overrides.
-- ============================================================
insert into public.stocks (ticker, name, exchange) values
  -- AI Compute Stack additions
  ('ASML','ASML Holding','NASDAQ'),
  ('ANET','Arista Networks','NYSE'),
  ('MRVL','Marvell Technology','NASDAQ'),
  ('COHR','Coherent','NYSE'),
  ('KLAC','KLA Corporation','NASDAQ'),
  ('LRCX','Lam Research','NASDAQ'),
  ('APH','Amphenol','NYSE'),
  ('WDC','Western Digital','NASDAQ'),
  ('AMAT','Applied Materials','NASDAQ'),
  -- Electrify the Grid additions
  ('VRT','Vertiv Holdings','NYSE'),
  ('BE','Bloom Energy','NYSE'),
  ('ITRI','Itron','NASDAQ'),
  ('WOLF','Wolfspeed','NYSE'),
  ('ATKR','Atkore','NYSE'),
  ('TTEK','Tetra Tech','NASDAQ'),
  ('BW','Babcock & Wilcox','NYSE'),
  ('GNRC','Generac Holdings','NYSE'),
  ('HUBB','Hubbell','NYSE'),
  ('CMI','Cummins','NYSE'),
  -- Zero Trust additions
  ('FTNT','Fortinet','NASDAQ'),
  ('CHKP','Check Point Software','NASDAQ'),
  ('OKTA','Okta','NASDAQ'),
  ('TENB','Tenable Holdings','NASDAQ'),
  ('RBRK','Rubrik','NYSE'),
  ('S','SentinelOne','NYSE'),
  ('AKAM','Akamai Technologies','NASDAQ'),
  ('QLYS','Qualys','NASDAQ'),
  -- GLP-1 additions
  ('AMGN','Amgen','NASDAQ'),
  ('AZN','AstraZeneca','NASDAQ'),
  ('TMO','Thermo Fisher Scientific','NYSE'),
  ('DHR','Danaher','NYSE'),
  ('WST','West Pharmaceutical Services','NYSE'),
  ('BDX','Becton Dickinson','NYSE'),
  ('DXCM','DexCom','NASDAQ'),
  ('ABBV','AbbVie','NYSE'),
  ('RHHBY','Roche Holding ADR','OTC'),
  ('VKTX','Viking Therapeutics','NASDAQ'),
  -- Primes & Suppliers additions
  ('PLTR','Palantir Technologies','NYSE'),
  ('LHX','L3Harris Technologies','NYSE'),
  ('BWXT','BWX Technologies','NYSE'),
  ('HII','Huntington Ingalls Industries','NYSE'),
  ('AVAV','AeroVironment','NASDAQ'),
  ('KTOS','Kratos Defense','NASDAQ'),
  ('TXT','Textron','NYSE'),
  ('LDOS','Leidos Holdings','NYSE'),
  -- Industrial Renaissance / Robotics additions
  ('ISRG','Intuitive Surgical','NASDAQ'),
  ('ROK','Rockwell Automation','NYSE'),
  ('ABB','ABB Ltd ADR','NYSE'),
  ('HON','Honeywell','NASDAQ'),
  ('EMR','Emerson Electric','NYSE'),
  ('TER','Teradyne','NASDAQ'),
  ('FTV','Fortive','NYSE'),
  ('CGNX','Cognex','NASDAQ'),
  ('HTHIY','Hitachi ADR','OTC'),
  ('SIEGY','Siemens ADR','OTC'),
  ('MBLY','Mobileye Global','NASDAQ'),
  ('SYM','Symbotic','NASDAQ'),
  ('AMBA','Ambarella','NASDAQ'),
  -- Edge AI additions
  ('AAPL','Apple','NASDAQ'),
  ('QCOM','Qualcomm','NASDAQ'),
  ('NXPI','NXP Semiconductors','NASDAQ'),
  -- Benchmark ETFs (needed by refresh-prices for vs-benchmark math)
  ('BBH','VanEck Biotech ETF','NASDAQ'),
  ('BOTZ','Global X Robotics ETF','NASDAQ'),
  ('SOXX','iShares Semiconductor ETF','NASDAQ'),
  ('QQQ','Invesco QQQ Trust','NASDAQ'),
  ('CIBR','First Trust Cybersecurity ETF','NASDAQ'),
  ('XLU','Utilities Select Sector SPDR','NYSE')
on conflict (ticker) do nothing;

-- ============================================================
-- 2. Update theses + benchmarks on the 6 existing plays.
-- ============================================================
update public.plays set
  thesis_short = 'AI demand drives a multi-year capex cycle benefitting the entire silicon supply chain — foundry, lithography, memory, networking, custom silicon, optics, packaging, storage. The picks-and-shovels exposure is broader than NVDA + TSM.',
  thesis_long = E'AI compute spending compounds across the entire stack. Accelerators (NVDA, AMD) capture training; custom silicon (AVGO, MRVL) takes inference share; foundries (TSM) and lithography (ASML) gate every advanced node; memory (MU) is supply-constrained on HBM through 2027; networking (ANET) carries east-west traffic; optical interconnects (COHR) absorb 800G/1.6T demand; process equipment (KLAC, LRCX, AMAT) extracts pricing power on every wafer. Storage (WDC) and connectivity (APH) round out the picks-and-shovels exposure.\n\nRisk: hyperscaler capex digestion. We mitigate by spreading exposure beyond the accelerators most concentrated in single-customer revenue.',
  benchmark = 'SMH / SOXX'
where slug = 'ai-compute-stack';

update public.plays set
  thesis_short = 'AI data centers turn electricity, grid equipment, thermal management, and generation reliability into first-order bottlenecks. Own the full chain: generation, transmission, cooling, smart-grid, SiC power semis, backup power.',
  thesis_long = E'EIA load forecasts have re-rated up every quarter for two years. Transformer lead times stretched to 3-4 years; interconnection queues at 2,600 GW in the US alone; copper demand projected +50% by 2040.\n\nThe basket spans the full chain — unregulated gencos (VST, CEG) for demand pull; equipment (ETN, GEV, VRT, HUBB, CMI) for bottlenecks; regulated anchors (NEE); SiC power semis (WOLF) for efficiency; fuel cells (BE) for distributed power; smart meters (ITRI) for grid IoT; conduit (ATKR); engineering services (TTEK); boilers (BW); and Generac backup gensets (GNRC) for AI DC reliability.',
  benchmark = 'XLU / GRID'
where slug = 'electrify-the-grid';

update public.plays set
  thesis_short = 'AI expands attack surface and attack speed. Cybersecurity demand is structural; platform consolidation favors the broadest stacks. Own endpoint, identity, network, exposure, and recovery layers.',
  thesis_long = E'Gartner forecast $212B in 2025 end-user security spending. The platform consolidation that''s been talked about for three years is finally showing up in renewals — fewer SKUs, bigger commitments. CRWD and PANW anchor; FTNT brings secure networking + strong margins; ZS owns SASE; CHKP is the value-platform play. NET (Cloudflare) holds the connectivity cloud; OKTA owns identity for human and AI agents; TENB does exposure management; S (SentinelOne) is AI-native autonomous security; AKAM owns edge + WAF; QLYS continues vulnerability management; RBRK provides cyber resilience and recovery.',
  benchmark = 'CIBR / HACK'
where slug = 'zero-trust-2026';

update public.plays set
  name = 'GLP-1 and Metabolic Health',
  thesis_short = 'Obesity therapy has become a durable platform. Drugs, delivery devices, manufacturing infra, and metabolic-care monitoring all participate.',
  thesis_long = E'LLY and NVO own a generational drug class; the franchise extends into cardiometabolic and chronic-care indications. Pipeline optionality comes from AMGN (MariTide Phase 3), AZN (cardiometabolic), and VKTX (speculative satellite — VK2735 Phase 3).\n\nThe picks-and-shovels layer is real: TMO and DHR for bioprocessing and life-science tools; WST and BDX for self-injection devices; DXCM for CGM + Type 2 expansion; ABBV for adjacent metabolic immunology pipeline; RHHBY for Roche metabolic optionality (ADR — flagged).',
  benchmark = 'BBH / XLV'
where slug = 'glp-1-leaders';

update public.plays set
  thesis_short = 'Defense upcycle includes drones, missile defense, software, ISR, and sovereign industrial capacity — not only traditional primes. Allied spending is structurally higher post-2022.',
  thesis_long = E'SIPRI: $2.887T global military spending in 2025. NATO European Allies +20% real-terms in 2025. The basket covers traditional primes (LMT, RTX, NOC, GD) and the autonomy + software layers the legacy primes do not own.\n\nPLTR holds defense AI software (NATO Maven, Army agreement). LHX brings comms + ISR + munitions capacity. BWXT serves naval nuclear and the strategic industrial base. HII handles naval shipbuilding and unmanned undersea. AVAV and KTOS provide drones, loitering munitions, autonomous systems. TXT (Bell helicopters + Shadow drones) and LDOS (defense IT + AI services) close the gaps.',
  benchmark = 'ITA / PPA'
where slug = 'primes-and-suppliers';

update public.plays set
  thesis_short = 'AI is migrating into physical systems — surgical robotics, machine vision, warehouse automation, industrial control, sensing, autonomy. Own the platforms that connect AI to atoms.',
  thesis_long = E'IFR reports 542K industrial robots installed in 2024, more than double a decade earlier. Hitachi Industrial AI segment grew 54% YoY. Siemens is Europe''s top AI/ML patent filer.\n\nISRG leads surgical robotics. ROK, ABB, HON, and EMR own factory automation and controls. TER spans robotics and semiconductor test; FTV and CGNX cover sensing and machine vision. HTHIY (Hitachi) and SIEGY (Siemens) provide global incumbents with massive scale. MBLY and AMBA bring vision AI silicon for ADAS and embedded systems. SYM (Symbotic) is the AI warehouse automation pure-play.',
  benchmark = 'BOTZ / ROBO'
where slug = 'industrial-renaissance';

-- ============================================================
-- 3. Replace all play_holdings for the 6 plays.
-- ============================================================
delete from public.play_holdings where play_id in (
  'aaaa0000-0000-0000-0000-000000000001',
  'aaaa0000-0000-0000-0000-000000000002',
  'aaaa0000-0000-0000-0000-000000000003',
  'aaaa0000-0000-0000-0000-000000000004',
  'aaaa0000-0000-0000-0000-000000000005',
  'aaaa0000-0000-0000-0000-000000000006'
);

insert into public.play_holdings (play_id, ticker, weight) values
  -- 1. AI Compute Stack (15 holdings — note doc lists 14 weights but table has 15 incl AMAT)
  ('aaaa0000-0000-0000-0000-000000000001', 'NVDA', 14),
  ('aaaa0000-0000-0000-0000-000000000001', 'TSM',  12),
  ('aaaa0000-0000-0000-0000-000000000001', 'AVGO', 11),
  ('aaaa0000-0000-0000-0000-000000000001', 'AMD',   8),
  ('aaaa0000-0000-0000-0000-000000000001', 'MU',    8),
  ('aaaa0000-0000-0000-0000-000000000001', 'ASML',  7),
  ('aaaa0000-0000-0000-0000-000000000001', 'ANET',  6),
  ('aaaa0000-0000-0000-0000-000000000001', 'ARM',   5),
  ('aaaa0000-0000-0000-0000-000000000001', 'MRVL',  5),
  ('aaaa0000-0000-0000-0000-000000000001', 'COHR',  5),
  ('aaaa0000-0000-0000-0000-000000000001', 'KLAC',  4),
  ('aaaa0000-0000-0000-0000-000000000001', 'LRCX',  4),
  ('aaaa0000-0000-0000-0000-000000000001', 'APH',   4),
  ('aaaa0000-0000-0000-0000-000000000001', 'WDC',   4),
  ('aaaa0000-0000-0000-0000-000000000001', 'AMAT',  3),

  -- 2. Electrify the Grid (15 holdings)
  ('aaaa0000-0000-0000-0000-000000000002', 'ETN',  11),
  ('aaaa0000-0000-0000-0000-000000000002', 'VRT',  11),
  ('aaaa0000-0000-0000-0000-000000000002', 'GEV',  10),
  ('aaaa0000-0000-0000-0000-000000000002', 'CEG',   9),
  ('aaaa0000-0000-0000-0000-000000000002', 'NEE',   8),
  ('aaaa0000-0000-0000-0000-000000000002', 'VST',   7),
  ('aaaa0000-0000-0000-0000-000000000002', 'BE',    6),
  ('aaaa0000-0000-0000-0000-000000000002', 'ITRI',  6),
  ('aaaa0000-0000-0000-0000-000000000002', 'WOLF',  5),
  ('aaaa0000-0000-0000-0000-000000000002', 'ATKR',  5),
  ('aaaa0000-0000-0000-0000-000000000002', 'TTEK',  4),
  ('aaaa0000-0000-0000-0000-000000000002', 'BW',    4),
  ('aaaa0000-0000-0000-0000-000000000002', 'GNRC',  4),
  ('aaaa0000-0000-0000-0000-000000000002', 'HUBB',  5),
  ('aaaa0000-0000-0000-0000-000000000002', 'CMI',   5),

  -- 3. Zero Trust 2026 (12 holdings)
  ('aaaa0000-0000-0000-0000-000000000003', 'CRWD', 14),
  ('aaaa0000-0000-0000-0000-000000000003', 'PANW', 13),
  ('aaaa0000-0000-0000-0000-000000000003', 'FTNT', 11),
  ('aaaa0000-0000-0000-0000-000000000003', 'ZS',   10),
  ('aaaa0000-0000-0000-0000-000000000003', 'CHKP',  8),
  ('aaaa0000-0000-0000-0000-000000000003', 'NET',   8),
  ('aaaa0000-0000-0000-0000-000000000003', 'OKTA',  8),
  ('aaaa0000-0000-0000-0000-000000000003', 'TENB',  6),
  ('aaaa0000-0000-0000-0000-000000000003', 'RBRK',  6),
  ('aaaa0000-0000-0000-0000-000000000003', 'S',     5),
  ('aaaa0000-0000-0000-0000-000000000003', 'AKAM',  6),
  ('aaaa0000-0000-0000-0000-000000000003', 'QLYS',  5),

  -- 4. GLP-1 and Metabolic Health (12 holdings)
  ('aaaa0000-0000-0000-0000-000000000004', 'LLY',  18),
  ('aaaa0000-0000-0000-0000-000000000004', 'NVO',  15),
  ('aaaa0000-0000-0000-0000-000000000004', 'AMGN', 10),
  ('aaaa0000-0000-0000-0000-000000000004', 'AZN',   8),
  ('aaaa0000-0000-0000-0000-000000000004', 'TMO',   8),
  ('aaaa0000-0000-0000-0000-000000000004', 'DHR',   7),
  ('aaaa0000-0000-0000-0000-000000000004', 'WST',   7),
  ('aaaa0000-0000-0000-0000-000000000004', 'BDX',   6),
  ('aaaa0000-0000-0000-0000-000000000004', 'DXCM',  6),
  ('aaaa0000-0000-0000-0000-000000000004', 'ABBV',  5),
  ('aaaa0000-0000-0000-0000-000000000004', 'RHHBY', 5),
  ('aaaa0000-0000-0000-0000-000000000004', 'VKTX',  5),

  -- 5. Primes and Suppliers (12 holdings)
  ('aaaa0000-0000-0000-0000-000000000005', 'LMT',  13),
  ('aaaa0000-0000-0000-0000-000000000005', 'RTX',  12),
  ('aaaa0000-0000-0000-0000-000000000005', 'NOC',  11),
  ('aaaa0000-0000-0000-0000-000000000005', 'GD',   10),
  ('aaaa0000-0000-0000-0000-000000000005', 'PLTR', 10),
  ('aaaa0000-0000-0000-0000-000000000005', 'LHX',   9),
  ('aaaa0000-0000-0000-0000-000000000005', 'BWXT',  7),
  ('aaaa0000-0000-0000-0000-000000000005', 'HII',   7),
  ('aaaa0000-0000-0000-0000-000000000005', 'AVAV',  6),
  ('aaaa0000-0000-0000-0000-000000000005', 'KTOS',  5),
  ('aaaa0000-0000-0000-0000-000000000005', 'TXT',   5),
  ('aaaa0000-0000-0000-0000-000000000005', 'LDOS',  5),

  -- 6. Industrial Renaissance (13 holdings)
  ('aaaa0000-0000-0000-0000-000000000006', 'ISRG', 12),
  ('aaaa0000-0000-0000-0000-000000000006', 'ROK',  10),
  ('aaaa0000-0000-0000-0000-000000000006', 'ABB',  10),
  ('aaaa0000-0000-0000-0000-000000000006', 'HON',   9),
  ('aaaa0000-0000-0000-0000-000000000006', 'EMR',   8),
  ('aaaa0000-0000-0000-0000-000000000006', 'TER',   8),
  ('aaaa0000-0000-0000-0000-000000000006', 'FTV',   7),
  ('aaaa0000-0000-0000-0000-000000000006', 'CGNX',  7),
  ('aaaa0000-0000-0000-0000-000000000006', 'HTHIY', 7),
  ('aaaa0000-0000-0000-0000-000000000006', 'SIEGY', 6),
  ('aaaa0000-0000-0000-0000-000000000006', 'MBLY',  5),
  ('aaaa0000-0000-0000-0000-000000000006', 'SYM',   5),
  ('aaaa0000-0000-0000-0000-000000000006', 'AMBA',  6);

-- ============================================================
-- 4. New 7th play: Edge AI: On-Device Inference.
-- ============================================================
insert into public.plays
  (id, slug, name, category, author_id, thesis_short, thesis_long, benchmark, rebalance, status, subscribers, kudos, followers, created_at, updated_at, performance)
values
  ('aaaa0000-0000-0000-0000-000000000007', 'edge-ai', 'Edge AI: On-Device Inference', 'AI',
   'e0e0e0e0-0000-0000-0000-000000000000',
   'AI is migrating from the cloud to the device. Smartphones, PCs, AR glasses, robots, autonomous vehicles all become inference endpoints. Own the device + OS + silicon stack.',
   E'Edge AI market projected $8.7B (2024) → $56.8B (2030), CAGR ~37%. Workloads that demand low latency, privacy, or offline operation move local — even Apple''s stack splits work between on-device inference and Private Cloud Compute. The companies that own the vertical stack capture the most value.\n\nAAPL holds the gold standard: chip + OS + app store + Apple Intelligence privacy moat. QCOM dominates Android edge silicon (Snapdragon NPUs 35-60+ TOPS). GOOGL holds Pixel Tensor + Android NPUs + Gemini local. NVDA''s Jetson and Drive Orin own robotics + automotive edge. ARM''s architecture IP covers ~99% of smartphone CPUs. MSFT''s Copilot+ PCs require NPUs in hardware. AVGO and ASML enable every advanced edge node. AMBA, MBLY, and NXPI bring vision SoCs, ADAS silicon, and automotive/industrial edge MCUs. META''s AR/VR (Quest, Aria) is the optionality bet on glasses.\n\nOverlap with AI Compute Stack is intentional — same silicon, different thesis (cloud silicon vs edge silicon).',
   'SOXX / QQQ', 'Quarterly', 'approved', 0, 0, 0,
   now(), now(),
   '{}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  thesis_short = excluded.thesis_short,
  thesis_long = excluded.thesis_long,
  benchmark = excluded.benchmark;

-- Edge AI holdings (13)
delete from public.play_holdings where play_id = 'aaaa0000-0000-0000-0000-000000000007';
insert into public.play_holdings (play_id, ticker, weight) values
  ('aaaa0000-0000-0000-0000-000000000007', 'AAPL',  16),
  ('aaaa0000-0000-0000-0000-000000000007', 'QCOM',  12),
  ('aaaa0000-0000-0000-0000-000000000007', 'GOOGL', 10),
  ('aaaa0000-0000-0000-0000-000000000007', 'NVDA',   8),
  ('aaaa0000-0000-0000-0000-000000000007', 'TSM',    8),
  ('aaaa0000-0000-0000-0000-000000000007', 'ARM',    8),
  ('aaaa0000-0000-0000-0000-000000000007', 'MSFT',   7),
  ('aaaa0000-0000-0000-0000-000000000007', 'AVGO',   6),
  ('aaaa0000-0000-0000-0000-000000000007', 'ASML',   6),
  ('aaaa0000-0000-0000-0000-000000000007', 'AMBA',   5),
  ('aaaa0000-0000-0000-0000-000000000007', 'MBLY',   5),
  ('aaaa0000-0000-0000-0000-000000000007', 'NXPI',   5),
  ('aaaa0000-0000-0000-0000-000000000007', 'META',   4);

-- ============================================================
-- 5. Add play_update rebalance notes so the rebalance shows in the feed.
-- ============================================================
delete from public.play_updates where id::text like 'cccc0009%';
insert into public.play_updates (id, play_id, body, posted_by, posted_at) values
  ('cccc0009-0001-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001',
   'Major rebalance — expanded to 15 holdings to capture the full silicon supply chain: added ASML (lithography), ANET (AI Ethernet), MRVL/COHR (custom silicon + optics), KLAC/LRCX/AMAT (process equipment), APH (connectivity), WDC (storage). Trimmed accelerator concentration: NVDA 17%→14%, AVGO 12%→11%.',
   '11111111-1111-1111-1111-111111111111', now()),
  ('cccc0009-0002-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000002',
   'Major rebalance — expanded to 15 holdings. Added VRT (44% Q1 organic in Americas), BE (Oracle AI DC deal), ITRI (smart meters, $4.7B backlog), WOLF (SiC power semis), ATKR (conduit), TTEK, BW ($2.4B backlog from AI DC gas-fired contract), GNRC (replacing PSIX — micro-cap floor), HUBB, CMI.',
   'e0e0e0e0-0000-0000-0000-000000000000', now()),
  ('cccc0009-0003-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000003',
   'Major rebalance — expanded to 12 holdings. Added FTNT, CHKP, OKTA (identity for AI agents), TENB (exposure mgmt), RBRK (cyber recovery), S (AI-native autonomous), AKAM (edge + WAF), QLYS. Benchmark switched to CIBR/HACK for purer cyber exposure.',
   'e0e0e0e0-0000-0000-0000-000000000000', now()),
  ('cccc0009-0004-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000004',
   'Renamed to "GLP-1 and Metabolic Health". Expanded to 12 holdings including AMGN (MariTide Phase 3), AZN, TMO/DHR (bioprocessing), WST/BDX (delivery devices), DXCM (CGM), ABBV, RHHBY, VKTX (Phase 3 satellite). Removed REGN (not in source research).',
   'e0e0e0e0-0000-0000-0000-000000000000', now()),
  ('cccc0009-0005-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000005',
   'Major rebalance — expanded to 12 holdings. Added PLTR (NATO Maven), LHX, BWXT (naval nuclear), HII (shipbuilding + unmanned undersea), AVAV/KTOS (drones + autonomy), TXT, LDOS (defense IT).',
   'e0e0e0e0-0000-0000-0000-000000000000', now()),
  ('cccc0009-0006-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000006',
   'Major rebalance — expanded to 13 holdings, repositioned around robotics + embodied AI. ISRG (surgical robotics), ROK/ABB/HON/EMR (industrial automation), TER (robotics + test), FTV/CGNX (sensing + vision), HTHIY/SIEGY (global incumbents), MBLY/AMBA (vision silicon), SYM (warehouse). Benchmark switched to BOTZ/ROBO.',
   'e0e0e0e0-0000-0000-0000-000000000000', now()),
  ('cccc0009-0007-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000007',
   'Initial publication. Edge AI is the on-device inference thesis — distinct from cloud-side AI Compute Stack. Overlap with NVDA/TSM/ARM/AVGO/ASML is intentional (different weights, different role).',
   'e0e0e0e0-0000-0000-0000-000000000000', now())
on conflict (id) do nothing;
