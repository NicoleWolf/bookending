import { useState } from 'react';
import type { ListingDraft } from './ListingPreview';
import styles from './TeaserComposer.module.css';

const PLATFORMS = [
  { id: 'twitter',   label: 'X (Twitter)'  },
  { id: 'instagram', label: 'Instagram'    },
  { id: 'facebook',  label: 'Facebook'     },
];

interface Props {
  draft:          ListingDraft;
  launchDate:     string;
  socialAccounts: string[];
  onPost:         (caption: string, socialPlatforms: string[]) => void;
  onClose:        () => void;
}

export function TeaserComposer({ draft, launchDate, socialAccounts, onPost, onClose }: Props) {
  const [caption,       setCaption]       = useState('');
  const [includeCover,  setIncludeCover]  = useState(!!draft.coverUrl);
  const [includeBlurb,  setIncludeBlurb]  = useState(!!draft.description?.trim());
  const [includeLaunch, setIncludeLaunch] = useState(!!launchDate);
  const [socialOn, setSocialOn] = useState<Record<string, boolean>>(
    Object.fromEntries(socialAccounts.map(id => [id, true]))
  );

  const hasSocial      = socialAccounts.length > 0;
  const selectedSocial = socialAccounts.filter(id => socialOn[id]);

  const authorInitials = (draft.authorName ?? 'A')
    .split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();

  const launchFormatted = launchDate
    ? new Date(launchDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null;

  const blurbSnippet = draft.description?.trim()
    ? draft.description.trim().slice(0, 140) + (draft.description.trim().length > 140 ? '…' : '')
    : null;

  const genreLabel = [draft.genre, draft.subgenre].filter(Boolean).join(' · ');

  function handlePost() {
    onPost(caption.trim(), selectedSocial);
  }

  return (
    <div className={styles.composer}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.headerLabel}>Compose teaser</span>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
      </div>

      {/* ── Include toggles ─────────────────────────────── */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Include</span>
        <div className={styles.includeToggles}>
          {draft.coverUrl && (
            <button
              type="button"
              className={styles.includeChip}
              data-active={includeCover ? '' : undefined}
              aria-pressed={includeCover}
              onClick={() => setIncludeCover(v => !v)}
            >
              {includeCover && <span className={styles.chipCheck} aria-hidden="true">✓</span>}
              Cover
            </button>
          )}
          {draft.description?.trim() && (
            <button
              type="button"
              className={styles.includeChip}
              data-active={includeBlurb ? '' : undefined}
              aria-pressed={includeBlurb}
              onClick={() => setIncludeBlurb(v => !v)}
            >
              {includeBlurb && <span className={styles.chipCheck} aria-hidden="true">✓</span>}
              Blurb
            </button>
          )}
          {launchDate && (
            <button
              type="button"
              className={styles.includeChip}
              data-active={includeLaunch ? '' : undefined}
              aria-pressed={includeLaunch}
              onClick={() => setIncludeLaunch(v => !v)}
            >
              {includeLaunch && <span className={styles.chipCheck} aria-hidden="true">✓</span>}
              Launch date
            </button>
          )}
        </div>
      </div>

      {/* ── Caption ─────────────────────────────────────── */}
      <div className={styles.section}>
        <label htmlFor="tc-caption" className={styles.sectionLabel}>Caption</label>
        <textarea
          id="tc-caption"
          className={styles.captionTextarea}
          placeholder="Say something to your community…"
          value={caption}
          rows={3}
          onChange={e => setCaption(e.target.value)}
        />
      </div>

      {/* ── Post preview ────────────────────────────────── */}
      <div className={styles.previewSection}>
        <span className={styles.sectionLabel}>Preview</span>
        <div className={styles.postCard}>

          <div className={styles.postAuthorRow}>
            <div className={styles.postAvatar}>{authorInitials}</div>
            <div className={styles.postAuthorInfo}>
              <span className={styles.postAuthorName}>{draft.authorName ?? 'You'}</span>
              <span className={styles.postTime}>now</span>
            </div>
          </div>

          {caption.trim() && (
            <p className={`serif ${styles.postCaption}`}>{caption.trim()}</p>
          )}

          <div className={styles.postAttachment}>
            {includeCover && draft.coverUrl ? (
              <img src={draft.coverUrl} alt="" className={styles.attachCover} />
            ) : (
              <div className={styles.attachCoverPlaceholder} aria-hidden="true" />
            )}
            <div className={styles.attachMeta}>
              {genreLabel && (
                <div className={styles.attachGenre}>{genreLabel.toUpperCase()}</div>
              )}
              <div className={`serif ${styles.attachTitle}`}>{draft.title}</div>
              {includeBlurb && blurbSnippet && (
                <p className={styles.attachBlurb}>{blurbSnippet}</p>
              )}
              {includeLaunch && launchFormatted && (
                <div className={styles.attachLaunch}>
                  LAUNCHING {launchFormatted.toUpperCase()}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Social ──────────────────────────────────────── */}
      <div className={styles.socialSection}>
        <span className={styles.sectionLabel}>Share to social</span>
        {hasSocial ? (
          <div className={styles.platformToggles}>
            {PLATFORMS.filter(p => socialAccounts.includes(p.id)).map(p => (
              <button
                key={p.id}
                type="button"
                className={styles.platformChip}
                data-active={socialOn[p.id] ? '' : undefined}
                aria-pressed={!!socialOn[p.id]}
                onClick={() => setSocialOn(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
              >
                {socialOn[p.id] && <span className={styles.chipCheck} aria-hidden="true">✓</span>}
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.socialNoAccounts}>
            No accounts connected.{' '}
            <button type="button" className={styles.connectLink}>
              Connect in Brand Profile →
            </button>
          </p>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className={styles.footer}>
        <button type="button" className={styles.postBtn} onClick={handlePost}>
          {selectedSocial.length > 0
            ? `Post to community + ${selectedSocial.length} platform${selectedSocial.length === 1 ? '' : 's'} →`
            : 'Post to community →'}
        </button>
        <p className={styles.followerNote}>
          {draft.authorName ? `Followers of ${draft.authorName}` : 'Followers'} will be notified.
        </p>
      </div>

    </div>
  );
}
