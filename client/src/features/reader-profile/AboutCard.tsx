import styles from './AboutCard.module.css';

const SOFT_LIMIT = 500;

interface Props {
  bio: string;
  onChange: (v: string) => void;
}

export function AboutCard({ bio, onChange }: Props) {
  const count = bio.length;
  const over  = count > SOFT_LIMIT;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.label}>Reader bio</span>
        <span className={styles.hint}>
          A few sentences on how you read and what you bring. Shown on your public profile.
        </span>
      </div>

      <div className={styles.textareaWrap}>
        <textarea
          id="rp-about"
          className={styles.textarea}
          value={bio}
          onChange={e => onChange(e.target.value)}
          rows={5}
          aria-label="About"
          aria-describedby="rp-about-count"
        />
        <span
          id="rp-about-count"
          className={styles.counter}
          data-over={over ? '' : undefined}
          aria-live="polite"
        >
          {count}/{SOFT_LIMIT}
        </span>
      </div>
    </div>
  );
}
