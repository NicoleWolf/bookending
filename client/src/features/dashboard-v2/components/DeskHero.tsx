import { DarkHeroCard } from '../../../shared/ui/atoms/DarkHeroCard';
import { Pill } from '../../../shared/ui/atoms/Pill';
import { Btn } from '../../../shared/ui/atoms/Btn';
import styles from './DeskHero.module.css';
import type { DeskPrimaryItem } from '../stub';

export const DeskHero = ({ item }: { item: DeskPrimaryItem }) => (
  <DarkHeroCard density="compact">
    <div className={styles.header}>
      <Pill tone="accent-solid">{item.pill}</Pill>
      <span className={`mono ${styles.context}`}>{item.context}</span>
    </div>
    <p className={`serif ${styles.headline}`}>{item.headline}</p>
    <p className={styles.reasoning}>{item.reasoning}</p>
    <div className={styles.actions}>
      <Btn tone="accent">{item.primaryCta}</Btn>
      <Btn tone="ghost-dark">{item.secondaryCta}</Btn>
      <Btn tone="bare-dark">Dismiss</Btn>
    </div>
  </DarkHeroCard>
);
