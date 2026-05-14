import { useStockLookup } from '../lib/useStockLookup';
import { fmtPct, fmtUsd } from '../lib/format';
import { useAppState } from '../state/AppState';

interface Props {
  ticker: string;
  weight: number;
  /** Max weight across the basket — used to scale the bar fill. */
  maxWeight?: number;
  /** Names of other approved plays that include this ticker. */
  alsoIn?: string[];
}

export default function HoldingRow({ ticker, weight, maxWeight = 35, alsoIn }: Props) {
  const { stock, loading } = useStockLookup(ticker);
  const { openStockPanel } = useAppState();
  const overlapCount = alsoIn?.length ?? 0;

  return (
    <tr onClick={() => openStockPanel(ticker)}>
      <td>
        <div className="ticker-pill">
          <span className="ticker-pill-sym">{ticker}</span>
          <span className="ticker-pill-name">
            {loading ? '…' : stock?.name ?? ''}
          </span>
        </div>
        {overlapCount > 0 ? (
          <div
            className="also-in"
            title={alsoIn!.join(' · ')}
          >
            ↗ Also in {overlapCount === 1 ? alsoIn![0] : `${overlapCount} plays`}
          </div>
        ) : null}
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
