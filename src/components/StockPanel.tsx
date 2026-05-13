import { useAppState } from '../state/AppState';
import { fmtMcap, fmtPct, fmtUsd } from '../lib/format';
import { useStockLookup } from '../lib/useStockLookup';
import Sparkline from './Sparkline';

export default function StockPanel() {
  const { stockPanelTicker, closeStockPanel } = useAppState();
  const { stock, loading } = useStockLookup(stockPanelTicker);

  if (!stockPanelTicker) return null;

  return (
    <>
      <div className="stock-panel-overlay" onClick={closeStockPanel} />
      <aside className="stock-panel active">
        <button className="stock-panel-close" onClick={closeStockPanel} aria-label="Close">
          ×
        </button>

        {loading ? (
          <div className="loading">Loading {stockPanelTicker}…</div>
        ) : stock ? (
          <>
            <div className="stock-panel-header">
              <div className="stock-panel-ticker">{stock.ticker}</div>
              <div className="stock-panel-name">{stock.name}</div>
              {stock.exchange ? (
                <div className="stock-panel-exchange">{stock.exchange}</div>
              ) : null}
            </div>

            <div className="stock-panel-price">{fmtUsd(stock.price)}</div>
            <div className={`stock-panel-change ${(stock.dayChg ?? 0) >= 0 ? 'pos' : 'neg'}`}>
              {fmtPct(stock.dayChg ?? 0)} today
              {stock.ytd !== 0 ? ` · ${fmtPct(stock.ytd)} YTD` : ''}
            </div>

            <div className="stock-chart-wrap">
              <div className="stock-chart-title">12-month price (mock)</div>
              <Sparkline trend={(stock.ytd ?? stock.dayChg ?? 0) >= 0 ? 'up' : 'down'} />
            </div>

            <div className="stock-stats">
              <div className="stock-stat">
                <div className="label">Market cap</div>
                <div className="value">
                  {stock.marketCap ? fmtMcap(stock.marketCap) : '—'}
                </div>
              </div>
              <div className="stock-stat">
                <div className="label">P/E</div>
                <div className="value">{stock.pe ? stock.pe.toFixed(1) : '—'}</div>
              </div>
              <div className="stock-stat">
                <div className="label">52w high</div>
                <div className="value">{stock.w52H ? fmtUsd(stock.w52H) : '—'}</div>
              </div>
              <div className="stock-stat">
                <div className="label">52w low</div>
                <div className="value">{stock.w52L ? fmtUsd(stock.w52L) : '—'}</div>
              </div>
              <div className="stock-stat">
                <div className="label">Div yield</div>
                <div className="value">
                  {stock.divYield ? `${stock.divYield.toFixed(2)}%` : '—'}
                </div>
              </div>
              <div className="stock-stat">
                <div className="label">Sector</div>
                <div className="value" style={{ fontSize: 13 }}>
                  {stock.sector || '—'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="loading">No data for {stockPanelTicker}.</div>
        )}
      </aside>
    </>
  );
}
