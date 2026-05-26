export type LaunchEventType = 'view' | 'purchase' | 'follow';

export interface LaunchEvent {
  id: string;
  type: LaunchEventType;
  occurredAt: string; // ISO
  detail?: string;    // "Paperback · £12.99" for purchases
  location?: string;  // "Edinburgh" for views
}

export interface LaunchFeedData {
  publishedAt: string;
  events: LaunchEvent[];
}

// Demo data — always anchored 18 h before now so the feed is always live
const NOW = Date.now();
const LAUNCH_MS = NOW - 18 * 3_600_000;
export const DEMO_PUBLISHED_AT = new Date(LAUNCH_MS).toISOString();

function at(fractionalHoursFromLaunch: number): string {
  return new Date(LAUNCH_MS + fractionalHoursFromLaunch * 3_600_000).toISOString();
}

export const DEMO_LAUNCH_EVENTS: LaunchEvent[] = [
  // Hour 18 (current)
  { id: 'e1',  type: 'follow',   occurredAt: at(17.93) },
  { id: 'e2',  type: 'view',     occurredAt: at(17.72), location: 'Edinburgh' },
  // Hour 17
  { id: 'e3',  type: 'purchase', occurredAt: at(16.82), detail: 'Paperback · £12.99' },
  { id: 'e4',  type: 'view',     occurredAt: at(16.30), location: 'London' },
  // Hour 15
  { id: 'e5',  type: 'follow',   occurredAt: at(14.55) },
  { id: 'e6',  type: 'purchase', occurredAt: at(14.22), detail: 'eBook · £5.99' },
  { id: 'e7',  type: 'view',     occurredAt: at(14.10) },
  // Hour 13
  { id: 'e8',  type: 'view',     occurredAt: at(12.70), location: 'Bristol' },
  { id: 'e9',  type: 'follow',   occurredAt: at(12.40) },
  { id: 'e10', type: 'view',     occurredAt: at(12.15) },
  // Hour 10
  { id: 'e11', type: 'purchase', occurredAt: at(9.90), detail: 'Paperback · £12.99' },
  { id: 'e12', type: 'view',     occurredAt: at(9.65), location: 'Dublin' },
  { id: 'e13', type: 'follow',   occurredAt: at(9.35) },
  { id: 'e14', type: 'view',     occurredAt: at(9.10) },
  // Hour 7
  { id: 'e15', type: 'follow',   occurredAt: at(6.80) },
  { id: 'e16', type: 'view',     occurredAt: at(6.55), location: 'Manchester' },
  { id: 'e17', type: 'view',     occurredAt: at(6.25) },
  // Hour 5
  { id: 'e18', type: 'purchase', occurredAt: at(4.90), detail: 'eBook · £5.99' },
  { id: 'e19', type: 'follow',   occurredAt: at(4.70) },
  { id: 'e20', type: 'view',     occurredAt: at(4.40), location: 'Glasgow' },
  { id: 'e21', type: 'view',     occurredAt: at(4.15) },
  // Hour 3
  { id: 'e22', type: 'purchase', occurredAt: at(2.90), detail: 'Paperback · £12.99' },
  { id: 'e23', type: 'follow',   occurredAt: at(2.70) },
  { id: 'e24', type: 'view',     occurredAt: at(2.50), location: 'London' },
  { id: 'e25', type: 'view',     occurredAt: at(2.25) },
  // Hour 2
  { id: 'e26', type: 'follow',   occurredAt: at(1.80) },
  { id: 'e27', type: 'view',     occurredAt: at(1.60) },
  { id: 'e28', type: 'purchase', occurredAt: at(1.32), detail: 'eBook · £5.99' },
  // Hour 1 (launch hour)
  { id: 'e29', type: 'follow',   occurredAt: at(0.90) },
  { id: 'e30', type: 'view',     occurredAt: at(0.70), location: 'Edinburgh' },
  { id: 'e31', type: 'view',     occurredAt: at(0.45) },
  { id: 'e32', type: 'follow',   occurredAt: at(0.20) },
];
