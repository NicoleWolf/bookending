import type { CSSProperties } from 'react';
import styles from './Avatar.module.css';

type AvatarTone = 'ink' | 'paper' | 'accent' | 'gold' | 'muted';

export const Avatar = ({ initials, tone = 'ink', size = 28, src }: {
  initials: string;
  tone?: AvatarTone;
  size?: number;
  src?: string | null;
}) => (
  <div
    className={styles.avatar}
    data-tone={src ? 'img' : tone}
    style={{ '--sz': `${size}px` } as CSSProperties}
  >
    {src
      ? <img src={src} className={styles.avatarImg} alt="" />
      : initials
    }
  </div>
);
