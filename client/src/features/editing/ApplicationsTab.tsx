import { useState } from 'react';
import { Avatar } from '../../shared/ui/atoms';
import { DEMO_APPLICATIONS } from './applications-data';
import type { BetaApplication } from './applications-data';
import styles from './ApplicationsTab.module.css';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

interface Props {
  manuscriptId: string;
}

export default function ApplicationsTab({ manuscriptId: _manuscriptId }: Props) {
  const [apps,     setApps]     = useState<BetaApplication[]>(DEMO_APPLICATIONS);
  const [deciding, setDeciding] = useState<{ id: string; type: 'accept' | 'decline' } | null>(null);
  const [notes,    setNotes]    = useState<Record<string, string>>({});

  function confirm(appId: string, type: 'accept' | 'decline') {
    const note = notes[appId]?.trim() ?? '';
    setApps(prev => prev.map(a =>
      a.id === appId
        ? { ...a, status: type === 'accept' ? 'accepted' : 'declined', authorNote: note || null }
        : a
    ));
    setDeciding(null);
  }

  const pending = apps.filter(a => a.status === 'pending');
  const decided = apps.filter(a => a.status !== 'pending');

  if (apps.length === 0) {
    return <p className={styles.empty}>No applications yet.</p>;
  }

  return (
    <div className={styles.tab}>

      {pending.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Pending review</span>
            <span className={styles.sectionCount}>{pending.length}</span>
          </div>
          {pending.map(app => (
            <div key={app.id} className={styles.card}>
              <div className={styles.cardTop}>
                <Avatar initials={app.readerInitials} tone="accent" size={20} />
                <span className={styles.readerName}>{app.readerName}</span>
                <span className={styles.meta}>applied {daysSince(app.appliedAt)}d ago</span>
              </div>

              <div className={styles.genres}>
                {app.readerGenres.map(g => (
                  <span key={g} className={styles.genreTag}>{g}</span>
                ))}
              </div>

              <p className={styles.bio}>{app.bio}</p>

              {deciding?.id === app.id ? (
                <div className={styles.decideForm}>
                  <div className={styles.decideFormLabel}>
                    {deciding.type === 'accept' ? 'Accept with a note' : 'Decline with a note'}
                  </div>
                  <textarea
                    className={styles.decideTextarea}
                    placeholder={deciding.type === 'accept'
                      ? "Tell them why their application stood out…"
                      : "A brief, kind note — it helps readers improve their next application."
                    }
                    value={notes[app.id] ?? ''}
                    onChange={e => setNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                    rows={3}
                    maxLength={400}
                    aria-label="Personal note to reader"
                    autoFocus
                  />
                  <div className={styles.decideFormFoot}>
                    <button
                      type="button"
                      className={styles.decideCancelBtn}
                      onClick={() => setDeciding(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={deciding.type === 'accept' ? styles.decideAcceptBtn : styles.decideDeclineBtn}
                      onClick={() => confirm(app.id, deciding.type)}
                      disabled={!notes[app.id]?.trim()}
                    >
                      {deciding.type === 'accept' ? 'Confirm acceptance' : 'Confirm decline'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.cardFoot}>
                  <button
                    type="button"
                    className={styles.declineBtn}
                    onClick={() => setDeciding({ id: app.id, type: 'decline' })}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className={styles.acceptBtn}
                    onClick={() => setDeciding({ id: app.id, type: 'accept' })}
                  >
                    Accept →
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {decided.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Decided</span>
            <span className={styles.sectionCount}>{decided.length}</span>
          </div>
          {decided.map(app => (
            <div key={app.id} className={styles.card} data-status={app.status}>
              <div className={styles.cardTop}>
                <Avatar initials={app.readerInitials} tone="accent" size={20} />
                <span className={styles.readerName}>{app.readerName}</span>
                <span
                  className={styles.statusPill}
                  data-status={app.status}
                >
                  {app.status === 'accepted' ? 'Accepted' : 'Declined'}
                </span>
                <span className={styles.meta}>{fmtDate(app.appliedAt)}</span>
              </div>
              {app.authorNote && (
                <p className={styles.decidedNote}>&ldquo;{app.authorNote}&rdquo;</p>
              )}
            </div>
          ))}
        </section>
      )}

    </div>
  );
}
