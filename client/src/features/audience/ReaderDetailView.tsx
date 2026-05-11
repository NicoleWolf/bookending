import { Avatar, Pill } from '../../shared/ui/atoms';
import { READER_EVENTS, READER_MATCHES, SEGMENT_TONE } from './data';
import type { Subscriber } from './types';
import styles from './ReaderDetail.module.css';

const PLATFORM_LABEL: Record<string, string> = {
  goodreads: 'Goodreads',
  instagram: 'Instagram',
  bookshop:  'Bookshop.org',
  x:         'X / Twitter',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high:   'Confirmed match',
  medium: 'Possible match — confirm?',
};

interface Props {
  subscriber: Subscriber;
  onBack:     () => void;
}

export function ReaderDetailView({ subscriber: s, onBack }: Props) {
  const events  = READER_EVENTS[s.id]  ?? [];
  const matches = READER_MATCHES[s.id] ?? [];

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack}>← All subscribers</button>

      <div className={styles.profile}>
        <Avatar initials={s.initials} tone={s.tone} size={48} />
        <div className={styles.profileInfo}>
          <div className={styles.profileName}>
            {s.name}
            {s.isChampion && <span className={styles.championMark}> ★</span>}
          </div>
          <div className={styles.profileMeta}>
            <span>{s.location}</span>
            <span className={styles.metaDot}>·</span>
            <span>Joined {s.joined}</span>
            <span className={styles.metaDot}>·</span>
            <Pill tone={SEGMENT_TONE[s.segment]}>{s.segment}</Pill>
          </div>
        </div>
        <div className={styles.profileStats}>
          <div className={styles.statItem}>
            <div className={`serif ${styles.statValue}`}>{s.opens}</div>
            <div className={styles.statLabel}>Opens</div>
          </div>
          <div className={styles.statItem}>
            <div className={`serif ${styles.statValue}`}>{s.replies}</div>
            <div className={styles.statLabel}>Replies</div>
          </div>
          {s.spent !== '$0' && (
            <div className={styles.statItem}>
              <div className={`serif ${styles.statValuePatron}`}>{s.spent}</div>
              <div className={styles.statLabel}>Spent</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.section}>
            <div className={`label ${styles.sectionLabel}`}>Reader timeline</div>
            {events.length === 0 ? (
              <p className={`serif ${styles.emptyNote}`}>No recorded events yet.</p>
            ) : (
              <div className={styles.timeline}>
                {events.map((e, i) => (
                  <div key={i} className={styles.timelineRow}>
                    <div className={styles.timelineDate}>{e.date}</div>
                    <div className={styles.timelineLine}>
                      <div className={styles.timelineDot} />
                      {i < events.length - 1 && <div className={styles.timelineConnector} />}
                    </div>
                    <div className={`serif ${styles.timelineBody}`}>{e.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.sideCol}>
          {matches.length > 0 && (
            <div className={styles.section}>
              <div className={`label ${styles.sectionLabel}`}>Cross-channel identity</div>
              <div className={styles.matchList}>
                {matches.map((m, i) => (
                  <div key={i} className={styles.matchRow} data-confidence={m.confidence}>
                    <div className={styles.matchPlatform}>{PLATFORM_LABEL[m.platform] ?? m.platform}</div>
                    <div className={styles.matchHandle}>{m.handle}</div>
                    <div className={styles.matchConfidence} data-confidence={m.confidence}>
                      {CONFIDENCE_LABEL[m.confidence]}
                    </div>
                    {m.detail && <div className={`serif ${styles.matchDetail}`}>{m.detail}</div>}
                    {m.confidence === 'medium' && (
                      <div className={styles.matchActions}>
                        <button className={styles.matchConfirmBtn}>Confirm</button>
                        <button className={styles.matchDismissBtn}>Dismiss</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={`label ${styles.sectionLabel}`}>Channels</div>
            <div className={styles.channelList}>
              {(s.channels ?? ['email']).map(ch => (
                <div key={ch} className={styles.channelTag}>
                  {ch === 'email'     && 'Email subscriber'}
                  {ch === 'goodreads' && 'Goodreads'}
                  {ch === 'instagram' && 'Instagram'}
                  {ch === 'bookshop'  && 'Bookshop.org'}
                </div>
              ))}
            </div>
          </div>

          {s.isChampion && (
            <div className={styles.section}>
              <div className={`label ${styles.sectionLabel}`}>Champion</div>
              <p className={`serif ${styles.championNote}`}>
                This reader writes about your work in public. Their endorsements carry weight beyond your own channels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
