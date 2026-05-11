import type { CSSProperties, ReactNode } from 'react';
import styles from './ActivityRailItem.module.css';

interface ActivityRailItemProps {
  dotColor: string;
  time: string;
  children: ReactNode;
}

export const ActivityRailItem = ({ dotColor, time, children }: ActivityRailItemProps) => (
  <div className={styles.item}>
    <span
      className={styles.dot}
      aria-hidden="true"
      style={{ '--dot-color': dotColor } as CSSProperties}
    />
    <span className={`serif ${styles.body}`}>{children}</span>
    <span className={`mono ${styles.time}`}>{time}</span>
  </div>
);
