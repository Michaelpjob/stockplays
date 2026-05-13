export type Category =
  | 'AI'
  | 'Power'
  | 'Cyber'
  | 'Biotech'
  | 'Defense'
  | 'Industrial';

export const CATEGORIES: Category[] = [
  'AI',
  'Power',
  'Cyber',
  'Biotech',
  'Defense',
  'Industrial',
];

export type Rebalance =
  | 'Quarterly'
  | 'Monthly'
  | 'Threshold-triggered'
  | 'Manual';

export type PlayStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'revisions_requested'
  | 'rejected'
  | 'unpublished';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Profile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatar: string; // 1-2 letter initials displayed in the neon avatar
  joinedAt: string; // ISO date
  website?: string | null;
  x?: string | null;
  linkedin?: string | null;
  karma?: number;
}

export interface Holding {
  ticker: string;
  weight: number; // 0..100
}

export interface PlayPerformance {
  '1m'?: number;
  '3m'?: number;
  'ytd'?: number;
  '1y'?: number;
  'vs_spy'?: number; // headline vs-benchmark delta
}

export interface PlayUpdate {
  id?: string;
  date: string; // ISO date
  text: string;
}

export interface DiscussionItem {
  id: string;
  type: 'dissertation' | 'comment';
  author: string; // handle
  authorDisplay?: string;
  credentials?: string;
  pinned?: boolean;
  title?: string;
  body: string;
  date: string; // ISO date or relative string
  upvotes: number;
  downvotes: number;
  replies: number;
}

export interface Play {
  id: string;
  slug: string;
  name: string;
  category: Category;
  author: string;
  authorHandle: string;
  thesisShort: string;
  thesisLong: string;
  subscribers: number;
  created: string; // ISO date
  updated: string; // ISO date
  benchmark: string;
  rebalance: Rebalance;
  holdings: Holding[];
  performance: PlayPerformance;
  updates: PlayUpdate[];
  kudos: number;
  followers: number;
  discussion: DiscussionItem[];
  status?: PlayStatus;
}

export interface Stock {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry?: string;
  price: number;
  ytd: number;
  dayChg?: number;
  marketCap: number; // billions USD
  pe?: number | null;
  divYield?: number;
  w52H: number;
  w52L: number;
}

export interface SubscriptionDetails {
  inceptionDate: string; // ISO date
}
