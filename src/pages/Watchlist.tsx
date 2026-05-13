import { useMemo } from 'react';
import { useAppState } from '../state/AppState';
import { useStockLookup } from '../lib/useStockLookup';
import { fmtPct, fmtUsd } from '../lib/format';
import { Link } from 'react-router-dom';

export default function Watchlist() {
  const { plays, subscribed, openStockPanel, isSignedIn, openAuthModal } = useAppState();

  const tickers = useMemo(() => {
    const m = new Map<string, { plays: string[]; weight: number }>();
    for (const p of plays) {
      if (!subscribed.has(p.id)) continue;
      for (const h of p.holdings) {
        const entry = m.get(h.ticker) ?? { plays: [], weight: 0 };
        entry.plays.push(p.name);
        entry.weight += h.weight;
        m.set(h.ticker, entry);
      }
    }
    return [...m.entries()]
      .map(([t, info]) => ({ ticker: t, ...info }))
      .sort((a, b) => b.weight - a.weight);
  }, [plays, subscribed]);

  if (!isSignedIn) {
    return (
      <>
        <div className="screen-header">
          <div>
            <h1>Watchlist</h1>
            <p className="subtitle">
              Every ticker across plays you subscribe to, aggregated and weighted by exposure.
            </p>
          </div>
        </div>
        <div className="empty-state">
          <button
            className="signin-prompt"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline' }}
            onClick={openAuthModal}
          >
            Sign in
          </button>{' '}
          to see your watchlist.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Watchlist</h1>
          <p className="subtitle">
            Every ticker across plays you subscribe to, aggregated by total weighting.
          </p>
        </div>
      </div>

      {tickers.length === 0 ? (
        <div className="empty-state">
          Subscribe to a play and its tickers will show up here.{' '}
          <Link to="/" style={{ color: 'var(--text)' }}>
            Browse Discover
          </Link>
          .
        </div>
      ) : (
        <div className="panel">
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Exposure</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Day</th>
                <th style={{ textAlign: 'right' }}>YTD</th>
                <th>In plays</th>
              </tr>
            </thead>
            <tbody>
              {tickers.map((row) => (
                <WatchlistRow
                  key={row.ticker}
                  ticker={row.ticker}
                  weight={row.weight}
                  plays={row.plays}
                  onClick={() => openStockPanel(row.ticker)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function WatchlistRow({
  ticker,
  weight,
  plays,
  onClick,
}: {
  ticker: string;
  weight: number;
  plays: string[];
  onClick: () => void;
}) {
  const { stock, loading } = useStockLookup(ticker);
  return (
    <tr onClick={onClick}>
      <td>
        <span className="ticker-pill-sym">{ticker}</span>{' '}
        <span className="ticker-pill-name">{loading ? '…' : stock?.name ?? ''}</span>
      </td>
      <td className="num">{weight.toFixed(0)}%</td>
      <td className="num">{stock ? fmtUsd(stock.price) : loading ? '…' : '—'}</td>
      <td className={`num ${(stock?.dayChg ?? 0) >= 0 ? 'pos' : 'neg'}`}>
        {stock ? fmtPct(stock.dayChg ?? 0) : loading ? '…' : '—'}
      </td>
      <td className={`num ${(stock?.ytd ?? 0) >= 0 ? 'pos' : 'neg'}`}>
        {stock && stock.ytd !== 0 ? fmtPct(stock.ytd) : '—'}
      </td>
      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{plays.join(' · ')}</td>
    </tr>
  );
}
