import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Play, Profile } from '../lib/types';
import { SEED_PLAYS } from '../data/seedPlays';
import { isDemoMode } from '../lib/supabase';
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
  const [isSignedIn, setIsSignedIn] = useState<boolean>(initial?.isSignedIn ?? false);
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

  const user = isSignedIn ? DEMO_USER : null;

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

  const signIn = useCallback(() => {
    setIsSignedIn(true);
    setAuthModalOpen(false);
  }, []);
  const signOut = useCallback(() => setIsSignedIn(false), []);

  const subscribe = useCallback(
    (playId: string, inceptionDate: string) => {
      setSubscribed((prev) => new Set(prev).add(playId));
      setSubscriptionDetails((prev) => ({ ...prev, [playId]: { inceptionDate } }));
      setPlays((prev) =>
        prev.map((p) => (p.id === playId ? { ...p, subscribers: p.subscribers + 1 } : p))
      );
    },
    []
  );

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
  }, []);

  const makeToggle = (
    set: Set<string>,
    setter: (v: Set<string>) => void,
    counterKey?: 'kudos' | 'followers'
  ) => (playId: string) => {
    const isActive = set.has(playId);
    const next = new Set(set);
    if (isActive) next.delete(playId);
    else next.add(playId);
    setter(next);
    if (counterKey) {
      setPlays((prev) =>
        prev.map((p) => {
          if (p.id !== playId) return p;
          const delta = isActive ? -1 : 1;
          return { ...p, [counterKey]: Math.max(0, p[counterKey] + delta) };
        })
      );
    }
  };

  const toggleKudos = useCallback(
    (playId: string) => makeToggle(kudos, setKudos, 'kudos')(playId),
    [kudos]
  );
  const toggleFollow = useCallback(
    (playId: string) => makeToggle(follows, setFollows, 'followers')(playId),
    [follows]
  );
  const toggleSave = useCallback(
    (playId: string) => makeToggle(saves, setSaves)(playId),
    [saves]
  );

  const voteComment = useCallback((commentId: string, vote: 1 | -1) => {
    setCommentVotes((prev) => {
      const current = prev[commentId];
      const next = { ...prev };
      if (current === vote) {
        delete next[commentId];
      } else {
        next[commentId] = vote;
      }
      return next;
    });
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

  const value = useMemo<AppStateValue>(
    () => ({
      plays,
      user,
      isSignedIn,
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
    }),
    [
      plays,
      user,
      isSignedIn,
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
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
