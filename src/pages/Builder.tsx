import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { CATEGORIES, type Category, type Holding, type Play, type Rebalance } from '../lib/types';
import { CATEGORY_BENCHMARKS } from '../lib/categories';
import { fmtUsd, normalizeWeights, today } from '../lib/format';
import { useDebouncedStockLookup } from '../lib/useStockLookup';
import { hasLiveLookup } from '../lib/stockLookup';

const REBALANCES: Rebalance[] = ['Quarterly', 'Monthly', 'Threshold-triggered', 'Manual'];

export default function Builder() {
  const { editId } = useParams();
  const navigate = useNavigate();
  const { plays, upsertPlay, user, isSignedIn, openAuthModal, stocksByTicker } = useAppState();

  const editing = editId ? plays.find((p) => p.id === editId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'AI');
  const [benchmark, setBenchmark] = useState(
    editing?.benchmark ?? CATEGORY_BENCHMARKS['AI']
  );
  const [rebalance, setRebalance] = useState<Rebalance>(editing?.rebalance ?? 'Quarterly');
  const [thesisShort, setThesisShort] = useState(editing?.thesisShort ?? '');
  const [thesisLong, setThesisLong] = useState(editing?.thesisLong ?? '');
  const [holdings, setHoldings] = useState<Holding[]>(editing?.holdings ?? []);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!editing) setBenchmark(CATEGORY_BENCHMARKS[category]);
  }, [category, editing]);

  const total = useMemo(() => holdings.reduce((a, h) => a + h.weight, 0), [holdings]);
  const balanced = Math.abs(total - 100) <= 0.5;

  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toUpperCase();
    return Object.values(stocksByTicker)
      .filter(
        (s) =>
          (s.ticker.includes(q) || s.name.toUpperCase().includes(q)) &&
          !holdings.find((h) => h.ticker === s.ticker)
      )
      .slice(0, 8);
  }, [search, holdings, stocksByTicker]);

  // If nothing matches the canonical stocks table, try to resolve via Finnhub.
  const customTicker = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!/^[A-Z]{1,5}(\.[A-Z])?$/.test(q)) return null;
    if (holdings.find((h) => h.ticker === q)) return null;
    if (stocksByTicker[q]) return null;
    return q;
  }, [search, holdings, stocksByTicker]);

  // Debounced live lookup against Finnhub for the typed ticker. Skips the
  // network call when the seeded universe already has it.
  const liveLookup = useDebouncedStockLookup(customTicker);

  function addHolding(ticker: string) {
    const remaining = Math.max(0, 100 - total);
    const initial = Math.min(10, remaining || 10);
    setHoldings((prev) => [...prev, { ticker, weight: initial }]);
    setSearch('');
  }
  function removeHolding(ticker: string) {
    setHoldings((prev) => prev.filter((h) => h.ticker !== ticker));
  }
  function setWeight(ticker: string, weight: number) {
    setHoldings((prev) => prev.map((h) => (h.ticker === ticker ? { ...h, weight } : h)));
  }
  function normalize() {
    setHoldings((prev) => {
      const w = normalizeWeights(prev.map((h) => h.weight));
      return prev.map((h, i) => ({ ...h, weight: w[i] }));
    });
  }

  function save(asDraft: boolean) {
    if (!isSignedIn) {
      openAuthModal();
      return;
    }
    if (!user) return;
    if (!name.trim() || holdings.length < 4 || !thesisShort.trim()) {
      alert('Name, a short thesis, and at least 4 holdings are required to save.');
      return;
    }
    const slug = (editing?.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/-+$/g, '');
    const play: Play = {
      id: editing?.id ?? slug,
      slug,
      name: name.trim(),
      category,
      author: user.displayName,
      authorHandle: user.handle,
      thesisShort: thesisShort.trim(),
      thesisLong: thesisLong.trim() || thesisShort.trim(),
      subscribers: editing?.subscribers ?? 0,
      created: editing?.created ?? today(),
      updated: today(),
      benchmark,
      rebalance,
      holdings,
      performance: editing?.performance ?? { ytd: 0, vs_spy: 0 },
      updates: editing?.updates ?? [],
      kudos: editing?.kudos ?? 0,
      followers: editing?.followers ?? 0,
      discussion: editing?.discussion ?? [],
      status: asDraft ? 'draft' : 'submitted',
    };
    upsertPlay(play);
    navigate(asDraft ? '/me' : `/plays/${slug}`);
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>{editing ? 'Edit play' : 'Create a Play'}</h1>
          <p className="subtitle">
            A play is a thesis plus a basket. Aim for 4–12 holdings, weights summing to 100%.
            Curators submit for review before publishing.
          </p>
        </div>
      </div>

      <div className="builder-grid">
        <div>
          <section className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 600 }}>Basics</h3>
            <div className="form-group">
              <label className="form-label">Play name</label>
              <input
                className="input"
                placeholder="e.g. AI Compute Stack"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="row-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Benchmark</label>
                <input
                  className="input"
                  value={benchmark}
                  onChange={(e) => setBenchmark(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Rebalance cadence</label>
              <select
                className="select"
                value={rebalance}
                onChange={(e) => setRebalance(e.target.value as Rebalance)}
              >
                {REBALANCES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 600 }}>Thesis</h3>
            <div className="form-group">
              <label className="form-label">Short thesis (card preview)</label>
              <textarea
                className="textarea"
                value={thesisShort}
                onChange={(e) => setThesisShort(e.target.value)}
                placeholder="One paragraph. Shows on cards and search results."
                style={{ minHeight: 80 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Long thesis (detail page)</label>
              <textarea
                className="textarea"
                value={thesisLong}
                onChange={(e) => setThesisLong(e.target.value)}
                placeholder="Full reasoning. Falsifiable claims. Stated risks."
              />
            </div>
          </section>

          <section className="panel">
            <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 600 }}>Holdings</h3>
            <div className="form-group">
              <label className="form-label">Add a ticker</label>
              <input
                className="input"
                placeholder="Search NVDA, Microsoft, etc."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {results.length || customTicker ? (
                <div className="search-results">
                  {results.map((s) => (
                    <button
                      key={s.ticker}
                      className="search-result"
                      onClick={() => addHolding(s.ticker)}
                    >
                      <div>
                        <span className="ticker-pill-sym">{s.ticker}</span>{' '}
                        <span className="ticker-pill-name">{s.name}</span>
                      </div>
                      <span className="tip">{fmtUsd(s.price)}</span>
                    </button>
                  ))}
                  {customTicker ? (
                    liveLookup.loading ? (
                      <div className="search-result" style={{ cursor: 'default' }}>
                        <div>
                          <span className="ticker-pill-sym">{customTicker}</span>{' '}
                          <span className="ticker-pill-name">Looking up…</span>
                        </div>
                      </div>
                    ) : liveLookup.stock ? (
                      <button
                        className="search-result"
                        onClick={() => addHolding(liveLookup.stock!.ticker)}
                      >
                        <div>
                          <span className="ticker-pill-sym">{liveLookup.stock.ticker}</span>{' '}
                          <span className="ticker-pill-name">{liveLookup.stock.name}</span>
                        </div>
                        <span className="tip">{fmtUsd(liveLookup.stock.price)}</span>
                      </button>
                    ) : (
                      <button
                        className="search-result"
                        onClick={() => addHolding(customTicker)}
                      >
                        <div>
                          <span className="ticker-pill-sym">{customTicker}</span>{' '}
                          <span className="ticker-pill-name">
                            + Add as custom ticker
                          </span>
                        </div>
                        <span className="tip">
                          {hasLiveLookup ? 'Not found · added bare' : 'No price data'}
                        </span>
                      </button>
                    )
                  ) : null}
                </div>
              ) : null}
              <div className="tip">
                {hasLiveLookup
                  ? 'Type any US-listed ticker (e.g. NFLX, DIS, BRK.B). Live price is fetched from Finnhub.'
                  : 'Type a ticker (e.g. NFLX, DIS). Live data is off — set VITE_FINNHUB_KEY to enable.'}
              </div>
            </div>

            {holdings.length === 0 ? (
              <div className="empty-state">
                Add at least 4 holdings to be eligible for review.
              </div>
            ) : (
              <div className="builder-holdings">
                {holdings.map((h) => {
                  const s = stocksByTicker[h.ticker];
                  return (
                    <div key={h.ticker} className="builder-holding">
                      <div className="ticker-pill-sym">{h.ticker}</div>
                      <div className="ticker-pill-name">{s?.name ?? ''}</div>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        step={0.5}
                        value={h.weight}
                        onChange={(e) => setWeight(h.ticker, parseFloat(e.target.value) || 0)}
                      />
                      <button
                        className="remove-btn"
                        onClick={() => removeHolding(h.ticker)}
                        aria-label={`Remove ${h.ticker}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {holdings.length ? (
              <div className="weight-summary">
                <span>
                  Total:{' '}
                  <span className={`weight-total ${balanced ? 'balanced' : 'unbalanced'}`}>
                    {total.toFixed(1)}%
                  </span>
                </span>
                {!balanced ? (
                  <button className="normalize-btn" onClick={normalize}>
                    Normalize to 100%
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="modal-actions" style={{ marginTop: 22 }}>
              <button className="btn" onClick={() => save(true)}>
                Save as draft
              </button>
              <button className="btn btn-primary" onClick={() => save(false)}>
                Submit for review
              </button>
            </div>
          </section>
        </div>

        <aside className="preview-card panel">
          <div className="panel-title">Preview</div>
          <div className="preview-title">{name || 'Untitled play'}</div>
          <div className="card-author" style={{ color: 'var(--muted)' }}>
            by {user?.displayName ?? 'You'} · {holdings.length} holdings
          </div>
          <p className="preview-thesis">
            {thesisShort || 'Your short thesis will appear here.'}
          </p>
          <div className="preview-summary">
            <div>
              <span>Category</span>
              <b>{category}</b>
            </div>
            <div>
              <span>Benchmark</span>
              <b>{benchmark}</b>
            </div>
            <div>
              <span>Rebalance</span>
              <b>{rebalance}</b>
            </div>
            <div>
              <span>Weights</span>
              <b className={balanced ? 'pos' : ''}>{total.toFixed(1)}%</b>
            </div>
          </div>
          <div className="holdings-strip" style={{ padding: 0 }}>
            {holdings.slice(0, 6).map((h) => (
              <span key={h.ticker} className="holding-pill">
                {h.ticker} {h.weight}%
              </span>
            ))}
            {holdings.length > 6 ? (
              <span className="holding-pill">+{holdings.length - 6}</span>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
