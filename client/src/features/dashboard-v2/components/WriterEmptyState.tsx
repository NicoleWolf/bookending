import { DarkHeroCard } from '../../../shared/ui/atoms/DarkHeroCard';
import { HeroGrid } from '../../../shared/ui/atoms/HeroGrid';
import { Pill } from '../../../shared/ui/atoms/Pill';
import { Btn } from '../../../shared/ui/atoms/Btn';
import styles from './WriterEmptyState.module.css';

interface WriterEmptyStateProps {
  onSwitch: () => void;
}

const ManuscriptIllustration = () => (
  <svg viewBox="0 0 280 320" xmlns="http://www.w3.org/2000/svg" className={styles.illustration} aria-hidden="true">
    <rect x="20" y="20" width="240" height="280" fill="var(--bk-ink-2)" stroke="var(--bk-muted-2)" strokeWidth="0.5" />
    <text x="40" y="58" fontFamily="Newsreader, Georgia, serif" fontSize="16" fontStyle="italic" fill="var(--bk-paper-deep)">Chapter One</text>
    <g stroke="var(--bk-muted-2)" strokeWidth="0.5" fill="none">
      <line x1="40" y1="88" x2="240" y2="88" />
      <line x1="40" y1="108" x2="240" y2="108" />
      <line x1="40" y1="128" x2="240" y2="128" />
      <line x1="40" y1="148" x2="200" y2="148" />
      <line x1="40" y1="178" x2="240" y2="178" />
      <line x1="40" y1="198" x2="240" y2="198" />
      <line x1="40" y1="218" x2="220" y2="218" />
      <line x1="40" y1="238" x2="240" y2="238" />
      <line x1="40" y1="258" x2="160" y2="258" />
    </g>
    <line x1="40" y1="278" x2="60" y2="278" stroke="var(--accent)" strokeWidth="1.5" />
  </svg>
);

export const WriterEmptyState = ({ onSwitch }: WriterEmptyStateProps) => (
  <div className={styles.state}>
    {/* Dark hero */}
    <DarkHeroCard density="full">
      <HeroGrid
        left={
          <div>
            <Pill tone="accent-solid">Start here</Pill>
            <h1 className={`serif ${styles.heroHeadline}`}>
              Every book starts with a first page. Yours can start here.
            </h1>
            <p className={styles.heroBody}>
              Bookending is built around your manuscript — the desk, the reading room, the launch sequence, and everything in between. Start fresh with a blank draft, or bring in something you've already written.
            </p>
            <div className={styles.heroCtas}>
              <Btn tone="accent">Start a new manuscript →</Btn>
              <Btn tone="ghost-dark">Import from Word, Scrivener, or Docs</Btn>
            </div>
          </div>
        }
        right={<ManuscriptIllustration />}
      />
    </DarkHeroCard>

    {/* Lifecycle preview */}
    <div className={styles.previewSection}>
      <div className={styles.previewHead}>
        <span className={`mono ${styles.eyebrow}`}>§ What you'll get</span>
        <h2 className={`serif ${styles.previewTitle}`}>From first page to first reader</h2>
      </div>
      <div className={styles.previewGrid}>
        {[
          { num: '§ 01', label: 'Write & revise', headline: 'A workspace built for revision, not just first drafts.', body: 'Invite beta readers, gather inline notes, and see where readers react in your manuscript — all in one room.' },
          { num: '§ 02', label: 'Prepare & launch', headline: "A guided launch sequence, when you're ready.", body: 'Cover, metadata, pricing, formatting, proof. Bookending walks you through each step — no guesswork, no missing pieces.' },
          { num: '§ 03', label: 'Sell & sustain', headline: 'A storefront and a readership, after launch.', body: 'Direct sales, distribution to KDP and IngramSpark, your newsletter, and the reader correspondence that keeps a book alive.' },
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

    {/* Import band */}
    <div className={styles.importBand}>
      <div className={styles.importMain}>
        <span className={`mono ${styles.eyebrow}`}>§ Already have a draft?</span>
        <h3 className={`serif ${styles.importTitle}`}>Bring it in. We'll keep your structure intact.</h3>
        <p className={styles.importBody}>Most writers arrive with something already started. Bookending imports your file, preserves chapter breaks, and gives you a clean manuscript ready for revision and beta reading.</p>
        <div className={`mono ${styles.formats}`}>
          <span>·docx</span><span>·scrivener</span><span>·google docs</span><span>·markdown</span><span>·pages</span><span>·rtf</span>
        </div>
      </div>
      <div className={styles.importAction}>
        <button className={`mono ${styles.secondaryBtn}`}>Import a manuscript →</button>
      </div>
    </div>

    {/* Tail cards */}
    <div className={styles.tailGrid}>
      <div className={styles.tailCard}>
        <span className={`mono ${styles.eyebrow}`}>§ A first chapter, on the house</span>
        <h3 className={`serif ${styles.tailTitle}`}>Start with a Bookending template.</h3>
        <p className={styles.tailBody}>Novel, novella, memoir, short story collection, serial. Each comes with a structural skeleton, working chapter breaks, and a one-page craft note from a Bookending editor.</p>
        <button className={`mono ${styles.secondaryBtn}`}>Browse templates →</button>
      </div>
      <div className={styles.tailCard}>
        <span className={`mono ${styles.eyebrow}`}>§ Read while you write</span>
        <h3 className={`serif ${styles.tailTitle}`}>Your reading side is already on.</h3>
        <p className={styles.tailBody}>Reading other writers' work-in-progress — and leaving notes — sharpens your own. The Reading side of your Dashboard is ready when you are.</p>
        <button className={`mono ${styles.secondaryBtn}`} onClick={onSwitch}>Switch to reading →</button>
      </div>
    </div>

    {/* Soft link */}
    <div className={styles.softLink}>
      <p className={`serif ${styles.softLinkText}`}>
        Questions before you start?{' '}
        <button className={`serif ${styles.softLinkBtn}`}>Read about how Bookending works →</button>
      </p>
    </div>
  </div>
);
