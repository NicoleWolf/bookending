import type { HubRailItem } from '@bookending/shared';
import styles from './Hub.module.css';

const CATEGORY_LABEL: Record<string, string> = {
  editorial_pick: 'EDITORIAL PICK',
  from_circle:    'FROM YOUR CIRCLE',
  nudge:          'A NUDGE',
};

interface HouseRailProps {
  items: HubRailItem[];
}

export default function HouseRail({ items }: HouseRailProps) {
  if (items.length === 0) return null;

  return (
    <aside className={styles.rail}>
      <div className={styles.railHeader}>The House</div>
      {items.slice(0, 4).map((item, i) => (
        <div key={i} className={styles.railItem}>
          <p className={`serif ${styles.railBody}`}>{item.body}</p>
          <div className={styles.railCategory}>{CATEGORY_LABEL[item.category] ?? item.category.toUpperCase()}</div>
        </div>
      ))}
    </aside>
  );
}
