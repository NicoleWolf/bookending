import { useState } from 'react';
import styles from './ListingPreview.module.css';

export interface ListingDraft {
  title: string;
  authorName: string | null;
  genre: string | null;
  subgenre: string | null;
  description: string | null;
  contentRating: string | null;
  contentWarnings: string[];
  betaMode: string;
  maxBetaReaders: number | null;
  readerCount: number;
  coverUrl: string | null;
  estimatedPages: number | null;
  wordCount: number;
}

export function completenessScore(d: ListingDraft): number {
  let n = 0;
  if (d.coverUrl)                           n++;
  if (d.genre)                              n++;
  if (d.description?.trim())               n++;
  if (d.contentRating)                      n++;
  if (d.betaMode && d.betaMode !== 'CLOSED') n++;
  return n;
}

const TOTAL_FIELDS = 5;

function betaModeLabel(mode: string): string {
  if (mode === 'PUBLIC')       return 'Open enrollment';
  if (mode === 'REQUEST')      return 'Apply to read';
  if (mode === 'INVITE_ONLY')  return 'Invite only';
  return 'Closed';
}

function slotText(mode: string, max: number | null, filled: number): string | null {
  if (mode === 'CLOSED' || mode === 'INVITE_ONLY') return null;
  if (max === null) return 'Ongoing';
  const remaining = max - filled;
  if (remaining <= 0) return 'Full';
  if (remaining === 1) return '1 spot left';
  return `${remaining} spots open`;
}

function ContentWarnings({ warnings }: { warnings: string[] }) {
  const [open, setOpen] = useState(false);
  if (warnings.length === 0) return null;
  return (
    <div className={styles.cn}>
      <button
        className={styles.cnToggle}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span aria-hidden="true">⚠</span>{' '}
        <span className={styles.cnCount}>{warnings.length} content note{warnings.length !== 1 ? 's' : ''}</span>
        {' '}— {open ? 'hide' : 'view'}
      </button>
      {open && (
        <ul className={styles.cnList}>
          {warnings.map(w => <li key={w}>{w}</li>)}
        </ul>
      )}
    </div>
  );
}

interface Props {
  draft: ListingDraft;
}

export function ListingPreview({ draft }: Props) {
  const score        = completenessScore(draft);
  const pct          = Math.round((score / TOTAL_FIELDS) * 100);
  const allDone      = score === TOTAL_FIELDS;
  const genreEyebrow = [draft.genre, draft.subgenre].filter(Boolean).join(' · ').toUpperCase();
  const slot         = slotText(draft.betaMode, draft.maxBetaReaders, draft.readerCount);

  return (
    <div className={styles.panel}>

      {/* ── Label ──────────────────────────────────────────── */}
      <div className={styles.panelLabel}>Listing preview</div>

      {/* ── Listing body ───────────────────────────────────── */}
      <div className={styles.listing}>

        {/* Cover */}
        <div className={styles.coverCol}>
          {draft.coverUrl ? (
            <img src={draft.coverUrl} alt="" className={styles.coverImg} />
          ) : (
            <div className={styles.coverPlaceholder} aria-label="No cover uploaded">
              <span className={styles.coverHint}>Upload<br />a cover</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className={styles.contentCol}>

          <div className={styles.genreEyebrow} data-missing={!draft.genre ? '' : undefined}>
            {genreEyebrow || 'GENRE NOT SET'}
          </div>

          <h2 className={`serif ${styles.title}`} data-missing={!draft.title ? '' : undefined}>
            {draft.title || 'Untitled'}
          </h2>

          {draft.authorName && (
            <div className={styles.byline}>{draft.authorName.toUpperCase()}</div>
          )}

          <p className={`serif ${styles.description}`} data-missing={!draft.description?.trim() ? '' : undefined}>
            {draft.description?.trim() || 'No description yet — add one in Metadata.'}
          </p>

          <ContentWarnings warnings={draft.contentWarnings} />

          {draft.contentRating && (
            <div className={styles.ratingBadge}>{draft.contentRating}</div>
          )}

          <div className={styles.spacer} />
          <hr className={styles.divider} />

          <div className={styles.meta}>
            {draft.estimatedPages ? `${draft.estimatedPages} PP` : '— PP'}
            {' · '}
            {draft.wordCount ? `${Math.round(draft.wordCount / 1000)}K WORDS` : '— WORDS'}
          </div>

          <div className={styles.accessRow}>
            <span
              className={styles.modeLabel}
              data-missing={draft.betaMode === 'CLOSED' || !draft.betaMode ? '' : undefined}
            >
              {betaModeLabel(draft.betaMode)}
            </span>
            {slot && (
              <>
                <span className={styles.metaDot} aria-hidden="true">·</span>
                <span className={styles.slotLabel}>{slot}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Completeness bar ───────────────────────────────── */}
      <div className={styles.completeness} data-done={allDone ? '' : undefined}>
        <div className={styles.completeTrack}>
          <div className={styles.completeFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.completeLabel}>
          {allDone ? '✓ Listing complete' : `${score} of ${TOTAL_FIELDS} fields complete`}
        </span>
      </div>

    </div>
  );
}
