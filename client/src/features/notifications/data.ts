export type NotificationType =
  | 'MILESTONE_REMINDER'
  | 'STAGE_NUDGE'
  | 'DEADLINE_WARNING'
  | 'ENCOURAGEMENT'
  | 'AUTHOR_FOLLOW'
  | 'AUTHOR_MILESTONE'
  | 'QA_ANSWERED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  stage: string;
  message: string;
  read: boolean;
  receivedAt: string; // ISO date string
  cta?: { label: string; authorId: string };
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'STAGE_NUDGE',
    stage: 'Edit',
    message: 'Your draft should be with beta readers now. Collect all feedback before Oct 2027.',
    read: false,
    receivedAt: ago(1000 * 60 * 47),    // 47m ago
  },
  {
    id: 'n2',
    type: 'MILESTONE_REMINDER',
    stage: 'Draft',
    message: 'Time to wrap up your Literary Fiction draft — your 80,000-word target should be hit this month.',
    read: false,
    receivedAt: ago(1000 * 60 * 60 * 6), // 6h ago
  },
  {
    id: 'n3',
    type: 'ENCOURAGEMENT',
    stage: 'Sell',
    message: 'The Salt Roads reached 147 sales this week. Keep the momentum going.',
    read: true,
    receivedAt: ago(1000 * 60 * 60 * 24 * 3), // 3d ago
  },
];
