import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppState';
import PlayCard from '../components/PlayCard';
import SubscribeModal from '../components/SubscribeModal';
import { usePageTitle } from '../lib/usePageTitle';
import type { Play } from '../lib/types';
import { Link } from 'react-router-dom';

type Tab = 'created' | 'subscribed' | 'drafts';

const SHOW_BUILDER = import.meta.env.VITE_SHOW_BUILDER === 'true';

export default function MyPlays() {
  const { plays, subscribed, createdByMe, isSignedIn, openAuthModal } = useAppState();
  const [tab, setTab] = useState<Tab>(SHOW_BUILDER ? 'created' : 'subscribed');
  const [subscribingTo, setSubscribingTo] = useState<Play | null>(null);

  usePageTitle('My Plays');

  const visible = useMemo(() => {
    if (tab === 'subscribed') return plays.filter((p) => subscribed.has(p.id));
    if (tab === 'drafts')
      return plays.filter((p) => createdByMe.has(p.id) && p.status === 'draft');
    return plays.filter((p) => createdByMe.has(p.id) && p.status !== 'draft');
  }, [plays, subscribed, createdByMe, tab]);

  if (!isSignedIn) {
    return (
      <>
        <div className="screen-header">
          <div>
            <h1>My Plays</h1>
            <p className="subtitle">Track plays you've created and ones you subscribe to.</p>
          </div>
        </div>
        <div className="empty-state">
          <p style={{ marginBottom: 12 }}>
            <button
              className="signin-prompt"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline' }}
              onClick={openAuthModal}
            >
              Sign in
            </button>{' '}
            to see plays you've created or subscribed to.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>My Plays</h1>
          <p className="subtitle">Track plays you've created and ones you subscribe to.</p>
        </div>
      </div>

      {SHOW_BUILDER ? (
        <div className="controls-row">
          {(['created', 'subscribed', 'drafts'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`chip${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'created' ? 'Created' : t === 'subscribed' ? 'Subscribed' : 'Drafts'}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="empty-state">
          {tab === 'created' ? (
            <>
              No plays yet.{' '}
              <Link to="/create" style={{ color: 'var(--text)' }}>
                Create your first
              </Link>
              .
            </>
          ) : tab === 'subscribed' ? (
            <>
              No subscriptions yet.{' '}
              <Link to="/" style={{ color: 'var(--text)' }}>
                Browse Discover
              </Link>
              .
            </>
          ) : (
            'No drafts.'
          )}
        </div>
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
