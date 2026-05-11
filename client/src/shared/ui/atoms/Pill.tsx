import type { ReactNode } from 'react';
import styles from './Pill.module.css';

type PillTone = 'neutral' | 'paper' | 'accent' | 'accent-solid' | 'good' | 'danger' | 'solid' | 'plum';

export const Pill = ({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) => (
  <span className={styles.pill} data-tone={tone}>
    {children}
  </span>
);
