import type { ReactNode } from 'react';
import styles from './SectionHead.module.css';

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  kicker?: string;
  children?: ReactNode;
}

export const SectionHead = ({ eyebrow, title, kicker, children }: SectionHeadProps) => (
  <div className={styles.head}>
    <div>
      <div className={`label ${styles.eyebrow}`}>{eyebrow}</div>
      <h2 className={`serif ${styles.title}`}>{title}</h2>
      {kicker && <div className={`serif ${styles.kicker}`}>{kicker}</div>}
    </div>
    <div className={styles.actions}>{children}</div>
  </div>
);
