import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Discover from './pages/Discover';
import PlayDetail from './pages/PlayDetail';
import Builder from './pages/Builder';
import MyPlays from './pages/MyPlays';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Setup from './pages/Setup';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Disclaimer from './pages/Disclaimer';
import NotFound from './pages/NotFound';

const SHOW_BUILDER = import.meta.env.VITE_SHOW_BUILDER === 'true';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Discover />} />
        <Route path="plays/:slug" element={<PlayDetail />} />
        <Route
          path="create"
          element={SHOW_BUILDER ? <Builder /> : <Navigate to="/" replace />}
        />
        <Route
          path="create/:editId"
          element={SHOW_BUILDER ? <Builder /> : <Navigate to="/" replace />}
        />
        <Route path="setup" element={<Setup />} />
        <Route path="me" element={<MyPlays />} />
        <Route path="me/watchlist" element={<Watchlist />} />
        <Route path="me/settings" element={<Settings />} />
        <Route path="u/:handle" element={<Profile />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="disclaimer" element={<Disclaimer />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
