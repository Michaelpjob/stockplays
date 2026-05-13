import { useMemo } from 'react';
import { useAppState } from '../state/AppState';
import { getStock } from '../data/stockUniverse';
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
              {tickers.map((row) => {
                const s = getStock(row.ticker);
                return (
                  <tr key={row.ticker} onClick={() => openStockPanel(row.ticker)}>
                    <td>
                      <span className="ticker-pill-sym">{row.ticker}</span>{' '}
                      <span className="ticker-pill-name">{s?.name ?? ''}</span>
                    </td>
                    <td className="num">{row.weight.toFixed(0)}%</td>
                    <td className="num">{s ? fmtUsd(s.price) : '—'}</td>
                    <td className={`num ${(s?.dayChg ?? 0) >= 0 ? 'pos' : 'neg'}`}>
                      {s ? fmtPct(s.dayChg ?? 0) : '—'}
                    </td>
                    <td className={`num ${(s?.ytd ?? 0) >= 0 ? 'pos' : 'neg'}`}>
                      {s ? fmtPct(s.ytd) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {row.plays.join(' · ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
