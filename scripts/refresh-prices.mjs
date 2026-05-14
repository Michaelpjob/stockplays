#!/usr/bin/env node
// Refresh adjusted-close prices from Polygon and recompute play performance.
//
// Required env:
//   POLYGON_API_KEY      Polygon.io API key (Starter or higher)
//   SUPABASE_DB_URL      Postgres connection string (session pooler)
//
// Behaviour:
//   1. Identify every ticker referenced by any play's holdings + benchmark
//      tickers (SPY + sector benchmarks).
//   2. Fetch the last ~13 months of daily bars per ticker from Polygon.
//   3. Upsert into public.stock_prices and refresh public.stocks (price, YTD).
//   4. For each approved play, recompute returns over 1M, 3M, YTD, 1Y
//      windows and the vs-benchmark delta. Persist to public.plays.performance.
//
// Single-period total-return method (buy-and-hold over the window). Not
// rebalanced daily. Adequate for v1; can switch to daily-rebalanced TWR
// later by accumulating sum(weight * daily_return) and geometrically linking.

import pg from 'pg';

const { Client } = pg;

const POLYGON_KEY = process.env.POLYGON_API_KEY;
const DB_URL = process.env.SUPABASE_DB_URL;

if (!POLYGON_KEY || !DB_URL) {
  console.error('Missing POLYGON_API_KEY or SUPABASE_DB_URL');
  process.exit(1);
}

const BENCHMARK_TICKERS = ['SPY', 'SMH', 'XLE', 'HACK', 'XBI', 'ITA', 'XLI'];

// Map the human-readable `plays.benchmark` string to a single ticker we
// have prices for. First-listed ticker wins; default to SPY.
const BENCHMARK_MAP = new Map([
  ['SMH / SOXX', 'SMH'],
  ['XLE / XLU', 'XLE'],
  ['HACK', 'HACK'],
  ['XBI / IBB', 'XBI'],
  ['ITA', 'ITA'],
  ['XLI', 'XLI'],
]);

function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchPolygonBars(ticker, fromDate, toDate) {
  const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=5000&apiKey=${POLYGON_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Polygon HTTP ${res.status} for ${ticker}`);
    return [];
  }
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'DELAYED') {
    console.warn(`  Polygon non-OK for ${ticker}: ${data.message ?? data.status}`);
    return [];
  }
  if (!data.results) return [];
  return data.results.map((r) => ({
    date: new Date(r.t).toISOString().slice(0, 10),
    close: r.c,
    high: r.h,
    low: r.l,
  }));
}

async function fetchPolygonReference(ticker) {
  const url = `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(ticker)}?apiKey=${POLYGON_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.results ?? null;
}

async function upsertPrices(client, ticker, bars) {
  if (bars.length === 0) return;
  // Bulk insert via VALUES list. Keep batches modest so we don't blow query size.
  const chunkSize = 500;
  for (let i = 0; i < bars.length; i += chunkSize) {
    const chunk = bars.slice(i, i + chunkSize);
    const values = chunk
      .map((_, idx) => `($1, $${idx * 2 + 2}, $${idx * 2 + 3})`)
      .join(',');
    const params = [ticker];
    for (const b of chunk) {
      params.push(b.date, b.close);
    }
    await client.query(
      `insert into public.stock_prices (ticker, date, adjusted_close)
       values ${values}
       on conflict (ticker, date) do update set adjusted_close = excluded.adjusted_close`,
      params
    );
  }
}

async function refreshTicker(client, ticker, fromDate, toDate) {
  const bars = await fetchPolygonBars(ticker, fromDate, toDate);
  console.log(`  ${ticker}: ${bars.length} bars`);
  if (bars.length === 0) return null;

  await upsertPrices(client, ticker, bars);

  // Compute the snapshot fields from the bars.
  const latest = bars[bars.length - 1];
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const ytdBar = bars.find((b) => b.date >= yearStart) ?? bars[0];
  const ytd = ytdBar ? ((latest.close / ytdBar.close) - 1) * 100 : 0;
  const dayChg =
    bars.length >= 2 ? ((latest.close / bars[bars.length - 2].close) - 1) * 100 : 0;

  // Trailing 52 weeks of trading days (≈260 sessions).
  const trailing = bars.slice(-260);
  const w52H = Math.max(...trailing.map((b) => b.high ?? b.close));
  const w52L = Math.min(...trailing.map((b) => b.low ?? b.close));

  // Reference data: name, market cap, sector. One extra Polygon call per
  // ticker. Free tier limit isn't a concern with the Starter plan.
  const ref = await fetchPolygonReference(ticker);
  const marketCapB = ref?.market_cap ? Number(ref.market_cap) / 1e9 : null;
  const refName = ref?.name ?? null;

  await client.query(
    `update public.stocks
     set price = $1, ytd = $2, day_chg = $3, w52_high = $4, w52_low = $5,
         market_cap_b = coalesce($6, market_cap_b),
         name = coalesce($7, name),
         updated_at = now()
     where ticker = $8`,
    [
      latest.close,
      ytd.toFixed(2),
      dayChg.toFixed(2),
      w52H.toFixed(2),
      w52L.toFixed(2),
      marketCapB?.toFixed(2) ?? null,
      refName,
      ticker,
    ]
  );

  return latest;
}

function startOfWindow(win) {
  const d = new Date();
  if (win === 'ytd') return new Date(`${d.getFullYear()}-01-01T00:00:00Z`);
  if (win === '1m') {
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  if (win === '3m') {
    d.setMonth(d.getMonth() - 3);
    return d;
  }
  if (win === '1y') {
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  throw new Error(`Unknown window: ${win}`);
}

async function returnBetween(client, ticker, startDate, endDate) {
  const sRes = await client.query(
    `select adjusted_close from public.stock_prices
     where ticker = $1 and date >= $2 order by date asc limit 1`,
    [ticker, startDate]
  );
  const eRes = await client.query(
    `select adjusted_close from public.stock_prices
     where ticker = $1 and date <= $2 order by date desc limit 1`,
    [ticker, endDate]
  );
  if (!sRes.rows[0] || !eRes.rows[0]) return null;
  const s = Number(sRes.rows[0].adjusted_close);
  const e = Number(eRes.rows[0].adjusted_close);
  if (!s) return null;
  return (e / s - 1) * 100;
}

async function recomputePlay(client, play) {
  const holdingsRes = await client.query(
    `select ticker, weight from public.play_holdings where play_id = $1`,
    [play.id]
  );
  const holdings = holdingsRes.rows.map((r) => ({
    ticker: r.ticker,
    weight: Number(r.weight),
  }));
  if (holdings.length === 0) return null;

  const benchTicker = BENCHMARK_MAP.get(play.benchmark) ?? 'SPY';
  const endDate = dateOnly(new Date());

  const performance = {};

  for (const win of ['1m', '3m', 'ytd', '1y']) {
    const startDate = dateOnly(startOfWindow(win));
    let weighted = 0;
    let totalWeight = 0;
    for (const h of holdings) {
      const r = await returnBetween(client, h.ticker, startDate, endDate);
      if (r === null) continue;
      weighted += r * (h.weight / 100);
      totalWeight += h.weight;
    }
    if (totalWeight === 0) continue;
    const playReturn = weighted * (100 / totalWeight); // rescale if missing data
    performance[win] = Number(playReturn.toFixed(2));

    // Only persist a vs-benchmark delta for YTD (front-end card uses it).
    if (win === 'ytd') {
      const benchR = await returnBetween(client, benchTicker, startDate, endDate);
      if (benchR !== null) {
        performance.vs_spy = Number((playReturn - benchR).toFixed(2));
      }
    }
  }

  await client.query(
    `update public.plays
     set performance = $1::jsonb, updated_at = now()
     where id = $2`,
    [JSON.stringify(performance), play.id]
  );
  return performance;
}

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Date range: pull ~13 months so YTD and 1Y windows have a start bar.
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setMonth(fromDate.getMonth() - 13);
  const fromStr = dateOnly(fromDate);
  const toStr = dateOnly(today);

  const tickRes = await client.query(
    `select distinct ticker from public.play_holdings
     union
     select unnest($1::text[])`,
    [BENCHMARK_TICKERS]
  );
  const tickers = tickRes.rows.map((r) => r.ticker).sort();
  console.log(`Refreshing ${tickers.length} tickers from ${fromStr} to ${toStr}`);

  for (const t of tickers) {
    await refreshTicker(client, t, fromStr, toStr);
  }

  const playsRes = await client.query(
    `select id, slug, benchmark from public.plays where status = 'approved'`
  );
  console.log(`Recomputing performance for ${playsRes.rows.length} plays`);
  for (const p of playsRes.rows) {
    const perf = await recomputePlay(client, p);
    console.log(`  ${p.slug}: ${JSON.stringify(perf)}`);
  }

  await client.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
