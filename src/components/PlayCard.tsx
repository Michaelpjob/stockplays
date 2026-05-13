import { useNavigate } from 'react-router-dom';
import type { Play } from '../lib/types';
import { fmtPct, fmtCount } from '../lib/format';
import { useAppState } from '../state/AppState';

interface Props {
  play: Play;
  onSubscribeClick?: (play: Play) => void;
}

export default function PlayCard({ play, onSubscribeClick }: Props) {
  const navigate = useNavigate();
  const { subscribed, unsubscribe, isSignedIn, openAuthModal } = useAppState();
  const isSubscribed = subscribed.has(play.id);
  const ytd = play.performance.ytd ?? 0;
  const vsSpy = play.performance.vs_spy ?? 0;

  const handleCardClick = () => navigate(`/plays/${play.slug}`);
  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSignedIn) {
      openAuthModal();
      return;
    }
    if (isSubscribed) unsubscribe(play.id);
    else onSubscribeClick?.(play);
  };
  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/plays/${play.slug}`);
  };

  return (
    <article
      className="play-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
    >
      <div className="card-header">
        <div>
          <div className="card-title">{play.name}</div>
          <div className="card-author">
            {play.authorHandle === 'editorial' ? (
              <>Curated by {play.author}</>
            ) : (
              <>by {play.author}</>
            )}
            {' · '}
            {play.holdings.length} holdings
          </div>
        </div>
        <span className={`badge badge-${play.category}`}>{play.category}</span>
      </div>

      <div className="card-thesis">{play.thesisShort}</div>

      <div className="card-stats">
        <div className="stat">
          <span className="stat-label">YTD</span>
          <span className={`stat-value ${ytd >= 0 ? 'pos' : 'neg'}`}>
            {fmtPct(ytd)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">vs {play.benchmark.split(' ')[0]}</span>
          <span className={`stat-value ${vsSpy >= 0 ? 'pos' : 'neg'}`}>
            {fmtPct(vsSpy)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Subs</span>
          <span className="stat-value">{fmtCount(play.subscribers)}</span>
        </div>
      </div>

      <div className="holdings-strip">
        {play.holdings.slice(0, 4).map((h) => (
          <span key={h.ticker} className="holding-pill">
            {h.ticker} {h.weight}%
          </span>
        ))}
        {play.holdings.length > 4 ? (
          <span className="holding-pill">+{play.holdings.length - 4}</span>
        ) : null}
      </div>

      <div className="card-actions">
        <button
          className={`btn ${isSubscribed ? 'btn-subscribed' : 'btn-primary'}`}
          onClick={handleSubscribeClick}
        >
          {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
        </button>
        <button className="btn" onClick={handleViewClick}>
          View thesis →
        </button>
      </div>
    </article>
  );
}
