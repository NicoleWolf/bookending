import styles from './AvailabilityCard.module.css';

interface Props {
  available: boolean;
  onChange: (value: boolean) => void;
}

export function AvailabilityCard({ available, onChange }: Props) {
  return (
    <div className={styles.card} data-available={available ? '' : undefined}>
      <div className={styles.row}>
        <div className={styles.left}>
          <span className={styles.dot} aria-hidden="true" />
          <div className={styles.text}>
            <span className={styles.title}>
              {available ? 'Open to beta read requests' : 'Closed to new requests'}
            </span>
            <span className={styles.helper}>
              {available
                ? 'Writers can invite you. Your profile stays visible either way.'
                : "You won't appear in writers' invite searches. Re-open when you have capacity."}
            </span>
          </div>
        </div>

        <button
          className={styles.toggle}
          type="button"
          role="switch"
          aria-checked={available}
          aria-label={available ? 'Close to new requests' : 'Open to beta read requests'}
          data-on={available ? '' : undefined}
          onClick={() => onChange(!available)}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>
    </div>
  );
}
