import styles from './PrivacyCard.module.css';

interface Props {
  showActivityPublicly: boolean;
  onChange: (value: boolean) => void;
}

export function PrivacyCard({ showActivityPublicly, onChange }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.label}>Activity Privacy</span>
        <span className={styles.hint}>
          Control whether your writing activity feed is visible on your public profile.
        </span>
      </div>

      <div className={styles.row} data-on={showActivityPublicly ? '' : undefined}>
        <div className={styles.rowLeft}>
          <span className={styles.dot} aria-hidden="true" />
          <div className={styles.text}>
            <span className={styles.title}>
              {showActivityPublicly ? 'Activity feed is public' : 'Activity feed is hidden'}
            </span>
            <span className={styles.helper}>
              {showActivityPublicly
                ? 'Readers can see your writing milestones and updates.'
                : 'Your activity timeline is only visible to you.'}
            </span>
          </div>
        </div>

        <button
          className={styles.toggle}
          type="button"
          role="switch"
          aria-checked={showActivityPublicly}
          aria-label={showActivityPublicly ? 'Hide activity feed' : 'Show activity feed publicly'}
          data-on={showActivityPublicly ? '' : undefined}
          onClick={() => onChange(!showActivityPublicly)}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>
    </div>
  );
}
