import type { Stock } from './types';

const KEY = import.meta.env.VITE_FINNHUB_KEY as string | undefined;

// Per-session memory cache so repeated lookups of the same ticker within a
// session don't re-hit Finnhub. Cross-session caching is unnecessary now that
// the primary source is the Supabase stocks table (refreshed nightly).
const mem = new Map<string, { stock: Stock; ts: number }>();
const TTL_MS = 60 * 60 * 1000;

/**
 * Fetch a single ticker's stock data via the Finnhub live API.
 *
 * This is the *fallback* path for tickers that aren't in the canonical
 * Supabase stocks table — for example, an arbitrary US ticker a user types
 * into the Builder. The DB cache is consulted first by `useStockLookup`,
 * which reads from AppState; we only hit Finnhub when the DB has nothing.
 *
 * Returns null when the Finnhub key isn't set or the API fails.
 */
export async function lookupStock(ticker: string): Promise<Stock | null> {
  const t = ticker.trim().toUpperCase();
  if (!t) return null;

  const memHit = mem.get(t);
  if (memHit && Date.now() - memHit.ts < TTL_MS) return memHit.stock;

  if (!KEY) return null;

  try {
    const [quoteRes, profRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(t)}&token=${KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(t)}&token=${KEY}`),
    ]);
    if (!quoteRes.ok || !profRes.ok) return null;

    const quote = (await quoteRes.json()) as {
      c?: number;
      d?: number;
      dp?: number;
      h?: number;
      l?: number;
      pc?: number;
    };
    const prof = (await profRes.json()) as {
      name?: string;
      exchange?: string;
      finnhubIndustry?: string;
      marketCapitalization?: number;
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
    return stock;
  } catch {
    return null;
  }
}

export const hasLiveLookup = Boolean(KEY);
