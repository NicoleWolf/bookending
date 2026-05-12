import type { ReaderProfileRecord } from '@bookending/shared';
import type { AppNotification } from '../notifications/data';
import { useAutosave } from './useAutosave';
import { AvailabilityCard } from './AvailabilityCard';
import { ProfileCard } from './ProfileCard';
import { AboutCard } from './AboutCard';
import { GenresCard } from './GenresCard';
import styles from './ReaderProfileEdit.module.css';

interface Props {
  profile: ReaderProfileRecord;
  onProfileChange: (p: ReaderProfileRecord) => void;
  onDone: () => void;
  onToast: (n: AppNotification) => void;
}

export function ReaderProfileEdit({ profile, onProfileChange, onDone, onToast }: Props) {
  const { saveState, retry } = useAutosave(profile);

  function patch(delta: Partial<ReaderProfileRecord>) {
    onProfileChange({ ...profile, ...delta });
  }

  function handleAvailabilityToggle(value: boolean) {
    const prev = profile.availableForReads;
    patch({ availableForReads: value });
    if (!value && prev) {
      onToast({
        id: `avail-off-${Date.now()}`,
        type: 'STAGE_NUDGE',
        stage: 'Profile',
        message: 'Closed to new requests.',
        read: false,
        receivedAt: new Date().toISOString(),
        onUndo: () => patch({ availableForReads: true }),
      });
    }
  }

  function handleAboutChange(bio: string) {
    const prev = profile.bio;
    patch({ bio: bio || null });
    if (!bio && prev) {
      onToast({
        id: `about-cleared-${Date.now()}`,
        type: 'STAGE_NUDGE',
        stage: 'Profile',
        message: 'About cleared.',
        read: false,
        receivedAt: new Date().toISOString(),
        onUndo: () => patch({ bio: prev }),
      });
    }
  }

  function handleGenresChange(genres: string) {
    const prev = profile.genres;
    patch({ genres: genres || null });
    if (!genres && prev) {
      onToast({
        id: `genres-empty-${Date.now()}`,
        type: 'STAGE_NUDGE',
        stage: 'Profile',
        message: "You won't appear in genre searches.",
        read: false,
        receivedAt: new Date().toISOString(),
        onUndo: () => patch({ genres: prev }),
      });
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Sticky top bar ──────────────────────────────────────── */}
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span className={styles.breadcrumbItem}>Readers</span>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.breadcrumbItem}>{profile.name}</span>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">Edit</span>
        </nav>

        <div className={styles.topBarRight}>
          <span
            className={styles.saveIndicator}
            aria-live="polite"
            aria-atomic="true"
            data-state={saveState}
          >
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved'  && '✓ Saved'}
            {saveState === 'error'  && (
              <>
                Couldn&apos;t save &middot;{' '}
                <button className={styles.retryBtn} onClick={retry} type="button">
                  Retry
                </button>
              </>
            )}
          </span>

          <button className={styles.doneBtn} onClick={onDone} type="button">
            Done
          </button>
        </div>
      </div>

      {/* ── Card stack ──────────────────────────────────────────── */}
      <div className={styles.content}>
        <AvailabilityCard
          available={profile.availableForReads}
          onChange={handleAvailabilityToggle}
        />
        <ProfileCard
          name={profile.name}
          location={profile.location ?? ''}
          avatarUrl={profile.avatarUrl ?? null}
          onNameChange={name => patch({ name })}
          onLocationChange={location => patch({ location: location || null })}
          onAvatarChange={avatarUrl => patch({ avatarUrl })}
        />
        <AboutCard
          bio={profile.bio ?? ''}
          onChange={handleAboutChange}
        />
        <GenresCard
          genresRaw={profile.genres ?? ''}
          onChange={handleGenresChange}
        />
      </div>
    </div>
  );
}
