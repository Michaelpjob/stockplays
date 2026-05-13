import { useEffect, useState } from 'react';
import { useAppState } from '../state/AppState';
import { isDemoMode } from '../lib/supabase';
import { updateProfile } from '../lib/profileQueries';
import { usePageTitle } from '../lib/usePageTitle';

export default function Settings() {
  const { user, prefs, setPref, isSignedIn, openAuthModal, signOut, refreshProfile } =
    useAppState();

  usePageTitle('Settings');

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio ?? '');
    }
  }, [user]);

  if (!isSignedIn || !user) {
    return (
      <>
        <div className="screen-header">
          <div>
            <h1>Settings</h1>
          </div>
        </div>
        <div className="empty-state">
          <button
            className="signin-prompt"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text)',
              textDecoration: 'underline',
            }}
            onClick={openAuthModal}
          >
            Sign in
          </button>{' '}
          to manage your settings.
        </div>
      </>
    );
  }

  const dirty =
    displayName.trim() !== user.displayName.trim() ||
    (bio.trim() || null) !== (user.bio?.trim() || null);

  async function save() {
    if (!user || isDemoMode) {
      setSavedAt(Date.now());
      return;
    }
    setSaving(true);
    setErr(null);
    const trimmed = displayName.trim();
    if (!trimmed) {
      setErr('Display name cannot be empty.');
      setSaving(false);
      return;
    }
    const result = await updateProfile(user.id, {
      display_name: trimmed,
      bio: bio.trim() || null,
    });
    setSaving(false);
    if (!result) {
      setErr('Could not save changes.');
      return;
    }
    await refreshProfile();
    setSavedAt(Date.now());
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">
            {isDemoMode
              ? 'Demo mode — changes save to your browser only.'
              : 'Manage your profile, notifications, and account.'}
          </p>
        </div>
      </div>

      <section className="settings-section">
        <h3>Profile</h3>

        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Display name</div>
            <div className="desc">Shown on your profile and across the site.</div>
          </div>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={48}
          />
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Handle</div>
            <div className="desc">Immutable. Used in @mentions and profile URLs.</div>
          </div>
          <span className="ticker-pill-sym">@{user.handle}</span>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Bio</div>
            <div className="desc">Short description shown on your profile.</div>
          </div>
          <textarea
            className="textarea"
            style={{ maxWidth: 420, minHeight: 60 }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
          />
        </div>

        {err ? <div className="disclaimer-note">{err}</div> : null}

        <div
          className="settings-row"
          style={{ borderBottom: 'none', justifyContent: 'flex-end', gap: 12 }}
        >
          {savedAt && Date.now() - savedAt < 4000 ? (
            <span style={{ color: 'var(--gain)', fontSize: 12.5, fontWeight: 600 }}>
              ✓ Saved
            </span>
          ) : null}
          <button
            className="btn btn-primary btn-flex-auto"
            onClick={save}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Email digest</div>
            <div className="desc">Daily digest of updates and new plays in followed categories.</div>
          </div>
          <button
            className={`toggle${prefs.emailDigest ? ' on' : ''}`}
            onClick={() => setPref('emailDigest', !prefs.emailDigest)}
            aria-pressed={prefs.emailDigest}
          />
        </div>
        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Reply notifications</div>
            <div className="desc">Email me when someone replies to my comment.</div>
          </div>
          <button
            className={`toggle${prefs.replyNotif ? ' on' : ''}`}
            onClick={() => setPref('replyNotif', !prefs.replyNotif)}
            aria-pressed={prefs.replyNotif}
          />
        </div>
        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Kudos milestone</div>
            <div className="desc">Email me when a comment hits 25 kudos.</div>
          </div>
          <button
            className={`toggle${prefs.kudosMilestone ? ' on' : ''}`}
            onClick={() => setPref('kudosMilestone', !prefs.kudosMilestone)}
            aria-pressed={prefs.kudosMilestone}
          />
        </div>
        <div className="tip">
          Notification preferences are stored locally for now — wired to the database in a
          follow-up. Email sending becomes active once digest fan-out lands.
        </div>
      </section>

      <section className="settings-section">
        <h3>Account</h3>
        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Sign out</div>
            <div className="desc">End this session.</div>
          </div>
          <button className="btn btn-flex-auto" onClick={signOut}>
            Sign out
          </button>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Delete account</div>
            <div className="desc">
              Permanent. Plays become read-only with author replaced by [removed].
              Subscriptions and engagement events are deleted.
            </div>
          </div>
          <button
            className="danger-btn"
            onClick={() =>
              alert(
                'Account deletion is not yet self-serve. Email michael.job.gb@gmail.com to request deletion.'
              )
            }
          >
            Delete account
          </button>
        </div>
      </section>
    </>
  );
}
