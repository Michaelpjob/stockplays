import { useMemo, useState } from 'react';
import PlayCard from '../components/PlayCard';
import SubscribeModal from '../components/SubscribeModal';
import { CATEGORIES, type Category, type Play } from '../lib/types';
import { CATEGORY_DOT_COLORS } from '../lib/categories';
import { useAppState } from '../state/AppState';

type Sort = 'trending' | 'performance' | 'subscribers' | 'newest';

export default function Discover() {
  const { plays } = useAppState();
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [sort, setSort] = useState<Sort>('trending');
  const [subscribingTo, setSubscribingTo] = useState<Play | null>(null);

  const visible = useMemo(() => {
    let list = plays.filter(
      (p) => p.status === 'approved' || p.status === 'submitted' || p.status === undefined
    );
    if (filter !== 'all') list = list.filter((p) => p.category === filter);
    list = list.slice();
    switch (sort) {
      case 'performance':
        list.sort((a, b) => (b.performance.ytd ?? 0) - (a.performance.ytd ?? 0));
        break;
      case 'subscribers':
        list.sort((a, b) => b.subscribers - a.subscribers);
        break;
      case 'newest':
        list.sort((a, b) => b.created.localeCompare(a.created));
        break;
      case 'trending':
      default:
        list.sort(
          (a, b) =>
            (b.subscribers * 0.4 + (b.performance.ytd ?? 0) * 12) -
            (a.subscribers * 0.4 + (a.performance.ytd ?? 0) * 12)
        );
        break;
    }
    return list;
  }, [plays, filter, sort]);

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Discover Plays</h1>
          <p className="subtitle">
            Thematic stock bundles built by curators. Each play comes with a written thesis,
            transparent holdings, and tracked performance vs benchmarks.
          </p>
        </div>
      </div>

      <div className="controls-row">
        <button
          className={`chip${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip${filter === c ? ' active' : ''}`}
            onClick={() => setFilter(c)}
          >
            <span className="chip-dot" style={{ background: CATEGORY_DOT_COLORS[c] }} />
            {c}
          </button>
        ))}
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          <option value="trending">Sort: Trending</option>
          <option value="performance">Sort: Best Performance</option>
          <option value="subscribers">Sort: Most Subscribers</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">No plays match this filter yet.</div>
      ) : (
        <div className="cards-grid">
          {visible.map((p) => (
            <PlayCard key={p.id} play={p} onSubscribeClick={setSubscribingTo} />
          ))}
        </div>
      )}

      <SubscribeModal play={subscribingTo} onClose={() => setSubscribingTo(null)} />
    </>
  );
}
