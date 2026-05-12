import { useState } from 'react';
import type { CatalogManuscript } from './data';
import { deriveSlotState, slotStatusText } from './data';
import styles from './ManuscriptCard.module.css';

export type CardVariant = 'standard' | 'hero' | 'compact';

interface Props {
  ms:                   CatalogManuscript;
  variant?:             CardVariant;
  isPending?:           boolean;
  isJoined?:            boolean;
  onJoin?:              (ms: CatalogManuscript) => void;
  onRequestRead?:       (ms: CatalogManuscript) => void;
  onWithdraw?:          (ms: CatalogManuscript) => void;
  suppressGenreEyebrow?: boolean;
  showGenreInByline?:   boolean;
  isHiddenByNotes?:     boolean;
}

function BetaModeLabel({ mode }: { mode: string }) {
  const isRequest = mode === 'REQUEST';
  return (
    <span className={styles.mechanism}>
      <span aria-hidden="true">{isRequest ? '⌄' : '○'}</span>
      {' '}{isRequest ? 'Apply to read' : 'Open enrollment'}
    </span>
  );
}

function SlotStatus({ ms }: { ms: CatalogManuscript }) {
  const state = deriveSlotState(ms);
  const text  = slotStatusText(state, ms);
  const cls   =
    state === 'open'    ? styles.statOpen    :
    state === 'filling' ? styles.statFilling :
                          styles.statFull;
  const orn =
    state === 'open'    ? '◦' :
    state === 'filling' ? '◎' : '●';

  return (
    <span className={`${styles.stat} ${cls}`}>
      <span aria-hidden="true">{orn}</span> {text}
    </span>
  );
}

function ContentNotesLine({ notes }: { notes: CatalogManuscript['contentNotes'] }) {
  const [open, setOpen] = useState(false);
  if (!notes) return null;
  return (
    <div className={styles.cn}>
      <div
        className={styles.cnInline}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`View content notes: ${notes.count} note${notes.count !== 1 ? 's' : ''}`}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(v => !v)}
      >
        <span aria-hidden="true">⚠</span>
        {' '}<span className={styles.cnCount}>{notes.count} content note{notes.count !== 1 ? 's' : ''}</span>
        {' '}— {open ? 'hide' : 'view'}
      </div>
      {open && (
        <ul className={styles.cnList}>
          {notes.items.map(item => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}

function PendingBlock({ ms, onWithdraw }: { ms: CatalogManuscript; onWithdraw?: (ms: CatalogManuscript) => void }) {
  const authorFirst = ms.author.split(' ').pop() ?? ms.author;
  return (
    <div className={styles.pendingBlock}>
      <div className={styles.pendingEyebrow}>REQUEST SENT</div>
      <p className={`${styles.pendingHelper} serif`}>
        Waiting on {authorFirst}. Most authors respond within a week.
      </p>
      {onWithdraw && (
        <button className={styles.withdrawBtn} onClick={() => onWithdraw(ms)}>
          Withdraw request
        </button>
      )}
    </div>
  );
}

function JoinedBlock() {
  return (
    <div className={styles.joinedBlock}>
      <span className={styles.joinedLabel}>ENROLLED IN THIS BETA READ</span>
    </div>
  );
}

/* ── Standard card ────────────────────────────────────────────────── */
function StandardCard({ ms, isPending, isJoined, onJoin, onRequestRead, onWithdraw, suppressGenreEyebrow, showGenreInByline, isHiddenByNotes }: Props) {
  const genreEyebrow = [ms.genre, ms.subgenre].filter(Boolean).join(' · ').toUpperCase();
  const hook = ms.hook ?? ms.description;
  const slotState = deriveSlotState(ms);
  const bylineText = showGenreInByline
    ? `${ms.author.toUpperCase()} · ${ms.genre.toUpperCase()}`
    : ms.author.toUpperCase();

  return (
    <article className={styles.card} data-hidden-notes={isHiddenByNotes ? '' : undefined}>
      {/* 1. Genre eyebrow — omitted when single-genre filter active */}
      {!suppressGenreEyebrow && <div className={styles.genreEyebrow}>{genreEyebrow}</div>}

      {/* 2. Title */}
      <h3 className={`serif ${styles.title}`}>{ms.title}</h3>

      {/* 3. Byline — includes genre when "All manuscripts" active */}
      <div className={styles.byline}>{bylineText}</div>

      {/* 4. Personalization signal */}
      {ms.personalizationSignal && (
        <p
          className={`serif ${styles.signal}`}
          data-kind={ms.personalizationSignal.kind}
        >
          {ms.personalizationSignal.text}
        </p>
      )}

      {/* 5. Hook */}
      <p className={`serif ${styles.hook}`}>{hook}</p>

      {/* 6. Content notes */}
      <ContentNotesLine notes={ms.contentNotes} />

      {/* spacer pushes meta to bottom */}
      <div className={styles.spacer} />

      {/* 7. Soft divider */}
      <hr className={styles.divider} />

      {/* 8. Meta line */}
      <div className={styles.meta}>
        {ms.estimatedPages} PP · {Math.round(ms.wordCount / 1000)}K WORDS
      </div>

      {/* 9. Mode label + slot status */}
      <div className={styles.mechanismRow}>
        <BetaModeLabel mode={ms.betaMode} />
        <span className={styles.metaDot} aria-hidden="true">·</span>
        <SlotStatus ms={ms} />
      </div>

      {/* 10. CTA, pending, or joined */}
      {isJoined ? (
        <JoinedBlock />
      ) : isPending || ms.pendingRequest ? (
        <PendingBlock ms={ms} onWithdraw={onWithdraw} />
      ) : slotState === 'full' ? null : ms.betaMode === 'PUBLIC' ? (
        <button
          className={styles.cta}
          onClick={() => onJoin?.(ms)}
          aria-label={`Join beta read of ${ms.title}`}
        >
          Join beta read <span aria-hidden="true">→</span>
        </button>
      ) : (
        <button
          className={styles.cta}
          onClick={() => onRequestRead?.(ms)}
          aria-label={`Request to read ${ms.title}`}
        >
          Request to read <span aria-hidden="true">→</span>
        </button>
      )}
    </article>
  );
}

/* ── Hero card ────────────────────────────────────────────────────── */
function HeroCard({ ms, isPending, isJoined, onJoin, onRequestRead, onWithdraw }: Props) {
  const genreEyebrow = [ms.genre, ms.subgenre].filter(Boolean).join(' · ').toUpperCase();
  const hook = ms.hook ?? ms.description;
  const slotState = deriveSlotState(ms);

  return (
    <div className={styles.heroCard}>
      {/* Left: cover */}
      <div className={styles.heroCover}>
        {ms.coverUrl ? (
          <img src={ms.coverUrl} alt={`Cover of ${ms.title}`} className={styles.heroCoverImg} />
        ) : (
          <div className={styles.heroCoverPlaceholder}>
            <span className={`serif ${styles.heroCoverTitle}`}>{ms.title}</span>
          </div>
        )}
      </div>

      {/* Right: content */}
      <article className={styles.heroContent}>
        <div className={styles.genreEyebrow}>{genreEyebrow}</div>
        <h2 className={`serif ${styles.heroTitle}`}>{ms.title}</h2>
        <div className={styles.byline}>{ms.author.toUpperCase()}</div>

        {ms.personalizationSignal && (
          <p className={`serif ${styles.signal}`} data-kind={ms.personalizationSignal.kind}>
            {ms.personalizationSignal.text}
          </p>
        )}

        <p className={`serif ${styles.hook}`}>{hook}</p>

        {ms.curatorNote && (
          <blockquote className={styles.heroQuote}>
            <p className={`serif ${styles.heroQuoteText}`}>{ms.curatorNote}</p>
            <cite className={styles.heroQuoteCite}>— BOOKENDING EDITORIAL</cite>
          </blockquote>
        )}

        <ContentNotesLine notes={ms.contentNotes} />

        <div className={styles.spacer} />
        <hr className={styles.divider} />

        <div className={styles.meta}>
          {ms.estimatedPages} PP · {Math.round(ms.wordCount / 1000)}K WORDS
        </div>

        <div className={styles.mechanismRow}>
          <BetaModeLabel mode={ms.betaMode} />
          <span className={styles.metaDot} aria-hidden="true">·</span>
          <SlotStatus ms={ms} />
        </div>

        {isJoined ? (
          <JoinedBlock />
        ) : isPending || ms.pendingRequest ? (
          <PendingBlock ms={ms} onWithdraw={onWithdraw} />
        ) : slotState === 'full' ? null : ms.betaMode === 'PUBLIC' ? (
          <button
            className={styles.heroCta}
            onClick={() => onJoin?.(ms)}
            aria-label={`Join beta read of ${ms.title}`}
          >
            JOIN BETA READ
          </button>
        ) : (
          <button
            className={styles.heroCta}
            onClick={() => onRequestRead?.(ms)}
            aria-label={`Request to read ${ms.title}`}
          >
            REQUEST TO READ
          </button>
        )}
      </article>
    </div>
  );
}

/* ── Compact card (stub) ──────────────────────────────────────────── */
function CompactCard({ ms, onRequestRead }: Props) {
  return (
    <article className={styles.compactCard}>
      <div className={styles.compactGenre}>{ms.genre.toUpperCase()}</div>
      <h3 className={`serif ${styles.compactTitle}`}>{ms.title}</h3>
      <div className={styles.compactByline}>{ms.author.toUpperCase()}</div>
      <div className={styles.compactFooter}>
        <SlotStatus ms={ms} />
        <button className={styles.cta} onClick={() => onRequestRead?.(ms)}>
          Request →
        </button>
      </div>
    </article>
  );
}

/* ── Public export ────────────────────────────────────────────────── */
export function ManuscriptCard(props: Props) {
  const variant = props.variant ?? 'standard';
  if (variant === 'hero')    return <HeroCard    {...props} />;
  if (variant === 'compact') return <CompactCard {...props} />;
  return <StandardCard {...props} />;
}
