import type { ReactNode } from 'react';
import styles from './HeroGrid.module.css';

interface HeroGridProps {
  left: ReactNode;
  right: ReactNode;
}

export const HeroGrid = ({ left, right }: HeroGridProps) => (
  <div className={styles.grid}>
    <div className={styles.left}>{left}</div>
    <div className={styles.right} aria-hidden="true">{right}</div>
  </div>
);
