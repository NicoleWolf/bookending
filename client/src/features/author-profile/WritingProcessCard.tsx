import styles from './TextCard.module.css';

const SOFT_LIMIT = 600;

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function WritingProcessCard({ value, onChange }: Props) {
  const count = value.length;
  const over  = count > SOFT_LIMIT;

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.label}>Writing Process</span>
        <span className={styles.hint}>
          How you work — your routine, tools, habits. Readers love this.
        </span>
      </div>
      <div className={styles.textareaWrap}>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={5}
          placeholder="Describe your writing process…"
          aria-label="Writing Process"
        />
        <span className={styles.counter} data-over={over ? '' : undefined}>
          {count}/{SOFT_LIMIT}
        </span>
      </div>
    </div>
  );
}
