import { supabase } from './supabase';
import type { Profile } from './types';

interface DbProfile {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar: string | null;
  website: string | null;
  x_handle: string | null;
  linkedin: string | null;
  karma: number;
  created_at: string;
}

function mapProfile(row: DbProfile): Profile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatar: row.avatar ?? initials(row.display_name || row.handle),
    joinedAt: row.created_at.slice(0, 10),
    website: row.website,
    x: row.x_handle,
    linkedin: row.linkedin,
    karma: row.karma,
  };
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '??'
  );
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, handle, display_name, bio, avatar, website, x_handle, linkedin, karma, created_at'
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('fetchProfile:', error.message);
    return null;
  }
  return data ? mapProfile(data as DbProfile) : null;
}

export async function fetchProfileByHandle(handle: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, handle, display_name, bio, avatar, website, x_handle, linkedin, karma, created_at'
    )
    .eq('handle', handle)
    .maybeSingle();
  if (error) {
    console.error('fetchProfileByHandle:', error.message);
    return null;
  }
  return data ? mapProfile(data as DbProfile) : null;
}

export interface ProfileSetupInput {
  handle: string;
  displayName: string;
  bio?: string;
}

/** Profile is considered "incomplete" if handle starts with `user_` (default from the trigger). */
export function isProfileIncomplete(profile: Profile | null): boolean {
  if (!profile) return true;
  return /^user_[a-f0-9]+$/i.test(profile.handle);
}

export async function isHandleAvailable(handle: string): Promise<boolean> {
  if (!supabase) return true;
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('handle', handle);
  if (error) return false;
  return (count ?? 0) === 0;
}

export async function updateProfile(
  userId: string,
  patch: Partial<{
    handle: string;
    display_name: string;
    bio: string | null;
    avatar: string | null;
    website: string | null;
    x_handle: string | null;
    linkedin: string | null;
  }>
): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select(
      'id, handle, display_name, bio, avatar, website, x_handle, linkedin, karma, created_at'
    )
    .single();
  if (error) {
    console.error('updateProfile:', error.message);
    return null;
  }
  return mapProfile(data as DbProfile);
}

export async function setupProfile(
  userId: string,
  input: ProfileSetupInput
): Promise<{ profile: Profile | null; error: string | null }> {
  const handle = input.handle.toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(handle)) {
    return {
      profile: null,
      error: 'Handle must be 3-24 chars: lowercase letters, digits, underscore.',
    };
  }
  const available = await isHandleAvailable(handle);
  if (!available) {
    return { profile: null, error: 'That handle is already taken.' };
  }
  const profile = await updateProfile(userId, {
    handle,
    display_name: input.displayName.trim(),
    bio: input.bio?.trim() || null,
    avatar: initials(input.displayName.trim() || handle),
  });
  return { profile, error: profile ? null : 'Failed to save profile.' };
}
