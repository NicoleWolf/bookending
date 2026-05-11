import { ActivityRailItem } from '../../../shared/ui/atoms/ActivityRailItem';
import styles from './TodayRail.module.css';
import type { RailItem } from '../stub';

export const TodayRail = ({ items }: { items: RailItem[] }) => (
  <aside className={styles.rail}>
    <span className={`mono ${styles.eyebrow}`}>§ Today</span>
    <p className={`serif ${styles.kicker}`}>Live from your circle</p>

    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={i} className={styles.item}>
          <ActivityRailItem dotColor={item.dotColor} time={item.time}>
            {item.body}
          </ActivityRailItem>
        </li>
      ))}
    </ul>

    <button className={`mono ${styles.feedBtn}`}>Open the full feed →</button>
  </aside>
);
