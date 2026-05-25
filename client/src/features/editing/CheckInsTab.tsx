import { useState } from 'react';
import { Avatar } from '../../shared/ui/atoms';
import { DEMO_CHECKINS, defaultTemplate } from './checkin-data';
import type { CheckIn } from './checkin-data';
import styles from './CheckInsTab.module.css';

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface Props {
  manuscriptTitle?: string;
}

export default function CheckInsTab({ manuscriptTitle = 'this manuscript' }: Props) {
  const [checkIns,     setCheckIns]     = useState<CheckIn[]>(DEMO_CHECKINS);
  const [composingFor, setComposingFor] = useState<string | null>(null);
  const [drafts,       setDrafts]       = useState<Record<string, string>>({});

  function getDraft(reader: CheckIn): string {
    return drafts[reader.readerId]
      ?? defaultTemplate(reader.readerName.split(' ')[0]!, manuscriptTitle);
  }

  function send(readerId: string) {
    const reader = checkIns.find(c => c.readerId === readerId)!;
    const message = getDraft(reader);
    setCheckIns(prev => prev.map(c =>
      c.readerId === readerId
        ? { ...c, sentAt: new Date().toISOString(), message }
        : c
    ));
    setComposingFor(null);
  }

  const queue   = checkIns.filter(c => !c.sentAt);
  const pending = checkIns.filter(c => c.sentAt && !c.reply);
  const replied = checkIns.filter(c => c.reply);

  if (checkIns.length === 0) {
    return <p className={styles.empty}>No readers have finished this manuscript yet.</p>;
  }

  return (
    <div className={styles.tab}>

      {queue.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>To check in</span>
            <span className={styles.sectionCount}>{queue.length}</span>
          </div>
          {queue.map(reader => (
            <div key={reader.readerId} className={styles.card}>
              <div className={styles.cardTop}>
                <Avatar initials={reader.readerInitials} tone="accent" size={20} />
                <span className={styles.readerName}>{reader.readerName}</span>
                <span className={styles.meta}>finished {daysSince(reader.finishedAt)}d ago</span>
              </div>
              {composingFor === reader.readerId ? (
                <div className={styles.compose}>
                  <textarea
                    className={styles.composeArea}
                    value={getDraft(reader)}
                    onChange={e => setDrafts(prev => ({ ...prev, [reader.readerId]: e.target.value }))}
                    rows={8}
                    aria-label={`Message to ${reader.readerName}`}
                  />
                  <div className={styles.composeFoot}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setComposingFor(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.sendBtn}
                      onClick={() => send(reader.readerId)}
                    >
                      Send check-in
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.composeToggle}
                  onClick={() => setComposingFor(reader.readerId)}
                >
                  Write check-in <span aria-hidden="true">↓</span>
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {pending.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Awaiting reply</span>
            <span className={styles.sectionCount}>{pending.length}</span>
          </div>
          {pending.map(reader => (
            <div key={reader.readerId} className={styles.card} data-state="sent">
              <div className={styles.cardTop}>
                <Avatar initials={reader.readerInitials} tone="accent" size={20} />
                <span className={styles.readerName}>{reader.readerName}</span>
                <span className={styles.meta}>sent {daysSince(reader.sentAt!)}d ago</span>
              </div>
              {reader.message && (
                <p className={styles.sentMessage}>{reader.message}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {replied.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Replied</span>
            <span className={styles.sectionCount}>{replied.length}</span>
          </div>
          {replied.map(reader => (
            <div key={reader.readerId} className={styles.card} data-state="replied">
              <div className={styles.cardTop}>
                <Avatar initials={reader.readerInitials} tone="accent" size={20} />
                <span className={styles.readerName}>{reader.readerName}</span>
                <span className={styles.meta}>{fmtDate(reader.repliedAt!)}</span>
              </div>
              <p className={`serif ${styles.replyText}`}>&ldquo;{reader.reply}&rdquo;</p>
            </div>
          ))}
        </section>
      )}

    </div>
  );
}
