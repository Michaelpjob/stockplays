import { useEffect, useState } from 'react';
import type { Stock } from './types';
import { lookupStock } from './stockLookup';
import { useAppState } from '../state/AppState';

interface State {
  stock: Stock | null;
  loading: boolean;
}

/**
 * Resolve a ticker via the cheapest layer that has data:
 *   1. AppState.stocksByTicker — DB-backed map refreshed nightly (or seeded
 *      universe in demo mode). Instant, synchronous, real.
 *   2. Finnhub live API — only for tickers the DB doesn't have yet
 *      (e.g. a custom ticker someone typed in the Builder).
 */
export function useStockLookup(ticker: string | null): State {
  const { stocksByTicker } = useAppState();
  const [state, setState] = useState<State>({ stock: null, loading: !!ticker });

  useEffect(() => {
    if (!ticker) {
      setState({ stock: null, loading: false });
      return;
    }
    const t = ticker.toUpperCase();
    const fromCache = stocksByTicker[t];
    if (fromCache) {
      setState({ stock: fromCache, loading: false });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ stock: prev.stock, loading: true }));
    lookupStock(t).then((stock) => {
      if (cancelled) return;
      setState({ stock, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [ticker, stocksByTicker]);

  return state;
}

export function useDebouncedStockLookup(input: string | null, delayMs = 300): State {
  const [debounced, setDebounced] = useState<string | null>(input);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), delayMs);
    return () => clearTimeout(id);
  }, [input, delayMs]);
  return useStockLookup(debounced || null);
}
