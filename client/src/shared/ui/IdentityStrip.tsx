import { Avatar } from './atoms';
import styles from './IdentityStrip.module.css';

interface Props {
  name:        string;
  displayName: string | null;
  location:    string | null;
  avatarUrl:   string | null;
  onGoToAccountProfile: () => void;
}

export function IdentityStrip({ name, displayName, location, avatarUrl, onGoToAccountProfile }: Props) {
  const shown    = displayName || name;
  const initials = name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');

  return (
    <div className={styles.strip}>
      <Avatar initials={initials} tone="paper" size={40} src={avatarUrl ?? undefined} />
      <div className={styles.text}>
        <span className={styles.name}>
          {shown}
          {location && <span className={styles.location}> · {location}</span>}
        </span>
        <button type="button" className={styles.link} onClick={onGoToAccountProfile}>
          Edit photo, name, and location in your account profile →
        </button>
      </div>
    </div>
  );
}
