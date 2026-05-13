import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { isHandleAvailable, setupProfile } from '../lib/profileQueries';

export default function Setup() {
  const navigate = useNavigate();
  const { user, isSignedIn, refreshProfile, profileNeedsSetup } = useAppState();
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [check, setCheck] = useState<'ok' | 'bad' | 'checking' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // If user is already set up, don't keep them here.
  useEffect(() => {
    if (isSignedIn && !profileNeedsSetup && user) {
      navigate('/me', { replace: true });
    }
  }, [isSignedIn, profileNeedsSetup, user, navigate]);

  useEffect(() => {
    if (!user) return;
    if (!displayName && user.displayName) setDisplayName(user.displayName);
  }, [user, displayName]);

  // Live handle availability check.
  useEffect(() => {
    const h = handle.trim().toLowerCase();
    setError(null);
    if (!h) {
      setCheck(null);
      return;
    }
    if (!/^[a-z0-9_]{3,24}$/.test(h)) {
      setCheck('bad');
      return;
    }
    setCheck('checking');
    let cancelled = false;
    const id = setTimeout(async () => {
      const ok = await isHandleAvailable(h);
      if (!cancelled) setCheck(ok ? 'ok' : 'bad');
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [handle]);

  if (!isSignedIn || !user) {
    return (
      <div className="empty-state" style={{ marginTop: 64 }}>
        You need to sign in first.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !user) return;
    setError(null);
    if (check !== 'ok') {
      setError('Pick an available handle.');
      return;
    }
    setSaving(true);
    const { error: err } = await setupProfile(user.id, {
      handle: handle.trim().toLowerCase(),
      displayName: displayName.trim(),
      bio: bio.trim(),
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    await refreshProfile();
    navigate('/me', { replace: true });
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Finish your profile</h1>
          <p className="subtitle">
            Pick a handle (used in your profile URL and @mentions). You can edit your display
            name and bio later — the handle is permanent.
          </p>
        </div>
      </div>

      <form onSubmit={submit} style={{ maxWidth: 520 }}>
        <section className="settings-section">
          <div className="form-group">
            <label className="form-label">Handle</label>
            <input
              className="input"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/\s/g, '').toLowerCase())}
              placeholder="e.g. yourname"
              autoFocus
              autoCapitalize="off"
              autoComplete="off"
              maxLength={24}
            />
            <div
              className={`handle-check ${
                check === 'ok'
                  ? 'ok'
                  : check === 'bad'
                  ? 'bad'
                  : check === 'checking'
                  ? 'checking'
                  : ''
              }`}
            >
              {check === 'ok' && '✓ available'}
              {check === 'bad' &&
                (handle.match(/^[a-z0-9_]{3,24}$/)
                  ? '✗ taken'
                  : '3–24 lowercase letters, digits, underscore')}
              {check === 'checking' && 'checking…'}
              {check === null && <span>&nbsp;</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Display name</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name as it appears across the site"
              required
              maxLength={48}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bio (optional)</label>
            <textarea
              className="textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short description shown on your profile."
              maxLength={280}
              style={{ minHeight: 80 }}
            />
            <div className="tip">{bio.length} / 280</div>
          </div>

          {error ? <div className="disclaimer-note">{error}</div> : null}

          <div className="modal-actions" style={{ marginTop: 18 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || check !== 'ok' || !displayName.trim()}
            >
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </section>
      </form>
    </>
  );
}
