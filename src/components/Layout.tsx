import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppState } from '../state/AppState';
import AuthModal from './AuthModal';
import StockPanel from './StockPanel';

const SHOW_BUILDER = import.meta.env.VITE_SHOW_BUILDER === 'true';

export default function Layout() {
  const { isSignedIn, user, signOut, openAuthModal, stockPanelTicker } = useAppState();
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

        <div key={location.pathname}>
          <Outlet />
        </div>
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
