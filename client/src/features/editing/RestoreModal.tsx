import styles from './RestoreModal.module.css';

interface Props {
  versionLabel: string;
  isRestoring:  boolean;
  onConfirm:    () => void;
  onCancel:     () => void;
}

export default function RestoreModal({ versionLabel, isRestoring, onConfirm, onCancel }: Props) {
  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <p className={`mono ${styles.eyebrow}`}>RESTORE VERSION</p>
        <h2 className={`serif ${styles.title}`}>Restore {versionLabel}?</h2>
        <p className={styles.body}>
          Your entire current draft will be replaced with this version. Any unsaved changes will be lost.
        </p>
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel} disabled={isRestoring}>
            Cancel
          </button>
          <button className={styles.confirm} onClick={onConfirm} disabled={isRestoring}>
            {isRestoring ? 'Restoring…' : 'Restore'}
          </button>
        </div>
      </div>
    </div>
  );
}
