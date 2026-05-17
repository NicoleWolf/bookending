import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Pill } from '../../shared/ui/atoms';
import { SectionHead } from '../../shared/ui/atoms';
import styles from './MyARCs.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArcManuscript {
  id: string; title: string; genre: string | null; coverUrl: string | null;
  author: { id: string; name: string };
}

interface ArcEntry {
  id: string; status: string; readingProgress: number;
  appliedAt: string; decidedAt: string | null;
  reviewBody: string | null; reviewPostedAt: string | null;
  deadlineDaysLeft: number | null;
  program: {
    id: string; mode: string; reviewDeadline: string | null; launchDate: string | null;
    manuscript: ArcManuscript;
  };
}

interface Props {
  onReadArc?: (manuscriptId: string) => void;
  onReview?: (manuscriptId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function deadlineUrgency(daysLeft: number | null): 'urgent' | 'soon' | 'ok' | null {
  if (daysLeft === null) return null;
  if (daysLeft <= 3)  return 'urgent';
  if (daysLeft <= 14) return 'soon';
  return 'ok';
}

// ── ARC card ──────────────────────────────────────────────────────────────────

function ArcCard({ entry, onRead, onWithdraw, onReview }: {
  entry: ArcEntry;
  onRead: (id: string) => void;
  onWithdraw: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const ms = entry.program.manuscript;
  const urgency = deadlineUrgency(entry.deadlineDaysLeft);
  const isAccepted = entry.status === 'ACCEPTED';
  const isFulfilled = entry.status === 'FULFILLED';

  return (
    <div className={styles.arcCard}>
      <div className={styles.arcCardHead}>
        <div className={styles.arcCardMeta}>
          <div className={styles.arcCardTitle}>{ms.title}</div>
          <div className={styles.arcCardAuthor}>by {ms.author.name}</div>
          {ms.genre && <div className={styles.arcCardGenre}>{ms.genre}</div>}
        </div>
        <div className={styles.arcCardStatus}>
          {isFulfilled && <Pill tone="good">Early reader</Pill>}
          {entry.status === 'WITHDRAWN' && <Pill tone="neutral">Stepped back</Pill>}
          {entry.status === 'UNFULFILLED' && <Pill tone="neutral">Unfulfilled</Pill>}
        </div>
      </div>

      {isAccepted && (
        <>
          <div className={styles.progressRow}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ '--pct': `${entry.readingProgress}%` } as React.CSSProperties}
              />
            </div>
            <span className={styles.progressPct}>{Math.round(entry.readingProgress)}%</span>
          </div>

          {entry.program.reviewDeadline && (
            <div className={styles.deadlineRow} data-urgency={urgency ?? 'ok'}>
              <span className={styles.deadlineLabel}>Review due</span>
              <span className={styles.deadlineDate}>{fmtDate(entry.program.reviewDeadline)}</span>
              {urgency === 'urgent' && (
                <span className={styles.deadlineUrgent}>
                  {entry.deadlineDaysLeft === 0 ? 'Due today' : `${entry.deadlineDaysLeft} day${entry.deadlineDaysLeft === 1 ? '' : 's'} left`}
                </span>
              )}
              {urgency === 'soon' && (
                <span className={styles.deadlineSoon}>{entry.deadlineDaysLeft} days left</span>
              )}
            </div>
          )}

          <div className={styles.arcCardActions}>
            <button className={styles.readBtn} onClick={() => onRead(ms.id)}>
              {entry.readingProgress > 0 ? 'Continue reading →' : 'Start reading →'}
            </button>
            {entry.readingProgress >= 100 && (
              <button className={styles.reviewBtn} onClick={() => onReview(ms.id)}>Post review</button>
            )}
            <button className={styles.withdrawBtn} onClick={() => onWithdraw(entry.id)}>
              Step back from this ARC
            </button>
          </div>
        </>
      )}

      {isFulfilled && entry.reviewBody && (
        <blockquote className={styles.reviewQuote}>{entry.reviewBody}</blockquote>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MyARCs({ onReadArc, onReview }: Props) {
  const [entries,  setEntries]  = useState<ArcEntry[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<ArcEntry[]>('/api/arc/my-arcs')
      .then(data => setEntries(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleWithdraw(appId: string) {
    const entry = entries.find(e => e.id === appId);
    if (!entry) return;
    const msTitle = entry.program.manuscript.title;
    if (!confirm(`Step back from ${msTitle}? Stepping back before the deadline doesn't affect your standing.`)) return;
    try {
      await api.post(`/api/manuscripts/${entry.program.manuscript.id}/arc/withdraw`);
      setEntries(prev => prev.map(e => e.id === appId ? { ...e, status: 'WITHDRAWN' } : e));
    } catch { /* swallow */ }
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>Loading…</div>
      </div>
    );
  }

  const inProgress  = entries.filter(e => e.status === 'ACCEPTED');
  const awaiting    = entries.filter(e => e.status === 'PENDING');
  const completed   = entries.filter(e => e.status === 'FULFILLED');
  const past        = entries.filter(e => ['DECLINED', 'WITHDRAWN', 'UNFULFILLED'].includes(e.status));

  const hasAny = entries.length > 0;

  return (
    <div className={styles.wrap}>
      <SectionHead
        eyebrow="Reading"
        title="My ARCs"
        kicker="Your advance reader commitments — past, present, and pending."
      />

      <div className={styles.body}>
        {!hasAny && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No ARC commitments yet.</p>
            <p className={styles.emptyHint}>
              Visit an author's profile to apply for early access to their manuscript.
            </p>
          </div>
        )}

        {inProgress.length > 0 && (
          <div className={styles.section}>
            <div className={`label ${styles.sectionLabel}`}>In progress</div>
            {inProgress.map(e => (
              <ArcCard
                key={e.id}
                entry={e}
                onRead={id => onReadArc?.(id)}
                onWithdraw={handleWithdraw}
                onReview={id => onReview?.(id)}
              />
            ))}
          </div>
        )}

        {awaiting.length > 0 && (
          <div className={styles.section}>
            <div className={`label ${styles.sectionLabel}`}>Awaiting decision</div>
            {awaiting.map(e => (
              <div key={e.id} className={styles.awaitingRow}>
                <div className={styles.awaitingTitle}>{e.program.manuscript.title}</div>
                <div className={styles.awaitingMeta}>by {e.program.manuscript.author.name}</div>
                <div className={styles.awaitingStatus}>Application submitted {fmtDate(e.appliedAt)} — the author is reviewing applications.</div>
              </div>
            ))}
          </div>
        )}

        {completed.length > 0 && (
          <div className={styles.section}>
            <div className={`label ${styles.sectionLabel}`}>Completed</div>
            {completed.map(e => (
              <ArcCard
                key={e.id}
                entry={e}
                onRead={id => onReadArc?.(id)}
                onWithdraw={handleWithdraw}
                onReview={id => onReview?.(id)}
              />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className={styles.section}>
            <div className={`label ${styles.sectionLabel}`}>Past applications</div>
            {past.map(e => (
              <div key={e.id} className={styles.pastRow}>
                <div className={styles.pastTitle}>{e.program.manuscript.title}</div>
                <div className={styles.pastMeta}>by {e.program.manuscript.author.name}</div>
                <div className={styles.pastStatus}>
                  {e.status === 'DECLINED'    && 'Not selected this time.'}
                  {e.status === 'WITHDRAWN'   && 'Stepped back.'}
                  {e.status === 'UNFULFILLED' && 'Deadline passed without a review.'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
