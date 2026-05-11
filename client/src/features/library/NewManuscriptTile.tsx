import styles from './NewManuscriptTile.module.css';

interface NewManuscriptTileProps {
  onAdd: () => void;
}

export default function NewManuscriptTile({ onAdd }: NewManuscriptTileProps) {
  return (
    <button
      type="button"
      className={styles.tile}
      onClick={onAdd}
      aria-label="Create new manuscript"
    >
      <span className={styles.icon}>+</span>
      <span className={styles.label}>NEW MANUSCRIPT</span>
    </button>
  );
}
