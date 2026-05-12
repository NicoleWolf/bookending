import styles from './FeaturedProjectCard.module.css';

interface ManuscriptOption {
  id: string;
  title: string;
}

interface Props {
  manuscripts: ManuscriptOption[];
  featuredId: string | null;
  onChange: (id: string | null) => void;
}

export function FeaturedProjectCard({ manuscripts, featuredId, onChange }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.label}>Featured Project</span>
        <span className={styles.hint}>
          Pin one manuscript to the top of your public profile.
        </span>
      </div>

      {manuscripts.length === 0 ? (
        <p className={styles.empty}>No manuscripts yet. Start one in the Editor.</p>
      ) : (
        <div className={styles.options}>
          <button
            className={styles.option}
            type="button"
            data-active={featuredId === null ? '' : undefined}
            onClick={() => onChange(null)}
          >
            {featuredId === null && <span className={styles.dot} aria-hidden="true" />}
            <span className={styles.optionLabel}>None</span>
          </button>

          {manuscripts.map(m => (
            <button
              key={m.id}
              className={styles.option}
              type="button"
              data-active={featuredId === m.id ? '' : undefined}
              onClick={() => onChange(m.id)}
            >
              {featuredId === m.id && <span className={styles.dot} aria-hidden="true" />}
              <span className={styles.optionLabel}>{m.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
