import styles from './TextCard.module.css';

const SOFT_LIMIT = 600;

interface Props {
  bio: string;
  onChange: (v: string) => void;
}

export function AuthorAboutCard({ bio, onChange }: Props) {
  const count = bio.length;
  const over  = count > SOFT_LIMIT;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.label}>Author bio</span>
        <span className={styles.hint}>
          Who you are, what you write. Shown on your public profile.
        </span>
      </div>
      <div className={styles.textareaWrap}>
        <textarea
          className={styles.textarea}
          value={bio}
          onChange={e => onChange(e.target.value)}
          rows={5}
          placeholder="A short author bio…"
          aria-label="Author bio"
        />
        <span className={styles.counter} data-over={over ? '' : undefined}>
          {count}/{SOFT_LIMIT}
        </span>
      </div>
    </div>
  );
}
