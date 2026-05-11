import { SEGMENTS, REPLY_SNIPPETS, PLATFORM_SIGNALS, ACTIVE_SEASON } from './data';
import type { Dispatch, PlatformSignal, SignalSeverity } from './types';
import styles from './AttentionPanel.module.css';

interface ItemData {
  severity:     SignalSeverity;
  title:        string;
  consequence:  string;
  actionLabel:  string;
  onAction?:    () => void;
}

const SEVERITY_RANK: Record<SignalSeverity, number> = { act: 0, note: 1, observe: 2 };

function buildPlatformAdvisories(signals: PlatformSignal[]): ItemData[] {
  const items: ItemData[] = [];
  for (const s of signals) {
    if (s.platform === 'goodreads' && s.type === 'rating_drop') {
      const ctx = s.context ?? 'worth reading them';
      items.push({
        severity:    s.severity,
        title:       `Three new ratings dropped your Goodreads average from ${s.baseline.toFixed(1)} to ${s.value.toFixed(1)}.`,
        consequence: `${ctx.charAt(0).toUpperCase()}${ctx.slice(1)} — worth reading them, not to respond, but because the language tends to surface in your next dispatch.`,
        actionLabel: 'Read the ratings →',
      });
    } else if (s.platform === 'instagram' && s.type === 'engagement_dip') {
      items.push({
        severity:    s.severity,
        title:       'Instagram engagement is running at half your usual rate.',
        consequence: `Your last three posts performed below average. You ${s.context ?? 'haven\'t been active recently'}. A single post about the writing tends to lift this.`,
        actionLabel: 'Draft an Instagram post →',
      });
    } else if (s.platform === 'bookshop' && s.type === 'sales_spike') {
      items.push({
        severity:    s.severity,
        title:       `Bookshop sold ${s.value} copies${s.context ? ' of ' + s.context : ''} in ${s.window}.`,
        consequence: "That's well above your daily average. Something drove that traffic — worth finding the source before it goes cold.",
        actionLabel: 'Check recent dispatches →',
      });
    }
  }
  return items;
}

function AttentionItem({ title, consequence, actionLabel, onAction }: ItemData) {
  return (
    <div className={styles.item}>
      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={`serif ${styles.consequence}`}>{consequence}</span>
      </div>
      <button className={styles.action} onClick={onAction}>{actionLabel}</button>
    </div>
  );
}

function parseDate(date: string): Date | null {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const [d, m, y] = date.split(' ');
  if (!m || !(m in months)) return null;
  return new Date(Number(y), months[m]!, Number(d));
}

interface Props {
  lastDispatch:         Dispatch;
  onWriteNote:          () => void;
  onInviteReply:        () => void;
  onReviewTestimonials: () => void;
  onReviewWinBack:      () => void;
  onOpenSeasons?:       () => void;
}

export function AttentionPanel({ lastDispatch, onWriteNote, onInviteReply, onReviewTestimonials, onReviewWinBack, onOpenSeasons }: Props) {
  const emailItems: ItemData[] = [];

  const coolSeg = SEGMENTS.find(s => s.key === 'cool');
  if (coolSeg) {
    if (coolSeg.pct >= 0.15) {
      emailItems.push({
        severity:    'act',
        title:       `${coolSeg.n.toLocaleString()} readers have gone quiet.`,
        consequence: 'When too many readers stop opening, inbox providers begin filtering your dispatches — even for devoted readers. A note to drifting readers is drafted.',
        actionLabel: 'Review draft',
        onAction:    onReviewWinBack,
      });
    } else if (coolSeg.pct >= 0.10) {
      emailItems.push({
        severity:    'note',
        title:       `${coolSeg.n.toLocaleString()} readers have drifted.`,
        consequence: "They haven't opened a dispatch in six weeks — a single note might bring several back.",
        actionLabel: 'Write a note',
        onAction:    onWriteNote,
      });
    }
  }

  const parsed = parseDate(lastDispatch.date);
  if (parsed && lastDispatch.replies !== null) {
    const hoursAgo = (Date.now() - parsed.getTime()) / 3_600_000;
    if (hoursAgo < 72 && lastDispatch.replies === 0) {
      emailItems.push({
        severity:    'note',
        title:       'Your last dispatch is still fresh.',
        consequence: 'The reply window is open. Readers who write back tend to become your most devoted.',
        actionLabel: 'Invite a reply',
        onAction:    onInviteReply,
      });
    }
  }

  if (REPLY_SNIPPETS.length > 0) {
    emailItems.push({
      severity:    'observe',
      title:       `${REPLY_SNIPPETS.length} readers left words worth keeping.`,
      consequence: 'Each one is an endorsement waiting to be placed.',
      actionLabel: 'Review testimonials',
      onAction:    onReviewTestimonials,
    });
  }

  const platformItems = buildPlatformAdvisories(PLATFORM_SIGNALS);

  const seasonItems: ItemData[] = [];
  if (ACTIVE_SEASON.weeksOut <= 8) {
    const dueThisWeek = ACTIVE_SEASON.tasks.filter(t => t.status === 'in-progress' || t.dueDate === 'This week');
    seasonItems.push({
      severity:    'act',
      title:       `${ACTIVE_SEASON.title} launch is in ${ACTIVE_SEASON.weeksOut} weeks.`,
      consequence: dueThisWeek.length > 0
        ? `${dueThisWeek[0]!.task} ${dueThisWeek.length > 1 ? `And ${dueThisWeek.length - 1} more due this week.` : ''}`.trim()
        : 'Review your season checklist.',
      actionLabel: 'Open Seasons →',
      onAction:    onOpenSeasons,
    });
  }

  const allItems = [...emailItems, ...platformItems, ...seasonItems]
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  if (allItems.length === 0) return null;

  return (
    <div className={styles.panel}>
      {allItems.slice(0, 3).map((item, i) => (
        <AttentionItem key={i} {...item} />
      ))}
    </div>
  );
}
