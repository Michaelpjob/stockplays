import { useStockLookup } from '../lib/useStockLookup';
import { fmtPct, fmtUsd } from '../lib/format';
import { useAppState } from '../state/AppState';

interface Props {
  ticker: string;
  weight: number;
  /** Max weight across the basket — used to scale the bar fill. */
  maxWeight?: number;
}

export default function HoldingRow({ ticker, weight, maxWeight = 35 }: Props) {
  const { stock, loading } = useStockLookup(ticker);
  const { openStockPanel } = useAppState();

  return (
    <tr onClick={() => openStockPanel(ticker)}>
      <td>
        <div className="ticker-pill">
          <span className="ticker-pill-sym">{ticker}</span>
          <span className="ticker-pill-name">
            {loading ? '…' : stock?.name ?? ''}
          </span>
        </div>
      </td>
      <td className="num">
        {weight}%
        <div className="weight-bar">
          <div
            className="weight-bar-fill"
            style={{ width: `${Math.min(100, (weight / maxWeight) * 100)}%` }}
          />
        </div>
      </td>
      <td className="num">{stock ? fmtUsd(stock.price) : loading ? '…' : '—'}</td>
      <td className={`num ${(stock?.dayChg ?? 0) >= 0 ? 'pos' : 'neg'}`}>
        {stock ? fmtPct(stock.dayChg ?? 0) : loading ? '…' : '—'}
      </td>
      <td className={`num ${(stock?.ytd ?? 0) >= 0 ? 'pos' : 'neg'}`}>
        {stock && stock.ytd !== 0 ? fmtPct(stock.ytd) : '—'}
      </td>
    </tr>
  );
}
