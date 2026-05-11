import type { CSSProperties } from 'react';
import styles from './Placeholder.module.css';

export const Placeholder = ({ label = 'IMAGE', w = '100%', h = 120, tone = 'dark' }: { label?: string; w?: string | number; h?: number; tone?: 'dark' | 'light' }) => (
  <div
    className={styles.placeholder}
    data-tone={tone}
    style={{ '--ph-w': typeof w === 'number' ? `${w}px` : w, '--ph-h': `${h}px` } as CSSProperties}
  >
    <span className={styles.label} data-tone={tone}>{label}</span>
  </div>
);
