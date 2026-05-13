import type { Stock } from '../lib/types';

export const STOCK_UNIVERSE: Record<string, Stock> = {
  NVDA: { ticker: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ', sector: 'Semiconductors', industry: 'Accelerators', price: 950, ytd: 24.3, dayChg: 1.2, marketCap: 2400, pe: 35.2, divYield: 0.02, w52H: 1020, w52L: 620 },
  TSM:  { ticker: 'TSM',  name: 'Taiwan Semiconductor', exchange: 'NYSE',   sector: 'Semiconductors', industry: 'Foundry',     price: 178, ytd: 19.8, dayChg: 0.6,  marketCap: 920,  pe: 28.4, divYield: 1.5,  w52H: 195,  w52L: 110 },
  AVGO: { ticker: 'AVGO', name: 'Broadcom',         exchange: 'NASDAQ', sector: 'Semiconductors', industry: 'Custom Silicon', price: 1620, ytd: 28.1, dayChg: -0.3, marketCap: 760, pe: 38.9, divYield: 1.2, w52H: 1750, w52L: 1020 },
  AMD:  { ticker: 'AMD',  name: 'Advanced Micro Devices', exchange: 'NASDAQ', sector: 'Semiconductors', industry: 'CPU/GPU', price: 162, ytd: 11.4, dayChg: 0.9, marketCap: 264, pe: 92.0, divYield: 0, w52H: 220, w52L: 95 },
  ARM:  { ticker: 'ARM',  name: 'ARM Holdings',     exchange: 'NASDAQ', sector: 'Semiconductors', industry: 'IP Licensing', price: 132, ytd: 18.7, dayChg: 0.4, marketCap: 138, pe: 145, divYield: 0, w52H: 188, w52L: 76 },
  MU:   { ticker: 'MU',   name: 'Micron Technology', exchange: 'NASDAQ', sector: 'Semiconductors', industry: 'Memory', price: 132, ytd: 22.5, dayChg: 1.4, marketCap: 145, pe: 24.3, divYield: 0.5, w52H: 158, w52L: 75 },

  MSFT: { ticker: 'MSFT', name: 'Microsoft',         exchange: 'NASDAQ', sector: 'Software',       industry: 'Cloud',  price: 440, ytd: 16.5, dayChg: 0.7,  marketCap: 3270, pe: 36.1, divYield: 0.7, w52H: 470, w52L: 320 },
  GOOGL: { ticker: 'GOOGL', name: 'Alphabet',        exchange: 'NASDAQ', sector: 'Internet',       industry: 'Search', price: 178, ytd: 14.8, dayChg: 0.3,  marketCap: 2230, pe: 26.4, divYield: 0.45, w52H: 195, w52L: 120 },
  META: { ticker: 'META', name: 'Meta Platforms',    exchange: 'NASDAQ', sector: 'Internet',       industry: 'Social',  price: 510, ytd: 22.4, dayChg: 1.1, marketCap: 1290, pe: 28.2, divYield: 0.4, w52H: 545, w52L: 280 },

  NEE:  { ticker: 'NEE',  name: 'NextEra Energy',    exchange: 'NYSE',   sector: 'Utilities',      industry: 'Renewables', price: 79, ytd: 12.4, dayChg: 0.2, marketCap: 160, pe: 22.0, divYield: 2.6, w52H: 86, w52L: 55 },
  CEG:  { ticker: 'CEG',  name: 'Constellation Energy', exchange: 'NASDAQ', sector: 'Utilities', industry: 'Nuclear', price: 235, ytd: 41.3, dayChg: 1.6, marketCap: 73,  pe: 32.4, divYield: 0.6, w52H: 268, w52L: 95 },
  VST:  { ticker: 'VST',  name: 'Vistra',            exchange: 'NYSE',   sector: 'Utilities',      industry: 'Power Gen',  price: 92, ytd: 56.0, dayChg: 2.4, marketCap: 32, pe: 18.7, divYield: 0.8, w52H: 108, w52L: 32 },
  GEV:  { ticker: 'GEV',  name: 'GE Vernova',         exchange: 'NYSE',   sector: 'Industrials',    industry: 'Power Equipment', price: 218, ytd: 67.8, dayChg: 1.8, marketCap: 59, pe: 60.0, divYield: 0.3, w52H: 240, w52L: 110 },
  ETN:  { ticker: 'ETN',  name: 'Eaton',             exchange: 'NYSE',   sector: 'Industrials',    industry: 'Electrical', price: 332, ytd: 18.4, dayChg: 0.5, marketCap: 132, pe: 33.2, divYield: 1.1, w52H: 360, w52L: 240 },

  CRWD: { ticker: 'CRWD', name: 'CrowdStrike',       exchange: 'NASDAQ', sector: 'Software', industry: 'Endpoint', price: 332, ytd: 22.6, dayChg: -1.2, marketCap: 80, pe: 88.0, divYield: 0, w52H: 398, w52L: 200 },
  PANW: { ticker: 'PANW', name: 'Palo Alto Networks', exchange: 'NASDAQ', sector: 'Software', industry: 'Network Security', price: 348, ytd: 16.2, dayChg: 0.3, marketCap: 112, pe: 42.0, divYield: 0, w52H: 380, w52L: 240 },
  ZS:   { ticker: 'ZS',   name: 'Zscaler',           exchange: 'NASDAQ', sector: 'Software', industry: 'ZTNA', price: 195, ytd: 8.4, dayChg: 0.8, marketCap: 29, pe: 0, divYield: 0, w52H: 245, w52L: 145 },
  NET:  { ticker: 'NET',  name: 'Cloudflare',        exchange: 'NYSE',  sector: 'Software', industry: 'Edge', price: 88, ytd: 14.6, dayChg: 0.4, marketCap: 30, pe: 0, divYield: 0, w52H: 116, w52L: 60 },

  LLY:  { ticker: 'LLY',  name: 'Eli Lilly',         exchange: 'NYSE',  sector: 'Pharma',    industry: 'Diabetes', price: 870, ytd: 14.2, dayChg: 1.0, marketCap: 822, pe: 78.0, divYield: 0.6, w52H: 970, w52L: 580 },
  NVO:  { ticker: 'NVO',  name: 'Novo Nordisk',      exchange: 'NYSE',  sector: 'Pharma',    industry: 'Diabetes', price: 132, ytd: 5.8, dayChg: -0.4, marketCap: 588, pe: 32.0, divYield: 1.1, w52H: 148, w52L: 86 },
  REGN: { ticker: 'REGN', name: 'Regeneron',         exchange: 'NASDAQ', sector: 'Biotech',  industry: 'Drug Dev', price: 1024, ytd: 6.4, dayChg: 0.2, marketCap: 108, pe: 22.5, divYield: 0, w52H: 1212, w52L: 720 },

  LMT:  { ticker: 'LMT',  name: 'Lockheed Martin',   exchange: 'NYSE',  sector: 'Aerospace & Defense', industry: 'Defense Prime', price: 552, ytd: 21.2, dayChg: 0.8, marketCap: 132, pe: 21.4, divYield: 2.3, w52H: 590, w52L: 420 },
  RTX:  { ticker: 'RTX',  name: 'RTX Corp',          exchange: 'NYSE',  sector: 'Aerospace & Defense', industry: 'Engines', price: 132, ytd: 18.4, dayChg: 0.4, marketCap: 178, pe: 26.0, divYield: 2.1, w52H: 142, w52L: 85 },
  NOC:  { ticker: 'NOC',  name: 'Northrop Grumman',  exchange: 'NYSE',  sector: 'Aerospace & Defense', industry: 'Defense Prime', price: 478, ytd: 9.4, dayChg: 0.2, marketCap: 70, pe: 19.5, divYield: 1.6, w52H: 542, w52L: 420 },
  GD:   { ticker: 'GD',   name: 'General Dynamics',  exchange: 'NYSE',  sector: 'Aerospace & Defense', industry: 'Marine/Land', price: 308, ytd: 11.0, dayChg: 0.1, marketCap: 84, pe: 22.3, divYield: 1.9, w52H: 322, w52L: 240 },

  CAT:  { ticker: 'CAT',  name: 'Caterpillar',       exchange: 'NYSE',  sector: 'Industrials', industry: 'Heavy Machinery', price: 358, ytd: 14.2, dayChg: -0.3, marketCap: 178, pe: 16.1, divYield: 1.5, w52H: 388, w52L: 252 },
  DE:   { ticker: 'DE',   name: 'Deere',             exchange: 'NYSE',  sector: 'Industrials', industry: 'AgriTech', price: 412, ytd: 8.6, dayChg: 0.5, marketCap: 116, pe: 13.4, divYield: 1.4, w52H: 440, w52L: 320 },
  PWR:  { ticker: 'PWR',  name: 'Quanta Services',   exchange: 'NYSE',  sector: 'Industrials', industry: 'Infra Services', price: 282, ytd: 19.7, dayChg: 1.1, marketCap: 41, pe: 38.0, divYield: 0.2, w52H: 312, w52L: 168 },
  PH:   { ticker: 'PH',   name: 'Parker Hannifin',   exchange: 'NYSE',  sector: 'Industrials', industry: 'Motion/Control', price: 622, ytd: 14.4, dayChg: 0.7, marketCap: 80, pe: 24.6, divYield: 1.0, w52H: 680, w52L: 470 },
};

export function getStock(ticker: string): Stock | null {
  return STOCK_UNIVERSE[ticker] ?? null;
}
