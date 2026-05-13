import { useAppState } from '../state/AppState';
import { isDemoMode } from '../lib/supabase';

export default function Settings() {
  const { user, prefs, setPref, isSignedIn, openAuthModal, signOut } = useAppState();

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
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline' }}
            onClick={openAuthModal}
          >
            Sign in
          </button>{' '}
          to manage your settings.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="screen-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">
            {isDemoMode
              ? 'Demo mode — changes are saved to your browser. Add Supabase env vars for real persistence.'
              : 'Manage your profile, notifications, and account.'}
          </p>
        </div>
      </div>

      <section className="settings-section">
        <h3>Profile</h3>
        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label">Display name</div>
            <div className="desc">Shown across the site.</div>
          </div>
          <input className="input" style={{ maxWidth: 320 }} defaultValue={user.displayName} />
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
            defaultValue={user.bio ?? ''}
          />
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
            </div>
          </div>
          <button className="danger-btn" onClick={() => alert('Not implemented in v0')}>
            Delete account
          </button>
        </div>
      </section>
    </>
  );
}
