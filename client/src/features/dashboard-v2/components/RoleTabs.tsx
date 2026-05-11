import styles from './RoleTabs.module.css';

interface RoleTabsProps {
  active: 'writing' | 'reading';
  writingUnread: number;
  readingUnread: number;
  onSwitch: (role: 'writing' | 'reading') => void;
}

export const RoleTabs = ({ active, writingUnread, readingUnread, onSwitch }: RoleTabsProps) => (
  <div className={styles.tabs} role="tablist">
    <button
      role="tab"
      aria-selected={active === 'writing'}
      className={styles.tab}
      data-active={active === 'writing' || undefined}
      onClick={() => onSwitch('writing')}
    >
      <span className={`serif ${styles.label}`}>Writing</span>
      {writingUnread > 0 && (
        <span
          className={styles.dot}
          aria-label={`${writingUnread} unread items on Writing side`}
        />
      )}
    </button>

    <button
      role="tab"
      aria-selected={active === 'reading'}
      className={styles.tab}
      data-active={active === 'reading' || undefined}
      onClick={() => onSwitch('reading')}
    >
      <span className={`serif ${styles.label}`}>Reading</span>
      {readingUnread > 0 && (
        <span
          className={styles.dot}
          aria-label={`${readingUnread} unread items on Reading side`}
        />
      )}
    </button>
  </div>
);
