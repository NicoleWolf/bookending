import styles from './VersionList.module.css';

export interface VersionMeta {
  id:        string;
  number:    number;
  label:     string;
  createdAt: string;
}

interface Props {
  versions:   VersionMeta[];
  selectedId: string | null;
  onSelect:   (id: string) => void;
  onRestore:  () => void;
}

function formatVersionDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
}

export default function VersionList({ versions, selectedId, onSelect, onRestore }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className="mono">VERSIONS</span>
      </div>

      <div className={styles.list}>
        {versions.length === 0 ? (
          <p className={styles.empty}>No saved versions yet.<br />Click "Save version" to create one.</p>
        ) : (
          versions.map(v => (
            <button
              key={v.id}
              className={styles.item}
              data-active={v.id === selectedId ? '' : undefined}
              onClick={() => onSelect(v.id)}
            >
              <span className={styles.label}>{v.label}</span>
              <span className={styles.date}>{formatVersionDate(v.createdAt)}</span>
            </button>
          ))
        )}
      </div>

      {selectedId && (
        <div className={styles.footer}>
          <button className={styles.restoreBtn} onClick={onRestore}>
            Restore this version
          </button>
        </div>
      )}
    </div>
  );
}
