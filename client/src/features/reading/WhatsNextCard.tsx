import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../auth';
import styles from './WhatsNextCard.module.css';

interface WhatsNextData {
  authorName:           string;
  currentProject:       string | null;
  currentProjectBlurb:  string | null;
  nextRelease:          string | null;
  nextReleaseDate:      string | null;
  isFollowing:          boolean;
}

interface Props {
  msRef: string;
}

export default function WhatsNextCard({ msRef }: Props) {
  const { session } = useAuth();
  const [data,        setData]        = useState<WhatsNextData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    void api.get<WhatsNextData>(`/api/reading/${msRef}/whats-next`)
      .then(d => { setData(d); setIsFollowing(d.isFollowing); })
      .catch(() => {});
  }, [session?.token, msRef]);

  function toggleFollow() {
    const next = !isFollowing;
    setIsFollowing(next);
    void (next
      ? api.post(`/api/reading/${msRef}/follow-author`, {})
      : api.del(`/api/reading/${msRef}/unfollow-author`)
    ).catch(() => setIsFollowing(!next));
  }

  if (!data) return null;
  if (!data.currentProject && !data.nextRelease) return null;

  const firstName = data.authorName.split(' ')[0] ?? data.authorName;

  return (
    <div className={styles.card}>
      <div className={styles.ornament} aria-hidden="true">· · ·</div>

      <p className={`label ${styles.eyebrow}`}>
        What {data.authorName} is working on next
      </p>

      {data.currentProject && (
        <div className={styles.project}>
          <span className={`label ${styles.projectLabel}`}>Now writing</span>
          <h2 className={`serif ${styles.projectTitle}`}>{data.currentProject}</h2>
          {data.currentProjectBlurb && (
            <p className={`serif ${styles.projectBlurb}`}>{data.currentProjectBlurb}</p>
          )}
        </div>
      )}

      {data.nextRelease && (
        <div className={styles.release}>
          <span className={`label ${styles.releaseLabel}`}>Upcoming release</span>
          <div className={styles.releaseRow}>
            <span className={`serif ${styles.releaseTitle}`}>{data.nextRelease}</span>
            {data.nextReleaseDate && (
              <span className={`label ${styles.releaseDate}`}>{data.nextReleaseDate}</span>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.followBtn}
        data-following={isFollowing ? '' : undefined}
        aria-pressed={isFollowing}
        onClick={toggleFollow}
        aria-label={isFollowing ? `Unfollow ${data.authorName}` : `Follow ${data.authorName} for launch updates`}
      >
        {isFollowing ? `✓ Following ${firstName}` : `Follow ${firstName} for updates →`}
      </button>
    </div>
  );
}
