import type { Stock } from './types';
import { getStock as getSeedStock } from '../data/stockUniverse';

const KEY = import.meta.env.VITE_FINNHUB_KEY as string | undefined;

// Two-layer cache: in-memory for the session, localStorage for cross-session.
// TTL is long-ish because free Finnhub returns real-time during market hours;
// after-hours it doesn't change, and rate limits matter more than freshness.
const TTL_MS = 60 * 60 * 1000; // 1 hour
const LS_PREFIX = 'plays.stock.v1.';

const mem = new Map<string, { stock: Stock; ts: number }>();

function readLS(ticker: string): Stock | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + ticker);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { stock: Stock; ts: number };
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.stock;
  } catch {
    return null;
  }
}

function writeLS(stock: Stock) {
  try {
    localStorage.setItem(LS_PREFIX + stock.ticker, JSON.stringify({ stock, ts: Date.now() }));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Resolve a ticker through the cheapest layer that has data:
 *   1. seeded universe (free, instant) — for the 29 tickers shipped with the app
 *   2. localStorage cache (free, instant, 1h TTL)
 *   3. in-memory session cache
 *   4. Finnhub live API — only when nothing else has it
 *
 * Returns null if no provider has the ticker or VITE_FINNHUB_KEY is unset.
 */
export async function lookupStock(ticker: string): Promise<Stock | null> {
  const t = ticker.trim().toUpperCase();
  if (!t) return null;

  const seed = getSeedStock(t);
  if (seed) return seed;

  const memHit = mem.get(t);
  if (memHit && Date.now() - memHit.ts < TTL_MS) return memHit.stock;

  const lsHit = readLS(t);
  if (lsHit) {
    mem.set(t, { stock: lsHit, ts: Date.now() });
    return lsHit;
  }

  if (!KEY) return null;

  try {
    const [quoteRes, profRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(t)}&token=${KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(t)}&token=${KEY}`),
    ]);
    if (!quoteRes.ok || !profRes.ok) return null;

    const quote = (await quoteRes.json()) as {
      c?: number; // current price
      d?: number; // change
      dp?: number; // % change
      h?: number; // today's high
      l?: number; // today's low
      pc?: number; // previous close
    };
    const prof = (await profRes.json()) as {
      name?: string;
      exchange?: string;
      finnhubIndustry?: string;
      marketCapitalization?: number; // in millions USD
      country?: string;
    };

    if (!quote.c || !prof.name) return null;

    const stock: Stock = {
      ticker: t,
      name: prof.name,
      exchange: prof.exchange ?? '',
      sector: prof.finnhubIndustry ?? '',
      price: quote.c,
      ytd: 0,
      dayChg: quote.dp ?? 0,
      marketCap: (prof.marketCapitalization ?? 0) / 1000,
      pe: null,
      divYield: 0,
    };

    mem.set(t, { stock, ts: Date.now() });
    writeLS(stock);
    return stock;
  } catch {
    return null;
  }
}

export const hasLiveLookup = Boolean(KEY);
