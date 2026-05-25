export type NotificationType =
  | 'MILESTONE_REMINDER'
  | 'STAGE_NUDGE'
  | 'DEADLINE_WARNING'
  | 'ENCOURAGEMENT'
  | 'AUTHOR_FOLLOW'
  | 'AUTHOR_MILESTONE'
  | 'AUTHOR_POST'
  | 'AUTHOR_LAUNCH'
  | 'AUTHOR_ARC'
  | 'QA_ANSWERED'
  | 'BOOK_PUBLISHED'
  | 'CHECKIN_RECEIVED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  stage: string;
  message: string;
  read: boolean;
  receivedAt: string; // ISO date string
  cta?: { label: string; authorId: string; tab?: string; bookId?: string };
  onUndo?: () => void;
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

