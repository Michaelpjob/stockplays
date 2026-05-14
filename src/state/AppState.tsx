import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Play, Profile, Stock } from '../lib/types';
import { SEED_PLAYS } from '../data/seedPlays';
import { STOCK_UNIVERSE } from '../data/stockUniverse';
import { isDemoMode, supabase } from '../lib/supabase';
import { fetchPlays } from '../lib/playQueries';
import { fetchAllStocks } from '../lib/stockQueries';
import { fetchProfile, isProfileIncomplete } from '../lib/profileQueries';
import {
  dbSubscribe,
  dbToggleFollow,
  dbToggleKudos,
  dbToggleSave,
  dbUnsubscribe,
  dbVoteComment,
  fetchUserEngagement,
} from '../lib/engagementQueries';
import { today } from '../lib/format';

const DEMO_USER: Profile = {
  id: 'demo-user',
  handle: 'demo',
  displayName: 'Demo User',
  bio: 'You are signed in as a demo user. Add Supabase env vars to enable real auth and persistence.',
  avatar: 'DU',
  joinedAt: '2026-05-13',
  website: '',
  x: '',
  karma: 240,
};

interface SubInfo {
  inceptionDate: string;
}

interface UserPrefs {
  emailDigest: boolean;
  replyNotif: boolean;
  kudosMilestone: boolean;
}

const DEFAULT_PREFS: UserPrefs = {
  emailDigest: true,
  replyNotif: true,
  kudosMilestone: false,
};

interface AppStateValue {
  plays: Play[];
  user: Profile | null;
  isSignedIn: boolean;
  authPending: boolean;
  profileNeedsSetup: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email?: string) => void;
  signOut: () => void;

  subscribed: Set<string>;
  subscriptionDetails: Record<string, SubInfo>;
  subscribe: (playId: string, inceptionDate: string) => void;
  unsubscribe: (playId: string) => void;

  kudos: Set<string>;
  follows: Set<string>;
  saves: Set<string>;
  toggleKudos: (playId: string) => void;
  toggleFollow: (playId: string) => void;
  toggleSave: (playId: string) => void;

  commentVotes: Record<string, 1 | -1>;
  voteComment: (commentId: string, vote: 1 | -1) => void;

  createdByMe: Set<string>;
  upsertPlay: (play: Play) => void;

  prefs: UserPrefs;
  setPref: <K extends keyof UserPrefs>(k: K, v: UserPrefs[K]) => void;

  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  stockPanelTicker: string | null;
  openStockPanel: (ticker: string) => void;
  closeStockPanel: () => void;

  /** Real-time DB-backed stocks map. Falls back to seeded universe in demo mode. */
  stocksByTicker: Record<string, Stock>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const LS_KEY = 'plays.demoState.v1';

function loadDemo() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      isSignedIn: boolean;
      subscribed: string[];
      subscriptionDetails: Record<string, SubInfo>;
      kudos: string[];
      follows: string[];
      saves: string[];
      commentVotes: Record<string, 1 | -1>;
      createdByMe: string[];
      prefs: UserPrefs;
    };
  } catch {
    return null;
  }
}

function saveDemo(s: {
  isSignedIn: boolean;
  subscribed: Set<string>;
  subscriptionDetails: Record<string, SubInfo>;
  kudos: Set<string>;
  follows: Set<string>;
  saves: Set<string>;
  commentVotes: Record<string, 1 | -1>;
  createdByMe: Set<string>;
  prefs: UserPrefs;
}) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        isSignedIn: s.isSignedIn,
        subscribed: [...s.subscribed],
        subscriptionDetails: s.subscriptionDetails,
        kudos: [...s.kudos],
        follows: [...s.follows],
        saves: [...s.saves],
        commentVotes: s.commentVotes,
        createdByMe: [...s.createdByMe],
        prefs: s.prefs,
      })
    );
  } catch {
    /* ignore */
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const initial = isDemoMode ? loadDemo() : null;

  const [plays, setPlays] = useState<Play[]>(SEED_PLAYS);

  const [user, setUser] = useState<Profile | null>(
    isDemoMode && initial?.isSignedIn ? DEMO_USER : null
  );
  const [isSignedIn, setIsSignedIn] = useState<boolean>(
    isDemoMode ? !!initial?.isSignedIn : false
  );
  const [authPending, setAuthPending] = useState<boolean>(!isDemoMode);

  const [subscribed, setSubscribed] = useState<Set<string>>(
    new Set(initial?.subscribed ?? [])
  );
  const [subscriptionDetails, setSubscriptionDetails] = useState<Record<string, SubInfo>>(
    initial?.subscriptionDetails ?? {}
  );
  const [kudos, setKudos] = useState<Set<string>>(new Set(initial?.kudos ?? []));
  const [follows, setFollows] = useState<Set<string>>(new Set(initial?.follows ?? []));
  const [saves, setSaves] = useState<Set<string>>(new Set(initial?.saves ?? []));
  const [commentVotes, setCommentVotes] = useState<Record<string, 1 | -1>>(
    initial?.commentVotes ?? {}
  );
  const [createdByMe, setCreatedByMe] = useState<Set<string>>(
    new Set(initial?.createdByMe ?? [])
  );
  const [prefs, setPrefs] = useState<UserPrefs>(initial?.prefs ?? DEFAULT_PREFS);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [stockPanelTicker, setStockPanelTicker] = useState<string | null>(null);

  // Stocks map: seeded with the static universe so demo mode + initial render
  // both have data. Replaced by the DB snapshot once Supabase responds.
  const [stocksByTicker, setStocksByTicker] = useState<Record<string, Stock>>(
    () => ({ ...STOCK_UNIVERSE })
  );

  useEffect(() => {
    if (isDemoMode) return;
    let cancelled = false;
    fetchAllStocks().then((rows) => {
      if (cancelled || rows.length === 0) return;
      const map: Record<string, Stock> = {};
      for (const s of rows) map[s.ticker] = s;
      setStocksByTicker(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track current user id in a ref so async writes use the latest value.
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  // ── Load plays from Supabase (replaces seed if available) ────────────
  useEffect(() => {
    if (isDemoMode) return;
    let cancelled = false;
    fetchPlays().then((rows) => {
      if (cancelled) return;
      if (rows.length > 0) setPlays(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Auth: Supabase session + listener ────────────────────────────────
  useEffect(() => {
    if (isDemoMode || !supabase) {
      setAuthPending(false);
      return;
    }
    let cancelled = false;

    async function load(userId: string) {
      const [profile, eng] = await Promise.all([
        fetchProfile(userId),
        fetchUserEngagement(userId),
      ]);
      if (cancelled) return;
      if (profile) setUser(profile);
      else setUser({ ...DEMO_USER, id: userId, handle: `user_${userId.slice(0, 8)}` });
      setIsSignedIn(true);
      const subDetails: Record<string, SubInfo> = {};
      eng.subscribed.forEach((v, k) => {
        subDetails[k] = v;
      });
      setSubscribed(new Set(eng.subscribed.keys()));
      setSubscriptionDetails(subDetails);
      setKudos(eng.kudos);
      setFollows(eng.follows);
      setSaves(eng.saves);
      const votes: Record<string, 1 | -1> = {};
      eng.commentVotes.forEach((v, k) => {
        votes[k] = v;
      });
      setCommentVotes(votes);
      setAuthPending(false);
    }

    function clear() {
      setUser(null);
      setIsSignedIn(false);
      setSubscribed(new Set());
      setSubscriptionDetails({});
      setKudos(new Set());
      setFollows(new Set());
      setSaves(new Set());
      setCommentVotes({});
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) load(session.user.id);
      else setAuthPending(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        load(session.user.id);
        setAuthModalOpen(false);
      } else if (event === 'SIGNED_OUT') {
        clear();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Don't re-fetch on refresh; we already have the data.
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ── Persist demo state to localStorage ───────────────────────────────
  useEffect(() => {
    if (!isDemoMode) return;
    saveDemo({
      isSignedIn,
      subscribed,
      subscriptionDetails,
      kudos,
      follows,
      saves,
      commentVotes,
      createdByMe,
      prefs,
    });
  }, [
    isSignedIn,
    subscribed,
    subscriptionDetails,
    kudos,
    follows,
    saves,
    commentVotes,
    createdByMe,
    prefs,
  ]);

  const refreshProfile = useCallback(async () => {
    if (isDemoMode || !supabase || !userIdRef.current) return;
    const profile = await fetchProfile(userIdRef.current);
    if (profile) setUser(profile);
  }, []);

  const signIn = useCallback(() => {
    if (isDemoMode) {
      setUser(DEMO_USER);
      setIsSignedIn(true);
      setAuthModalOpen(false);
    }
    // In Supabase mode the AuthModal calls supabase.auth.signInWithPassword
    // and onAuthStateChange takes care of state updates.
  }, []);

  const signOut = useCallback(() => {
    if (isDemoMode || !supabase) {
      setUser(null);
      setIsSignedIn(false);
      return;
    }
    supabase.auth.signOut();
  }, []);

  // ── Engagement actions: optimistic UI + best-effort DB write ─────────
  const subscribe = useCallback((playId: string, inceptionDate: string) => {
    setSubscribed((prev) => new Set(prev).add(playId));
    setSubscriptionDetails((prev) => ({ ...prev, [playId]: { inceptionDate } }));
    setPlays((prev) =>
      prev.map((p) => (p.id === playId ? { ...p, subscribers: p.subscribers + 1 } : p))
    );
    if (!isDemoMode && userIdRef.current) {
      dbSubscribe(userIdRef.current, playId, inceptionDate).then(({ error }) => {
        if (error) console.error('subscribe:', error);
      });
    }
  }, []);

  const unsubscribe = useCallback((playId: string) => {
    setSubscribed((prev) => {
      const next = new Set(prev);
      next.delete(playId);
      return next;
    });
    setSubscriptionDetails((prev) => {
      const next = { ...prev };
      delete next[playId];
      return next;
    });
    setPlays((prev) =>
      prev.map((p) =>
        p.id === playId ? { ...p, subscribers: Math.max(0, p.subscribers - 1) } : p
      )
    );
    if (!isDemoMode && userIdRef.current) {
      dbUnsubscribe(userIdRef.current, playId).then(({ error }) => {
        if (error) console.error('unsubscribe:', error);
      });
    }
  }, []);

  function makeToggle(
    has: (s: Set<string>, id: string) => boolean,
    counterKey: 'kudos' | 'followers' | null,
    dbFn: (u: string, p: string, on: boolean) => Promise<{ error: string | null }>
  ) {
    return (
      set: Set<string>,
      setter: (v: Set<string>) => void,
      playId: string
    ) => {
      const wasActive = has(set, playId);
      const next = new Set(set);
      if (wasActive) next.delete(playId);
      else next.add(playId);
      setter(next);
      if (counterKey) {
        setPlays((prev) =>
          prev.map((p) => {
            if (p.id !== playId) return p;
            const delta = wasActive ? -1 : 1;
            return { ...p, [counterKey]: Math.max(0, p[counterKey] + delta) };
          })
        );
      }
      if (!isDemoMode && userIdRef.current) {
        dbFn(userIdRef.current, playId, !wasActive).then(({ error }) => {
          if (error) console.error(error);
        });
      }
    };
  }

  const kToggle = makeToggle((s, id) => s.has(id), 'kudos', dbToggleKudos);
  const fToggle = makeToggle((s, id) => s.has(id), 'followers', dbToggleFollow);
  const sToggle = makeToggle((s, id) => s.has(id), null, dbToggleSave);

  const toggleKudos = useCallback(
    (playId: string) => kToggle(kudos, setKudos, playId),
    [kudos] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const toggleFollow = useCallback(
    (playId: string) => fToggle(follows, setFollows, playId),
    [follows] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const toggleSave = useCallback(
    (playId: string) => sToggle(saves, setSaves, playId),
    [saves] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const voteComment = useCallback((commentId: string, vote: 1 | -1) => {
    let newVote: 1 | -1 | null = vote;
    setCommentVotes((prev) => {
      const current = prev[commentId];
      const next = { ...prev };
      if (current === vote) {
        delete next[commentId];
        newVote = null;
      } else {
        next[commentId] = vote;
      }
      return next;
    });
    if (!isDemoMode && userIdRef.current) {
      dbVoteComment(userIdRef.current, commentId, newVote).then(({ error }) => {
        if (error) console.error('voteComment:', error);
      });
    }
  }, []);

  const upsertPlay = useCallback((play: Play) => {
    setPlays((prev) => {
      const existing = prev.findIndex((p) => p.id === play.id);
      if (existing >= 0) {
        const copy = prev.slice();
        copy[existing] = { ...play, updated: today() };
        return copy;
      }
      return [{ ...play, created: today(), updated: today() }, ...prev];
    });
    setCreatedByMe((prev) => new Set(prev).add(play.id));
  }, []);

  const setPref: AppStateValue['setPref'] = useCallback((k, v) => {
    setPrefs((prev) => ({ ...prev, [k]: v }));
  }, []);

  const profileNeedsSetup = useMemo(
    () => !isDemoMode && isSignedIn && isProfileIncomplete(user),
    [isSignedIn, user]
  );

  const value = useMemo<AppStateValue>(
    () => ({
      plays,
      user,
      isSignedIn,
      authPending,
      profileNeedsSetup,
      refreshProfile,
      signIn,
      signOut,
      subscribed,
      subscriptionDetails,
      subscribe,
      unsubscribe,
      kudos,
      follows,
      saves,
      toggleKudos,
      toggleFollow,
      toggleSave,
      commentVotes,
      voteComment,
      createdByMe,
      upsertPlay,
      prefs,
      setPref,
      authModalOpen,
      openAuthModal: () => setAuthModalOpen(true),
      closeAuthModal: () => setAuthModalOpen(false),
      stockPanelTicker,
      openStockPanel: setStockPanelTicker,
      closeStockPanel: () => setStockPanelTicker(null),
      stocksByTicker,
    }),
    [
      plays,
      user,
      isSignedIn,
      authPending,
      profileNeedsSetup,
      refreshProfile,
      signIn,
      signOut,
      subscribed,
      subscriptionDetails,
      subscribe,
      unsubscribe,
      kudos,
      follows,
      saves,
      toggleKudos,
      toggleFollow,
      toggleSave,
      commentVotes,
      voteComment,
      createdByMe,
      upsertPlay,
      prefs,
      setPref,
      authModalOpen,
      stockPanelTicker,
      stocksByTicker,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
