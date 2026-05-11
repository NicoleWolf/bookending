import { DarkHeroCard } from '../../../shared/ui/atoms/DarkHeroCard';
import { HeroGrid } from '../../../shared/ui/atoms/HeroGrid';
import { Pill } from '../../../shared/ui/atoms/Pill';
import { Btn } from '../../../shared/ui/atoms/Btn';
import styles from './ReaderEmptyState.module.css';

interface ReaderEmptyStateProps {
  onSwitch: () => void;
}

const BookshelfIllustration = () => (
  <svg viewBox="0 0 280 320" xmlns="http://www.w3.org/2000/svg" className={styles.illustration} aria-hidden="true">
    <line x1="20" y1="200" x2="260" y2="200" stroke="var(--bk-muted-2)" strokeWidth="1" />
    <rect x="30" y="80" width="28" height="120" fill="var(--bk-ink-2)" stroke="var(--bk-muted-2)" strokeWidth="0.5" />
    <line x1="36" y1="100" x2="52" y2="100" stroke="var(--bk-paper-deep)" strokeWidth="0.5" />
    <line x1="36" y1="180" x2="52" y2="180" stroke="var(--accent)" strokeWidth="1.5" />
    <rect x="62" y="100" width="32" height="100" fill="var(--bk-ink-soft)" stroke="var(--bk-muted-2)" strokeWidth="0.5" />
    <line x1="68" y1="120" x2="88" y2="120" stroke="var(--bk-paper-deep)" strokeWidth="0.5" />
    <rect x="98" y="70" width="30" height="130" fill="var(--bk-ink-2)" stroke="var(--bk-muted-2)" strokeWidth="0.5" />
    <line x1="104" y1="90" x2="122" y2="90" stroke="var(--bk-paper-deep)" strokeWidth="0.5" />
    <rect x="132" y="90" width="28" height="110" fill="var(--bk-ink-soft)" stroke="var(--bk-muted-2)" strokeWidth="0.5" />
    <line x1="138" y1="110" x2="154" y2="110" stroke="var(--bk-paper-deep)" strokeWidth="0.5" />
    <rect x="164" y="110" width="34" height="90" fill="var(--bk-ink-2)" stroke="var(--bk-muted-2)" strokeWidth="0.5" />
    <line x1="170" y1="130" x2="192" y2="130" stroke="var(--bk-paper-deep)" strokeWidth="0.5" />
    <rect x="202" y="80" width="30" height="120" fill="var(--bk-ink-soft)" stroke="var(--bk-muted-2)" strokeWidth="0.5" />
    <line x1="208" y1="100" x2="226" y2="100" stroke="var(--bk-paper-deep)" strokeWidth="0.5" />
    <rect x="236" y="100" width="14" height="100" fill="var(--bk-ink-2)" stroke="var(--bk-muted-2)" strokeWidth="0.5" />
  </svg>
);

export const ReaderEmptyState = ({ onSwitch }: ReaderEmptyStateProps) => (
  <div className={styles.state}>
    {/* Dark hero */}
    <DarkHeroCard density="full">
      <HeroGrid
        left={
          <div>
            <Pill tone="accent-solid">Start here</Pill>
            <h1 className={`serif ${styles.heroHeadline}`}>
              There's a manuscript out there waiting for the right reader.
            </h1>
            <p className={styles.heroBody}>
              Authors on Bookending share their works-in-progress with a small circle of readers before publication. You read drafts, leave notes in the margin, and write directly to the author. The book gets better. So does your reading.
            </p>
            <Btn tone="accent">Discover a manuscript in the Library →</Btn>
          </div>
        }
        right={<BookshelfIllustration />}
      />
    </DarkHeroCard>

    {/* Lifecycle preview */}
    <div className={styles.previewSection}>
      <div className={styles.previewHead}>
        <span className={`mono ${styles.eyebrow}`}>§ How reading works here</span>
        <h2 className={`serif ${styles.previewTitle}`}>Discover, read, connect.</h2>
      </div>
      <div className={styles.previewGrid}>
        {[
          { num: '§ 01', label: 'Discover', headline: 'Find a manuscript that wants you in the room.', body: 'Browse open beta reads, apply where authors are accepting readers, or set up a public profile so authors can invite you to their work.' },
          { num: '§ 02', label: 'Read', headline: 'Read in the margin. Notes are part of the work.', body: "Inline notes, replies, passage shares. Read at your own pace — there are no due dates, just the conversation while it's warm." },
          { num: '§ 03', label: 'Connect', headline: 'Write to the author. Stay for the next book.', body: 'When you finish, send a Letter through Correspondence. Authors hear directly from the readers who shaped the book.' },
        ].map((lane) => (
          <div key={lane.num} className={styles.previewCard}>
            <div className={styles.previewCardHead}>
              <span className={`mono ${styles.laneNum}`}>{lane.num}</span>
              <span className={`mono ${styles.eyebrow}`}>{lane.label}</span>
            </div>
            <p className={`serif ${styles.laneHeadline}`}>{lane.headline}</p>
            <p className={styles.laneBody}>{lane.body}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Three ways band */}
    <div className={styles.threeWaysBand}>
      <div className={styles.threeWaysMain}>
        <span className={`mono ${styles.eyebrow}`}>§ Three ways authors invite readers</span>
        <h3 className={`serif ${styles.threeWaysTitle}`}>Authors choose who joins each beta read.</h3>
        <div className={styles.mechanisms}>
          {[
            { label: 'Open apply', body: 'Anyone can apply. Authors review applications and accept readers who fit.' },
            { label: 'Profile match', body: 'Authors browse public reader profiles and send invitations directly.' },
            { label: 'Circle', body: "When readers in your circle join a beta, you'll see it in your Library." },
          ].map((m) => (
            <div key={m.label} className={styles.mechanism}>
              <span className={`mono ${styles.mechanismLabel}`}>{m.label.toUpperCase()}</span>
              <p className={styles.mechanismBody}>{m.body}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.threeWaysAction}>
        <button className={`mono ${styles.secondaryBtn}`}>Set up your reader profile →</button>
      </div>
    </div>

    {/* Tail cards */}
    <div className={styles.tailGrid}>
      <div className={styles.tailCard}>
        <span className={`mono ${styles.eyebrow}`}>§ Books, too</span>
        <h3 className={`serif ${styles.tailTitle}`}>Buy from the authors you read.</h3>
        <p className={styles.tailBody}>Bookending storefronts let authors sell directly. When a book you helped shape ships, you'll be the first to know.</p>
        <button className={`mono ${styles.secondaryBtn}`}>Browse the storefront →</button>
      </div>
      <div className={styles.tailCard}>
        <span className={`mono ${styles.eyebrow}`}>§ Write while you read</span>
        <h3 className={`serif ${styles.tailTitle}`}>Your writing side is already on.</h3>
        <p className={styles.tailBody}>Working on a manuscript of your own? Switch to the Writing side to start a draft or import one you've already written.</p>
        <button className={`mono ${styles.secondaryBtn}`} onClick={onSwitch}>Switch to writing →</button>
      </div>
    </div>

    {/* Soft link */}
    <div className={styles.softLink}>
      <p className={`serif ${styles.softLinkText}`}>
        New to beta reading?{' '}
        <button className={`serif ${styles.softLinkBtn}`}>Read about being a Bookending reader →</button>
      </p>
    </div>
  </div>
);
