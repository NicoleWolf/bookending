import styles from './Toast.module.css';
import type { AppNotification } from './data';

interface Props {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
  onCta?: (authorId: string, tab?: string, bookId?: string) => void;
}

export default function ToastStack({ toasts, onDismiss, onCta }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.stack}>
      {toasts.map(t => (
        <div key={t.id} className={styles.toast} data-type={t.type}>
          <div className={styles.body}>
            <span className={styles.stage}>{t.stage}</span>
            <p className={styles.message}>{t.message}</p>
            {t.cta && onCta && (
              <button
                className={styles.cta}
                onClick={() => { onDismiss(t.id); onCta(t.cta!.authorId, t.cta!.tab, t.cta!.bookId); }}
              >
                {t.cta.label} <span aria-hidden="true">→</span>
              </button>
            )}
            {t.onUndo && (
              <button
                className={styles.cta}
                onClick={() => { t.onUndo!(); onDismiss(t.id); }}
              >
                Undo
              </button>
            )}
          </div>
          <button className={styles.dismiss} onClick={() => onDismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
