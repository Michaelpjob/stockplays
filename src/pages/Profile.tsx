import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PlayCard from '../components/PlayCard';
import SubscribeModal from '../components/SubscribeModal';
import { fmtDate } from '../lib/format';
import { useAppState } from '../state/AppState';
import { fetchProfileByHandle } from '../lib/profileQueries';
import { isDemoMode } from '../lib/supabase';
import { usePageTitle } from '../lib/usePageTitle';
import type { Play, Profile as ProfileT } from '../lib/types';

export default function Profile() {
  const { handle } = useParams();
  const { plays, user } = useAppState();
  const isOwn = user?.handle === handle;

  const [profile, setProfile] = useState<ProfileT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (isOwn && user) {
        setProfile(user);
        setLoading(false);
        return;
      }
      if (!handle) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (isDemoMode) {
        setProfile(firstAuthorFromPlays(plays, handle));
        setLoading(false);
        return;
      }
      const p = await fetchProfileByHandle(handle);
      if (cancelled) return;
      setProfile(p ?? firstAuthorFromPlays(plays, handle));
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [handle, isOwn, plays, user]);

  const userPlays = useMemo(
    () => plays.filter((p) => p.authorHandle === handle && p.status !== 'draft'),
    [plays, handle]
  );

  usePageTitle(profile ? `${profile.displayName} (@${profile.handle})` : null);

  const [subscribingTo, setSubscribingTo] = useState<Play | null>(null);

  if (loading) {
    return <div className="loading">Loading profile…</div>;
  }
  if (!profile) {
    return <div className="empty-state">User @{handle} not found.</div>;
  }

  const totalSubs = userPlays.reduce((a, p) => a + p.subscribers, 0);
  const isEditorial = profile.handle === 'editorial';

  return (
    <>
      <section className="profile-header">
        <div className="user-avatar lg">{profile.avatar}</div>
        <div className="profile-meta">
          <h2 className="profile-name">{profile.displayName}</h2>
          <div className="profile-handle-text">@{profile.handle}</div>
          {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
          {!isEditorial ? (
            <div className="profile-links">
              {profile.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              ) : null}
              {profile.x ? <a>{profile.x}</a> : null}
              {profile.linkedin ? <a>LinkedIn</a> : null}
            </div>
          ) : null}
          {!isOwn && !isEditorial ? (
            <div className="follow-actions">
              <button className="btn btn-primary btn-flex-auto">Follow</button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="profile-stats">
        <div className="profile-stat">
          <div className="stat-value">{userPlays.length}</div>
          <div className="stat-label">Plays</div>
        </div>
        <div className="profile-stat">
          <div className="stat-value">{totalSubs.toLocaleString()}</div>
          <div className="stat-label">Total subscribers</div>
        </div>
        <div className="profile-stat">
          <div className="stat-value">{profile.karma ?? 0}</div>
          <div className="stat-label">Karma</div>
        </div>
        <div className="profile-stat">
          <div className="stat-value" style={{ fontSize: 18 }}>
            {fmtDate(profile.joinedAt, { short: true })}
          </div>
          <div className="stat-label">Joined</div>
        </div>
      </section>

      <h3 style={{ margin: '24px 0 14px', fontSize: 15, fontWeight: 600 }}>
        {isEditorial ? 'Editorial plays' : `Plays by ${profile.displayName}`}
      </h3>
      {userPlays.length === 0 ? (
        <div className="empty-state">No published plays yet.</div>
      ) : (
        <div className="cards-grid">
          {userPlays.map((p) => (
            <PlayCard key={p.id} play={p} onSubscribeClick={setSubscribingTo} />
          ))}
        </div>
      )}

      <SubscribeModal play={subscribingTo} onClose={() => setSubscribingTo(null)} />
    </>
  );
}

function firstAuthorFromPlays(plays: Play[], handle: string): ProfileT | null {
  const p = plays.find((x) => x.authorHandle === handle);
  if (!p) return null;
  return {
    id: p.authorHandle,
    handle: p.authorHandle,
    displayName: p.author,
    avatar: initials(p.author),
    bio: null,
    joinedAt: p.created,
    karma: 240,
    website: null,
    x: null,
    linkedin: null,
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
