import { supabase } from './supabase';
import type { Stock } from './types';

interface DbStock {
  ticker: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  price: number | null;
  ytd: number | null;
  day_chg: number | null;
  market_cap_b: number | null;
  pe: number | null;
  div_yield: number | null;
  w52_high: number | null;
  w52_low: number | null;
}

function mapStock(row: DbStock): Stock {
  return {
    ticker: row.ticker,
    name: row.name,
    exchange: row.exchange,
    sector: row.sector ?? '',
    industry: row.industry ?? undefined,
    price: row.price ? Number(row.price) : 0,
    ytd: row.ytd ? Number(row.ytd) : 0,
    dayChg: row.day_chg ? Number(row.day_chg) : undefined,
    marketCap: row.market_cap_b ? Number(row.market_cap_b) : 0,
    pe: row.pe ? Number(row.pe) : null,
    divYield: row.div_yield ? Number(row.div_yield) : undefined,
    w52H: row.w52_high ? Number(row.w52_high) : undefined,
    w52L: row.w52_low ? Number(row.w52_low) : undefined,
  };
}

/** Fetch every stock once. Cheap (~30 rows). Source of truth for the app. */
export async function fetchAllStocks(): Promise<Stock[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('stocks')
    .select(
      'ticker, name, exchange, sector, industry, price, ytd, day_chg, market_cap_b, pe, div_yield, w52_high, w52_low'
    );
  if (error) {
    console.error('fetchAllStocks:', error.message);
    return [];
  }
  return (data ?? []).map((r) => mapStock(r as unknown as DbStock));
}

export async function fetchStockPriceSeries(
  ticker: string,
  days = 365
): Promise<{ date: string; close: number }[]> {
  if (!supabase) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('stock_prices')
    .select('date, adjusted_close')
    .eq('ticker', ticker)
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: true });
  if (error) {
    console.error('fetchStockPriceSeries:', error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    date: r.date as string,
    close: Number(r.adjusted_close),
  }));
}
