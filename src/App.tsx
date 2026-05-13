import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Discover from './pages/Discover';
import PlayDetail from './pages/PlayDetail';
import Builder from './pages/Builder';
import MyPlays from './pages/MyPlays';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Discover />} />
        <Route path="plays/:slug" element={<PlayDetail />} />
        <Route path="create" element={<Builder />} />
        <Route path="create/:editId" element={<Builder />} />
        <Route path="me" element={<MyPlays />} />
        <Route path="me/watchlist" element={<Watchlist />} />
        <Route path="me/settings" element={<Settings />} />
        <Route path="u/:handle" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
