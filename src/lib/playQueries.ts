import { supabase } from './supabase';
import type {
  Category,
  DiscussionItem,
  Holding,
  Play,
  PlayPerformance,
  PlayStatus,
  PlayUpdate,
  Rebalance,
} from './types';

// Row shapes returned by `select(*, author:..., holdings:..., updates:..., discussion:...)`
interface DbPlayRow {
  id: string;
  slug: string;
  name: string;
  category: Category;
  author_id: string;
  thesis_short: string;
  thesis_long: string;
  benchmark: string;
  rebalance: Rebalance;
  status: PlayStatus;
  subscribers: number;
  kudos: number;
  followers: number;
  created_at: string;
  updated_at: string;
  performance: PlayPerformance | null;
  author?: {
    handle: string;
    display_name: string;
  } | null;
  holdings?: { ticker: string; weight: number }[] | null;
  updates?: { id: string; body: string; posted_at: string }[] | null;
  discussion?: {
    id: string;
    type: 'comment' | 'dissertation';
    body: string;
    title: string | null;
    pinned: boolean;
    upvotes: number;
    downvotes: number;
    reply_count: number;
    created_at: string;
    author?: { handle: string; display_name: string } | null;
  }[] | null;
}

function mapPlay(row: DbPlayRow): Play {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    author: row.author?.display_name ?? 'Unknown',
    authorHandle: row.author?.handle ?? '',
    thesisShort: row.thesis_short,
    thesisLong: row.thesis_long,
    subscribers: row.subscribers,
    created: row.created_at.slice(0, 10),
    updated: row.updated_at.slice(0, 10),
    benchmark: row.benchmark,
    rebalance: row.rebalance,
    holdings: (row.holdings ?? []).map(
      (h): Holding => ({ ticker: h.ticker, weight: Number(h.weight) })
    ),
    performance: row.performance ?? {},
    updates: (row.updates ?? [])
      .map((u): PlayUpdate => ({
        id: u.id,
        date: u.posted_at.slice(0, 10),
        text: u.body,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    kudos: row.kudos,
    followers: row.followers,
    discussion: (row.discussion ?? [])
      .map(
        (d): DiscussionItem => ({
          id: d.id,
          type: d.type,
          author: d.author?.handle ?? '',
          authorDisplay: d.author?.display_name,
          credentials: undefined,
          pinned: d.pinned,
          title: d.title ?? undefined,
          body: d.body,
          date: d.created_at,
          upvotes: d.upvotes,
          downvotes: d.downvotes,
          replies: d.reply_count,
        })
      )
      .sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false)),
    status: row.status,
  };
}

const PLAYS_SELECT = `
  id, slug, name, category, author_id, thesis_short, thesis_long, benchmark,
  rebalance, status, subscribers, kudos, followers, created_at, updated_at, performance,
  author:profiles!plays_author_id_fkey(handle, display_name),
  holdings:play_holdings(ticker, weight),
  updates:play_updates(id, body, posted_at),
  discussion:discussion_items(id, type, body, title, pinned, upvotes, downvotes, reply_count, created_at, author:profiles!discussion_items_author_id_fkey(handle, display_name))
`;

export async function fetchPlays(): Promise<Play[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('plays')
    .select(PLAYS_SELECT)
    .in('status', ['approved', 'unpublished']);
  if (error) {
    console.error('fetchPlays:', error.message);
    return [];
  }
  return (data ?? []).map((row) => mapPlay(row as unknown as DbPlayRow));
}

export async function fetchPlayBySlug(slug: string): Promise<Play | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('plays')
    .select(PLAYS_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('fetchPlayBySlug:', error.message);
    return null;
  }
  return data ? mapPlay(data as unknown as DbPlayRow) : null;
}
