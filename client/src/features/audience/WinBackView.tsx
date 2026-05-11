import { Btn } from '../../shared/ui/atoms';
import { SEGMENTS } from './data';
import styles from './WinBackView.module.css';

const NOTE_ONE_SUBJECT = 'Still there?';
const NOTE_ONE_BODY =
`It's been a while since we've seen you open one of these dispatches. I wanted to check in — are you still enjoying The Margin Letter?

If life has simply been busy, I understand entirely. But if you've drifted, I'd love to know what might bring you back.

— Billie`;

const NOTE_TWO_SUBJECT = 'A final note';
const NOTE_TWO_BODY =
`I sent a note ten days ago and haven't heard from you. I don't want to keep sending dispatches if they're no longer welcome.

If you'd like to stay, just click the link below — no other action needed. If not, I'll understand.

— Billie`;

interface Props {
  onBack: () => void;
}

export function WinBackView({ onBack }: Props) {
  const coolSeg = SEGMENTS.find(s => s.key === 'cool')!;

  return (
    <div>
      <div className={styles.backBar}>
        <button className={styles.backBtn} onClick={onBack}>← Overview</button>
      </div>

      <div className={styles.header}>
        <h2 className={`serif ${styles.title}`}>A note to drifting readers</h2>
        <p className={`serif ${styles.summary}`}>
          {coolSeg.n.toLocaleString()} readers haven't opened a dispatch in six weeks.
          Inbox providers begin filtering dispatches when too many go unread — even for
          authors devoted readers already know. This two-note sequence checks in quietly,
          and clears the list of readers who've truly moved on.
        </p>
      </div>

      <div className={styles.noteGrid}>
        <div className={styles.noteCard}>
          <div className={`label ${styles.noteLabel}`}>
            Note one · Sent now · To all {coolSeg.n.toLocaleString()} quiet readers
          </div>
          <div className={styles.noteSubject}>{NOTE_ONE_SUBJECT}</div>
          <p className={`serif ${styles.noteBody}`}>{NOTE_ONE_BODY}</p>
        </div>

        <div className={styles.noteCard}>
          <div className={`label ${styles.noteLabel}`}>
            Note two · Sent 10 days later · To non-responders only
          </div>
          <div className={styles.noteSubject}>{NOTE_TWO_SUBJECT}</div>
          <p className={`serif ${styles.noteBody}`}>{NOTE_TWO_BODY}</p>
          <div className={styles.keepBtn}>Keep me subscribed →</div>
          <p className={styles.keepNote}>This is what the reader sees. One click, no login required.</p>
        </div>
      </div>

      <div className={styles.footer}>
        <p className={`serif ${styles.footerNote}`}>
          After 14 days, readers who don't respond will be surfaced for your review.
          You'll confirm before anyone is removed from the list.
        </p>
        <div className={styles.footerActions}>
          <Btn tone="accent">Send note one →</Btn>
          <Btn tone="ghost" onClick={onBack}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}
