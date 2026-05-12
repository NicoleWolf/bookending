import { useState } from 'react';
import type { AppNotification } from '../notifications/data';
import { useAuthorProfileSave, type AuthorProfileData } from './useAuthorProfileSave';
import { ProfileCard } from '../reader-profile/ProfileCard';
import { AuthorAboutCard } from './AuthorAboutCard';
import { WritingProcessCard } from './WritingProcessCard';
import { AuthorGenresCard } from './AuthorGenresCard';
import { FeaturedProjectCard } from './FeaturedProjectCard';
import { PrivacyCard } from './PrivacyCard';
import { QAManagement } from './QAManagement';
import type { QAEntry, PendingQuestion } from '../author-profiles/types';
import styles from './AuthorProfileEdit.module.css';

type InternalTab = 'Profile' | 'Q&A';

interface ManuscriptOption {
  id: string;
  title: string;
}

interface Props {
  profile: AuthorProfileData;
  manuscripts: ManuscriptOption[];
  qaList: QAEntry[];
  pendingQuestions: PendingQuestion[];
  onProfileChange: (p: AuthorProfileData) => void;
  onQaChange: (list: QAEntry[]) => void;
  onPendingChange: (list: PendingQuestion[]) => void;
  onDone: () => void;
  onToast: (n: AppNotification) => void;
}

export function AuthorProfileEdit({
  profile, manuscripts,
  qaList, pendingQuestions,
  onProfileChange, onQaChange, onPendingChange,
  onDone, onToast,
}: Props) {
  const [tab, setTab] = useState<InternalTab>('Profile');
  const { saveState, retry } = useAuthorProfileSave(profile);

  function patch(delta: Partial<AuthorProfileData>) {
    onProfileChange({ ...profile, ...delta });
  }

  return (
    <div className={styles.page}>
      {/* ── Sticky top bar ──────────────────────────────────────── */}
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span className={styles.breadcrumbItem}>Authors</span>
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

      {/* ── Internal tabs ───────────────────────────────────────── */}
      <div className={styles.internalTabBar} role="tablist">
        {(['Profile', 'Q&A'] as InternalTab[]).map(t => (
          <button
            key={t}
            className={styles.internalTab}
            role="tab"
            aria-selected={tab === t}
            data-active={tab === t ? '' : undefined}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Card stack ──────────────────────────────────────────── */}
      {tab === 'Profile' && (
        <div className={styles.content}>
          {manuscripts.length === 0 && (
            <div className={styles.visibilityBanner}>
              <span className={styles.visibilityBannerDot} aria-hidden="true" />
              <div className={styles.visibilityBannerText}>
                <span className={styles.visibilityBannerTitle}>Not yet visible in the directory</span>
                <span className={styles.visibilityBannerHint}>
                  Create your first manuscript in the Editor to appear in Author Profiles.
                </span>
              </div>
            </div>
          )}
          <ProfileCard
            name={profile.name}
            location={profile.location ?? ''}
            avatarUrl={profile.avatarUrl ?? null}
            onNameChange={name => patch({ name })}
            onLocationChange={location => patch({ location: location || null })}
            onAvatarChange={avatarUrl => patch({ avatarUrl })}
          />
          <AuthorAboutCard
            bio={profile.bio ?? ''}
            onChange={bio => patch({ bio: bio || null })}
          />
          <WritingProcessCard
            value={profile.writingProcess ?? ''}
            onChange={v => patch({ writingProcess: v || null })}
          />
          <AuthorGenresCard
            genres={profile.genres}
            subgenres={profile.subgenres}
            onGenresChange={genres => patch({ genres })}
            onSubgenresChange={subgenres => patch({ subgenres })}
          />
          <FeaturedProjectCard
            manuscripts={manuscripts}
            featuredId={profile.featuredManuscriptId}
            onChange={featuredManuscriptId => patch({ featuredManuscriptId })}
          />
          <PrivacyCard
            showActivityPublicly={profile.showActivityPublicly}
            onChange={showActivityPublicly => patch({ showActivityPublicly })}
          />
        </div>
      )}

      {tab === 'Q&A' && (
        <div className={styles.content}>
          <QAManagement
            authorId={profile.id}
            authorFirstName={profile.name.split(' ')[0]}
            qaList={qaList}
            pendingQuestions={pendingQuestions}
            onQaChange={onQaChange}
            onPendingChange={onPendingChange}
            onToast={onToast}
          />
        </div>
      )}
    </div>
  );
}
