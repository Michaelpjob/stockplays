-- Plays — seed data for the stocks reference table.
-- Plays themselves are created by users; we don't seed them.

insert into public.stocks (ticker, name, exchange, sector, industry, price, ytd, day_chg, market_cap_b, pe, div_yield, w52_high, w52_low) values
  ('NVDA','NVIDIA','NASDAQ','Semiconductors','Accelerators',950, 24.3,  1.2, 2400, 35.2, 0.02, 1020, 620),
  ('TSM','Taiwan Semiconductor','NYSE','Semiconductors','Foundry',178, 19.8,  0.6,  920, 28.4, 1.5,  195, 110),
  ('AVGO','Broadcom','NASDAQ','Semiconductors','Custom Silicon',1620, 28.1, -0.3, 760, 38.9, 1.2, 1750, 1020),
  ('AMD','Advanced Micro Devices','NASDAQ','Semiconductors','CPU/GPU',162, 11.4, 0.9,  264, 92.0, 0,   220,  95),
  ('ARM','ARM Holdings','NASDAQ','Semiconductors','IP Licensing',132, 18.7, 0.4,  138, 145, 0,    188,  76),
  ('MU','Micron Technology','NASDAQ','Semiconductors','Memory',132, 22.5, 1.4,  145, 24.3, 0.5,  158,  75),
  ('MSFT','Microsoft','NASDAQ','Software','Cloud',440, 16.5, 0.7, 3270, 36.1, 0.7,  470, 320),
  ('GOOGL','Alphabet','NASDAQ','Internet','Search',178, 14.8, 0.3, 2230, 26.4, 0.45, 195, 120),
  ('META','Meta Platforms','NASDAQ','Internet','Social',510, 22.4, 1.1, 1290, 28.2, 0.4,  545, 280),
  ('NEE','NextEra Energy','NYSE','Utilities','Renewables',79, 12.4, 0.2,  160, 22.0, 2.6,  86, 55),
  ('CEG','Constellation Energy','NASDAQ','Utilities','Nuclear',235, 41.3, 1.6, 73, 32.4, 0.6,  268, 95),
  ('VST','Vistra','NYSE','Utilities','Power Gen',92, 56.0, 2.4, 32, 18.7, 0.8,  108, 32),
  ('GEV','GE Vernova','NYSE','Industrials','Power Equipment',218, 67.8, 1.8, 59, 60.0, 0.3,  240, 110),
  ('ETN','Eaton','NYSE','Industrials','Electrical',332, 18.4, 0.5, 132, 33.2, 1.1,  360, 240),
  ('CRWD','CrowdStrike','NASDAQ','Software','Endpoint',332, 22.6, -1.2, 80, 88.0, 0,   398, 200),
  ('PANW','Palo Alto Networks','NASDAQ','Software','Network Security',348, 16.2, 0.3, 112, 42.0, 0, 380, 240),
  ('ZS','Zscaler','NASDAQ','Software','ZTNA',195, 8.4, 0.8, 29, 0, 0, 245, 145),
  ('NET','Cloudflare','NYSE','Software','Edge',88, 14.6, 0.4, 30, 0, 0, 116, 60),
  ('LLY','Eli Lilly','NYSE','Pharma','Diabetes',870, 14.2, 1.0, 822, 78.0, 0.6, 970, 580),
  ('NVO','Novo Nordisk','NYSE','Pharma','Diabetes',132, 5.8, -0.4, 588, 32.0, 1.1, 148, 86),
  ('REGN','Regeneron','NASDAQ','Biotech','Drug Dev',1024, 6.4, 0.2, 108, 22.5, 0, 1212, 720),
  ('LMT','Lockheed Martin','NYSE','Aerospace & Defense','Defense Prime',552, 21.2, 0.8, 132, 21.4, 2.3, 590, 420),
  ('RTX','RTX Corp','NYSE','Aerospace & Defense','Engines',132, 18.4, 0.4, 178, 26.0, 2.1, 142, 85),
  ('NOC','Northrop Grumman','NYSE','Aerospace & Defense','Defense Prime',478, 9.4, 0.2, 70, 19.5, 1.6, 542, 420),
  ('GD','General Dynamics','NYSE','Aerospace & Defense','Marine/Land',308, 11.0, 0.1, 84, 22.3, 1.9, 322, 240),
  ('CAT','Caterpillar','NYSE','Industrials','Heavy Machinery',358, 14.2, -0.3, 178, 16.1, 1.5, 388, 252),
  ('DE','Deere','NYSE','Industrials','AgriTech',412, 8.6, 0.5, 116, 13.4, 1.4, 440, 320),
  ('PWR','Quanta Services','NYSE','Industrials','Infra Services',282, 19.7, 1.1, 41, 38.0, 0.2, 312, 168),
  ('PH','Parker Hannifin','NYSE','Industrials','Motion/Control',622, 14.4, 0.7, 80, 24.6, 1.0, 680, 470)
on conflict (ticker) do update set
  price = excluded.price,
  ytd = excluded.ytd,
  day_chg = excluded.day_chg,
  market_cap_b = excluded.market_cap_b,
  updated_at = now();
