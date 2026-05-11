import type { ReactNode } from 'react';
import styles from './DarkHeroCard.module.css';

interface DarkHeroCardProps {
  density?: 'full' | 'compact';
  children: ReactNode;
}

export const DarkHeroCard = ({ density = 'compact', children }: DarkHeroCardProps) => (
  <div className={styles.card} data-density={density}>
    {children}
  </div>
);
