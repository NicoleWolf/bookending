import type { ProductStatus, OrderStatus } from './types';

export const PRODUCT_STATUS_TONE: Record<ProductStatus, 'good' | 'neutral' | 'accent' | 'danger' | 'paper'> = {
  live: 'good', draft: 'paper', 'low-stock': 'accent', 'sold-out': 'danger', 'pre-order': 'neutral',
};

export const ORDER_STATUS_TONE: Record<OrderStatus, 'good' | 'neutral' | 'accent' | 'danger' | 'paper'> = {
  new: 'accent', processing: 'neutral', shipped: 'neutral', delivered: 'good', refunded: 'danger',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', refunded: 'Refunded',
};

export const REVENUE_SERIES: { current: number[]; prev: number[] } = { current: [], prev: [] };

export const GEOGRAPHY: { country: string; pct: number; orders: number }[] = [];

export const FUNNEL = { visitors: 0, productViews: 0, cartAdds: 0, checkouts: 0 };

export const REPEAT_RATE = { rate: 0, repeatOrders: 0 };

// ── Engagement data ───────────────────────────────────────────────

export interface EngagementPoint {
  date:      string;  // "YYYY-MM-DD"
  revenue:   number;  // daily $ sales
  reviews:   number;  // new reviews
  qa:        number;  // Q&A replies
  followers: number;  // net new followers
  note?:     string;  // contextual event label
}

// 30 days ending 2026-05-24 — tells the story of a launch
export const ENGAGEMENT_DATA: EngagementPoint[] = [
  { date: '2026-04-25', revenue: 0,   reviews: 0, qa: 0, followers: 1 },
  { date: '2026-04-26', revenue: 0,   reviews: 0, qa: 1, followers: 0 },
  { date: '2026-04-27', revenue: 0,   reviews: 0, qa: 0, followers: 2 },
  { date: '2026-04-28', revenue: 0,   reviews: 0, qa: 0, followers: 0 },
  { date: '2026-04-29', revenue: 0,   reviews: 0, qa: 1, followers: 1 },
  { date: '2026-04-30', revenue: 0,   reviews: 0, qa: 0, followers: 0 },
  { date: '2026-05-01', revenue: 0,   reviews: 0, qa: 2, followers: 9,  note: 'ARC batch sent' },
  { date: '2026-05-02', revenue: 0,   reviews: 1, qa: 1, followers: 4 },
  { date: '2026-05-03', revenue: 0,   reviews: 0, qa: 0, followers: 3 },
  { date: '2026-05-04', revenue: 0,   reviews: 2, qa: 2, followers: 5 },
  { date: '2026-05-05', revenue: 0,   reviews: 1, qa: 1, followers: 2 },
  { date: '2026-05-06', revenue: 0,   reviews: 0, qa: 0, followers: 4 },
  { date: '2026-05-07', revenue: 0,   reviews: 2, qa: 1, followers: 3 },
  { date: '2026-05-08', revenue: 0,   reviews: 1, qa: 2, followers: 2 },
  { date: '2026-05-09', revenue: 385, reviews: 5, qa: 3, followers: 14, note: 'Book launched' },
  { date: '2026-05-10', revenue: 220, reviews: 3, qa: 2, followers: 7 },
  { date: '2026-05-11', revenue: 185, reviews: 2, qa: 1, followers: 5 },
  { date: '2026-05-12', revenue: 160, reviews: 1, qa: 1, followers: 4 },
  { date: '2026-05-13', revenue: 125, reviews: 2, qa: 2, followers: 3 },
  { date: '2026-05-14', revenue: 95,  reviews: 1, qa: 1, followers: 18, note: 'Featured in newsletter' },
  { date: '2026-05-15', revenue: 240, reviews: 3, qa: 3, followers: 8 },
  { date: '2026-05-16', revenue: 195, reviews: 2, qa: 1, followers: 5 },
  { date: '2026-05-17', revenue: 155, reviews: 1, qa: 2, followers: 4 },
  { date: '2026-05-18', revenue: 130, reviews: 2, qa: 0, followers: 3 },
  { date: '2026-05-19', revenue: 145, reviews: 1, qa: 1, followers: 5 },
  { date: '2026-05-20', revenue: 160, reviews: 2, qa: 2, followers: 4 },
  { date: '2026-05-21', revenue: 140, reviews: 1, qa: 1, followers: 3 },
  { date: '2026-05-22', revenue: 115, reviews: 1, qa: 0, followers: 2 },
  { date: '2026-05-23', revenue: 130, reviews: 2, qa: 1, followers: 4 },
  { date: '2026-05-24', revenue: 65,  reviews: 0, qa: 0, followers: 2 },
];

export const STOREFRONT_CONFIG = {
  hero: { name: 'Billie Wolf', tagline: 'Literary fiction from Portland, Oregon.' },
  featuredIds: ['1', '2', '3', '6'],
};

// ── Attribution data ──────────────────────────────────────────────

export interface AttributionChannel {
  id:          string;
  label:       string;
  description: string;        // what this channel is
  revenue:     number;        // $ attributed
  orders:      number;
  pct:         number;        // share of total attributed revenue
  avgOrder:    number;        // average order value
  timing:      string;        // when it converted
  repeat:      string;        // playbook recommendation for next launch
}

// Total attributed revenue: $2,645 (matches ENGAGEMENT_DATA totals)
export const ATTRIBUTION_DATA: AttributionChannel[] = [
  {
    id:          'arc',
    label:       'ARC readers',
    description: 'Advance review copies sent 8 days before launch',
    revenue:     1005,
    orders:      31,
    pct:         38,
    avgOrder:    32,
    timing:      'Converted mostly on launch day and day 2',
    repeat:      'Send ARCs 10–14 days before launch — give more lead time for reviews to accumulate',
  },
  {
    id:          'teaser',
    label:       'Community teaser',
    description: 'First-chapter preview posted to author community',
    revenue:     740,
    orders:      26,
    pct:         28,
    avgOrder:    28,
    timing:      'Steady conversion over the first week',
    repeat:      'Post 2 teasers: one excerpt + one thematic image, spaced 5 days apart',
  },
  {
    id:          'newsletter',
    label:       'Newsletter feature',
    description: 'Featured in The Bookending Letter (18 k subscribers)',
    revenue:     582,
    orders:      18,
    pct:         22,
    avgOrder:    32,
    timing:      'Spike on May 14, sustained 3 days',
    repeat:      'Request the feature slot 3 weeks out — newsletter fills fast',
  },
  {
    id:          'organic',
    label:       'Organic discovery',
    description: 'Direct, search, and unattributed traffic',
    revenue:     318,
    orders:      14,
    pct:         12,
    avgOrder:    23,
    timing:      'Gradual, picked up in week 2',
    repeat:      'Improve book page SEO: add genre keywords to description',
  },
];
