import styles from './LibraryMasthead.module.css';

export type LibraryView = 'discover' | 'browse' | 'search';

interface Props {
  totalManuscripts: number;
  openManuscripts:  number;
  activeView:       LibraryView;
  onDiscover:       () => void;
  onBrowse:         () => void;
  onSearch:         () => void;
}

export function LibraryMasthead({
  totalManuscripts, openManuscripts, activeView,
  onDiscover, onBrowse, onSearch,
}: Props) {
  return (
    <header className={styles.masthead}>
      {/* Top row: kicker left, nav right */}
      <div className={styles.topRow}>
        <span className={styles.kicker}>§ 08 · THE READING ROOM</span>
        <nav className={styles.nav} aria-label="Library navigation">
          <button
            className={styles.navItem}
            data-active={activeView === 'discover' ? '' : undefined}
            aria-current={activeView === 'discover' ? 'page' : undefined}
            onClick={onDiscover}
          >
            Discover
          </button>
          <button
            className={styles.navItem}
            data-active={activeView === 'browse' ? '' : undefined}
            aria-current={activeView === 'browse' ? 'page' : undefined}
            onClick={onBrowse}
          >
            Browse by genre
          </button>
          <button
            className={styles.navItem}
            data-active={activeView === 'search' ? '' : undefined}
            aria-current={activeView === 'search' ? 'page' : undefined}
            onClick={onSearch}
          >
            Search
          </button>
        </nav>
      </div>

      {/* Title + subtitle */}
      <h1 className={`serif ${styles.title}`}>Library</h1>
      <p className={`serif ${styles.subtitle}`}>
        Manuscripts open for beta readers — browse, discover, request to read.
      </p>

      {/* Meta band */}
      <div className={styles.metaBand}>
        <div className={styles.metaItems}>
          <span className={styles.metaItem}>Vol. I · Issue 4</span>
          <span className={styles.metaSep} aria-hidden="true">·</span>
          <span className={styles.metaItem}>May 2026</span>
          <span className={styles.metaSep} aria-hidden="true">·</span>
          <span className={styles.metaItem}>{totalManuscripts} manuscripts listed</span>
          <span className={styles.metaSep} aria-hidden="true">·</span>
          <span className={`${styles.metaItem} ${styles.metaOpen}`}>
            {openManuscripts} open for readers
          </span>
        </div>
        <button className={styles.filterBtn} aria-expanded="false">
          + Filter <span aria-hidden="true">⌄</span>
        </button>
      </div>
    </header>
  );
}
