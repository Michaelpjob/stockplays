import { supabase } from './supabase';

export interface UserEngagement {
  subscribed: Map<string, { inceptionDate: string }>;
  kudos: Set<string>;
  follows: Set<string>;
  saves: Set<string>;
  commentVotes: Map<string, 1 | -1>;
}

const EMPTY: UserEngagement = {
  subscribed: new Map(),
  kudos: new Set(),
  follows: new Set(),
  saves: new Set(),
  commentVotes: new Map(),
};

export async function fetchUserEngagement(userId: string): Promise<UserEngagement> {
  if (!supabase) return EMPTY;

  const [subsR, kudosR, followsR, savesR, votesR] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('play_id, inception_date, status')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase.from('kudos').select('play_id').eq('user_id', userId),
    supabase.from('follows').select('play_id').eq('user_id', userId),
    supabase.from('saves').select('play_id').eq('user_id', userId),
    supabase.from('comment_votes').select('comment_id, vote').eq('user_id', userId),
  ]);

  const subscribed = new Map<string, { inceptionDate: string }>();
  for (const row of subsR.data ?? []) {
    subscribed.set(row.play_id as string, {
      inceptionDate: (row.inception_date as string).slice(0, 10),
    });
  }
  const kudos = new Set<string>((kudosR.data ?? []).map((r) => r.play_id as string));
  const follows = new Set<string>((followsR.data ?? []).map((r) => r.play_id as string));
  const saves = new Set<string>((savesR.data ?? []).map((r) => r.play_id as string));
  const commentVotes = new Map<string, 1 | -1>();
  for (const row of votesR.data ?? []) {
    commentVotes.set(row.comment_id as string, row.vote as 1 | -1);
  }
  return { subscribed, kudos, follows, saves, commentVotes };
}

export async function dbSubscribe(
  userId: string,
  playId: string,
  inceptionDate: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'no client' };
  // Use upsert in case there's a cancelled row from before.
  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      play_id: playId,
      inception_date: inceptionDate,
      status: 'active',
      cancelled_at: null,
    },
    { onConflict: 'user_id,play_id' }
  );
  return { error: error?.message ?? null };
}

export async function dbUnsubscribe(
  userId: string,
  playId: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'no client' };
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('play_id', playId)
    .eq('status', 'active');
  return { error: error?.message ?? null };
}

async function toggleRow(
  table: 'kudos' | 'follows' | 'saves',
  userId: string,
  playId: string,
  shouldExist: boolean
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'no client' };
  if (shouldExist) {
    const { error } = await supabase
      .from(table)
      .insert({ user_id: userId, play_id: playId });
    if (error && !error.message.includes('duplicate')) return { error: error.message };
    return { error: null };
  } else {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
      .eq('play_id', playId);
    return { error: error?.message ?? null };
  }
}

export const dbToggleKudos = (u: string, p: string, on: boolean) =>
  toggleRow('kudos', u, p, on);
export const dbToggleFollow = (u: string, p: string, on: boolean) =>
  toggleRow('follows', u, p, on);
export const dbToggleSave = (u: string, p: string, on: boolean) =>
  toggleRow('saves', u, p, on);

export async function dbVoteComment(
  userId: string,
  commentId: string,
  vote: 1 | -1 | null
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'no client' };
  if (vote === null) {
    const { error } = await supabase
      .from('comment_votes')
      .delete()
      .eq('user_id', userId)
      .eq('comment_id', commentId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from('comment_votes').upsert(
    { user_id: userId, comment_id: commentId, vote },
    { onConflict: 'user_id,comment_id' }
  );
  return { error: error?.message ?? null };
}
