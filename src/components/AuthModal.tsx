import { useState } from 'react';
import { useAppState } from '../state/AppState';
import { isDemoMode, supabase } from '../lib/supabase';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, signIn } = useAppState();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (isDemoMode || !supabase) {
      signIn(email);
      return;
    }
    setWorking(true);
    try {
      if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Check your email to confirm your account.');
      }
      closeAuthModal();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setWorking(false);
    }
  }

  async function googleSignIn() {
    if (isDemoMode || !supabase) {
      signIn();
      return;
    }
    setWorking(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) setMsg(error.message);
    setWorking(false);
  }

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
            onClick={() => setTab('signin')}
          >
            Sign in
          </button>
          <button
            className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
            onClick={() => setTab('signup')}
          >
            Create account
          </button>
        </div>

        <button className="oauth-btn" onClick={googleSignIn} disabled={working}>
          <span className="oauth-icon">G</span>
          Continue with Google
        </button>

        <div className="auth-divider">or with email</div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="input"
              type="password"
              required
              minLength={isDemoMode ? 0 : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isDemoMode ? 'anything works in demo mode' : '••••••••'}
            />
          </div>
          {msg ? <div className="disclaimer-note">{msg}</div> : null}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={closeAuthModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={working}>
              {tab === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </form>

        {isDemoMode ? (
          <div className="magic-link-note">
            Running in demo mode — any email/password signs you in locally.
          </div>
        ) : (
          <div className="magic-link-note">
            <a>Forgot password?</a>
          </div>
        )}
      </div>
    </div>
  );
}
