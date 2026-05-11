import { BookCover } from '../../shared/ui/atoms';
import type { CatalogManuscript } from './data';
import styles from './ManuscriptCard.module.css';

interface Props {
  ms: CatalogManuscript;
}

export function ManuscriptCard({ ms }: Props) {
  const slotsText =
    ms.status === 'open'     ? `${ms.readerCount}/${ms.maxReaders} readers` :
    ms.status === 'waitlist' ? 'Waitlist' :
    'Closed';

  const excerpt = ms.description.length > 110
    ? ms.description.slice(0, 110).trimEnd() + '…'
    : ms.description;

  return (
    <div className={styles.card}>
      <div className={styles.cover}>
        <BookCover title={ms.title} scheme={ms.scheme} />
      </div>
      <div className={styles.body}>
        {ms.ownManuscript && (
          <div className={styles.ownBadge}>YOUR MANUSCRIPT</div>
        )}
        <div className={styles.subgenre}>{ms.subgenre}</div>
        <div className={`serif ${styles.title}`}>{ms.title}</div>
        <div className={styles.author}>{ms.author}</div>
        <p className={`serif ${styles.excerpt}`}>{excerpt}</p>
        <div className={styles.footer}>
          <span className={styles.slots} data-status={ms.status}>
            {slotsText}
          </span>
          <button className={styles.cta} disabled={ms.status !== 'open'}>
            {ms.status === 'open'     ? 'Request →' :
             ms.status === 'waitlist' ? 'Waitlist' :
             'Closed'}
          </button>
        </div>
      </div>
    </div>
  );
}
