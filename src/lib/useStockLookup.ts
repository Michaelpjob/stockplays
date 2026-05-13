import { useEffect, useState } from 'react';
import type { Stock } from './types';
import { lookupStock } from './stockLookup';

interface State {
  stock: Stock | null;
  loading: boolean;
}

export function useStockLookup(ticker: string | null): State {
  const [state, setState] = useState<State>({ stock: null, loading: !!ticker });

  useEffect(() => {
    if (!ticker) {
      setState({ stock: null, loading: false });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ stock: prev.stock, loading: true }));
    lookupStock(ticker).then((stock) => {
      if (cancelled) return;
      setState({ stock, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  return state;
}

// Debounced version for autocomplete fields.
export function useDebouncedStockLookup(input: string, delayMs = 300): State {
  const [debounced, setDebounced] = useState(input);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(input), delayMs);
    return () => clearTimeout(id);
  }, [input, delayMs]);
  return useStockLookup(debounced || null);
}
