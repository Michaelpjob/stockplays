import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppState } from '../state/AppState';
import AuthModal from './AuthModal';
import StockPanel from './StockPanel';

const SHOW_BUILDER = import.meta.env.VITE_SHOW_BUILDER === 'true';

export default function Layout() {
  const {
    isSignedIn,
    user,
    signOut,
    openAuthModal,
    stockPanelTicker,
    profileNeedsSetup,
  } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">Plays</div>

        <div className="nav-section">Browse</div>
        <SideLink to="/" icon="⊞" label="Discover" exact />
        <SideLink to="/me" icon="★" label="My Plays" />
        <SideLink to="/me/watchlist" icon="◐" label="Watchlist" />

        {SHOW_BUILDER ? (
          <>
            <div className="nav-section">Build</div>
            <SideLink to="/create" icon="+" label="Create a Play" />
          </>
        ) : null}

        <div className="nav-section">Account</div>
        <SideLink to="/me/settings" icon="⚙" label="Settings" />

        {SHOW_BUILDER ? (
          <button
            className="nav-cta"
            onClick={() => {
              if (isSignedIn) navigate('/create');
              else openAuthModal();
            }}
          >
            + New Play
          </button>
        ) : null}
      </nav>

      <main>
        <div className="top-header">
          {isSignedIn && user ? (
            <>
              <button
                className="user-menu"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-expanded={dropdownOpen}
              >
                <span className="user-avatar">{user.avatar}</span>
                <span className="user-handle">
                  {user.displayName}
                  <small>@{user.handle}</small>
                </span>
              </button>
              {dropdownOpen ? (
                <div className="user-dropdown" onMouseLeave={() => setDropdownOpen(false)}>
                  <a onClick={() => { setDropdownOpen(false); navigate(`/u/${user.handle}`); }}>Profile</a>
                  <a onClick={() => { setDropdownOpen(false); navigate('/me'); }}>My Plays</a>
                  <a onClick={() => { setDropdownOpen(false); navigate('/me/settings'); }}>Settings</a>
                  <hr />
                  <a
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                      navigate('/');
                    }}
                  >
                    Sign out
                  </a>
                </div>
              ) : null}
            </>
          ) : (
            <button className="signin-btn" onClick={openAuthModal}>
              Sign in
            </button>
          )}
        </div>

        {profileNeedsSetup && location.pathname !== '/setup' ? (
          <div
            className="approval-banner"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/setup')}
          >
            <span style={{ flex: 1 }}>
              Finish setting up your profile — pick a handle to be visible across the site.
            </span>
            <span style={{ color: 'var(--neon)', fontWeight: 600 }}>Set up →</span>
          </div>
        ) : null}

        <div key={location.pathname}>
          <Outlet />
        </div>

        <footer className="site-footer">
          <div className="footer-disclaimer">
            Plays publishes thematic stock bundles for informational and educational purposes
            only. Nothing on this site is investment advice. Past performance does not predict
            future results. See the{' '}
            <NavLink to="/disclaimer">Disclaimer</NavLink> for details.
          </div>
          <div>© {new Date().getFullYear()} Plays</div>
          <div className="footer-links">
            <NavLink to="/terms">Terms</NavLink>
            <NavLink to="/privacy">Privacy</NavLink>
            <NavLink to="/disclaimer">Disclaimer</NavLink>
          </div>
        </footer>
      </main>

      <AuthModal />
      {stockPanelTicker ? <StockPanel /> : null}
    </div>
  );
}

function SideLink({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: string;
  label: string;
  exact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <span className="nav-icon">{icon}</span>
      {label}
    </NavLink>
  );
}
