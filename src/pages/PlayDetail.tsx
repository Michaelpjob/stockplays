import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { fmtCount, fmtDate, fmtPct, fmtRelative, fmtSince, fmtUsd } from '../lib/format';
import { getStock } from '../data/stockUniverse';
import SubscribeModal from '../components/SubscribeModal';
import Sparkline from '../components/Sparkline';
import type { DiscussionItem } from '../lib/types';

type Win = '1m' | '3m' | 'ytd' | '1y' | 'inception';

export default function PlayDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    plays,
    subscribed,
    subscriptionDetails,
    unsubscribe,
    kudos,
    follows,
    saves,
    toggleKudos,
    toggleFollow,
    toggleSave,
    commentVotes,
    voteComment,
    isSignedIn,
    openAuthModal,
    openStockPanel,
    createdByMe,
  } = useAppState();

  const play = plays.find((p) => p.slug === slug);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [win, setWin] = useState<Win>('ytd');

  if (!play) {
    return (
      <div className="empty-state">
        Play not found. <Link to="/" style={{ color: 'var(--text)' }}>Back to Discover</Link>
      </div>
    );
  }

  const isSubscribed = subscribed.has(play.id);
  const isKudoed = kudos.has(play.id);
  const isFollowing = follows.has(play.id);
  const isSaved = saves.has(play.id);
  const isMine = createdByMe.has(play.id);
  const subInfo = subscriptionDetails[play.id];

  const winValue = useMemo<number | null>(() => {
    if (win === 'inception' && subInfo) {
      // Approximate since-inception return.
      const days = Math.max(
        1,
        Math.floor((Date.now() - new Date(subInfo.inceptionDate).getTime()) / 86_400_000)
      );
      const ytd = play.performance.ytd ?? 0;
      return ytd * Math.min(1.2, days / 200);
    }
    const v = play.performance[win as Exclude<Win, 'inception'>];
    return typeof v === 'number' ? v : null;
  }, [win, play, subInfo]);

  function handleSubscribeClick() {
    if (!isSignedIn) {
      openAuthModal();
      return;
    }
    if (isSubscribed) unsubscribe(play!.id);
    else setShowSubscribe(true);
  }
  function handleEngagement(fn: () => void) {
    if (!isSignedIn) {
      openAuthModal();
      return;
    }
    fn();
  }
  function copyBasket() {
    const text = play!.holdings.map((h) => `${h.ticker}\t${h.weight}%`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {
      /* ignore */
    });
  }

  return (
    <>
      <button className="detail-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <section className="detail-hero">
        <div className="detail-hero-tag-row">
          <span className={`badge badge-${play.category}`}>{play.category}</span>
          <span className="updated">Updated {fmtDate(play.updated)}</span>
        </div>
        <h1>{play.name}</h1>
        <div className="detail-hero-meta">
          <span>
            by <b>{play.author}</b>{' '}
            <Link to={`/u/${play.authorHandle}`} style={{ color: 'var(--muted)' }}>
              @{play.authorHandle}
            </Link>
          </span>
          <span>•</span>
          <span>{fmtCount(play.subscribers)} subscribers</span>
          <span>•</span>
          <span>Rebalance: {play.rebalance}</span>
          <span>•</span>
          <span>Benchmark: {play.benchmark}</span>
        </div>
        <p className="detail-hero-thesis">{play.thesisLong}</p>
        <div className="detail-hero-actions">
          <button
            className={`btn btn-flex-auto ${isSubscribed ? 'btn-subscribed' : 'btn-primary'}`}
            onClick={handleSubscribeClick}
          >
            {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
          </button>
          {isSubscribed && subInfo ? (
            <span className="inception-pill">Since {fmtSince(subInfo.inceptionDate)}</span>
          ) : null}
          <button
            className={`action-icon-btn${isKudoed ? ' active' : ''}`}
            onClick={() => handleEngagement(() => toggleKudos(play.id))}
          >
            {isKudoed ? '♥' : '♡'}
            <span className="count">{fmtCount(play.kudos)}</span> Kudos
          </button>
          <button
            className={`action-icon-btn${isFollowing ? ' active' : ''}`}
            onClick={() => handleEngagement(() => toggleFollow(play.id))}
          >
            {isFollowing ? '★ Following' : '☆ Follow'}
          </button>
          <button
            className={`action-icon-btn${isSaved ? ' active' : ''}`}
            onClick={() => handleEngagement(() => toggleSave(play.id))}
          >
            {isSaved ? '◉ Saved' : '◯ Save'}
          </button>
          <button className="action-icon-btn" onClick={copyBasket}>
            📋 Copy basket weights
          </button>
          {isMine ? (
            <button className="action-icon-btn" onClick={() => navigate(`/create/${play.id}`)}>
              Edit play
            </button>
          ) : null}
        </div>
      </section>

      <div className="detail-perf-row">
        <div className="perf-card">
          <div className="panel-title">Performance</div>
          <div className={`perf-big ${(winValue ?? 0) >= 0 ? 'pos' : 'neg'}`}>
            {winValue === null ? 'N/A' : fmtPct(winValue)}
          </div>
          <div className="perf-vs">
            {win === 'inception' && subInfo ? `since ${fmtSince(subInfo.inceptionDate)}` : winLabel(win)} ·
            vs {play.benchmark}
          </div>
          <Sparkline trend={(winValue ?? 0) >= 0 ? 'up' : 'down'} />
          <div className="windows-row">
            {(['1m', '3m', 'ytd', '1y', 'inception'] as Win[]).map((w) => {
              const v =
                w === 'inception'
                  ? subInfo
                    ? winValueFor(play.performance.ytd ?? 0, subInfo.inceptionDate)
                    : null
                  : play.performance[w as Exclude<Win, 'inception'>];
              const na = v == null;
              return (
                <button
                  key={w}
                  className={`window-btn${win === w ? ' active' : ''}${na ? ' na' : ''}`}
                  disabled={na}
                  onClick={() => !na && setWin(w)}
                >
                  <span className="win-label">{winLabel(w)}</span>
                  <span
                    className={`win-value ${v == null ? '' : v >= 0 ? 'pos' : 'neg'}`}
                  >
                    {v == null ? '—' : fmtPct(v)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Vs benchmark</div>
          <div className="perf-big pos" style={{ fontSize: 40 }}>
            {fmtPct(play.performance.vs_spy ?? 0)}
          </div>
          <div className="perf-vs">alpha vs {play.benchmark.split(' ')[0]}</div>
        </div>

        <div className="panel">
          <div className="panel-title">Community</div>
          <div className="perf-big" style={{ fontSize: 40 }}>
            {fmtCount(play.subscribers)}
          </div>
          <div className="perf-vs">subscribers · {fmtCount(play.followers)} following</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-title">Holdings ({play.holdings.length})</div>
        <table className="holdings-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th style={{ textAlign: 'right' }}>Weight</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Day</th>
              <th style={{ textAlign: 'right' }}>YTD</th>
            </tr>
          </thead>
          <tbody>
            {play.holdings.map((h) => {
              const s = getStock(h.ticker);
              return (
                <tr key={h.ticker} onClick={() => openStockPanel(h.ticker)}>
                  <td>
                    <div className="ticker-pill">
                      <span className="ticker-pill-sym">{h.ticker}</span>
                      <span className="ticker-pill-name">{s?.name ?? ''}</span>
                    </div>
                  </td>
                  <td className="num">
                    {h.weight}%
                    <div className="weight-bar">
                      <div className="weight-bar-fill" style={{ width: `${Math.min(100, h.weight * 2.5)}%` }} />
                    </div>
                  </td>
                  <td className="num">{s ? fmtUsd(s.price) : '—'}</td>
                  <td className={`num ${(s?.dayChg ?? 0) >= 0 ? 'pos' : 'neg'}`}>
                    {s ? fmtPct(s.dayChg ?? 0) : '—'}
                  </td>
                  <td className={`num ${(s?.ytd ?? 0) >= 0 ? 'pos' : 'neg'}`}>
                    {s ? fmtPct(s.ytd) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {play.updates.length ? (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-title">Updates</div>
          <div className="updates-list">
            {play.updates.map((u, i) => (
              <div key={i} className="update-item">
                <div className="update-date">{fmtDate(u.date)}</div>
                <div className="update-text">{u.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Discussion items={play.discussion} commentVotes={commentVotes} onVote={voteComment} />

      <SubscribeModal play={showSubscribe ? play : null} onClose={() => setShowSubscribe(false)} />
    </>
  );
}

function winLabel(w: Win): string {
  switch (w) {
    case '1m':
      return '1M';
    case '3m':
      return '3M';
    case 'ytd':
      return 'YTD';
    case '1y':
      return '1Y';
    case 'inception':
      return 'Inception';
  }
}

function winValueFor(ytd: number, inceptionISO: string): number {
  const days = Math.max(
    1,
    Math.floor((Date.now() - new Date(inceptionISO).getTime()) / 86_400_000)
  );
  return ytd * Math.min(1.2, days / 200);
}

interface DiscussionProps {
  items: DiscussionItem[];
  commentVotes: Record<string, 1 | -1>;
  onVote: (id: string, vote: 1 | -1) => void;
}

function Discussion({ items, commentVotes, onVote }: DiscussionProps) {
  if (items.length === 0) {
    return (
      <div className="panel">
        <div className="discussion-header">
          <h3>Discussion</h3>
        </div>
        <div className="empty-state">No comments yet. Be the first to start the thread.</div>
      </div>
    );
  }
  return (
    <div className="panel">
      <div className="discussion-header">
        <h3>Discussion · {items.length}</h3>
      </div>
      <div className="discussion-items">
        {items.map((it) => {
          const userVote = commentVotes[it.id] ?? 0;
          const score = it.upvotes - it.downvotes + (userVote as number);
          return (
            <div key={it.id} className={`disc-item${it.type === 'dissertation' ? ' dissertation' : ''}`}>
              <div className="vote-col">
                <button
                  className={`vote-arrow up${userVote === 1 ? ' active' : ''}`}
                  onClick={() => onVote(it.id, 1)}
                >
                  ▲
                </button>
                <span className="vote-count">{score}</span>
                <button
                  className={`vote-arrow down${userVote === -1 ? ' active' : ''}`}
                  onClick={() => onVote(it.id, -1)}
                >
                  ▼
                </button>
              </div>
              <div className="disc-body">
                <div className="disc-meta">
                  {it.type === 'dissertation' ? (
                    <span className="disc-type-pill">Dissertation</span>
                  ) : null}
                  {it.pinned ? <span className="pinned-badge">Pinned</span> : null}
                  <span className="author">{it.authorDisplay ?? it.author}</span>
                  {it.credentials ? <span className="credentials">{it.credentials}</span> : null}
                  <span>· {fmtRelative(it.date)}</span>
                </div>
                {it.title ? <div className="disc-title">{it.title}</div> : null}
                <div className="disc-text">{it.body}</div>
                <div className="disc-actions">
                  <a>Reply</a>
                  <a>Share</a>
                  <a>Report</a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
