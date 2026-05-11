import styles from './BookCover.module.css';

interface BookCoverProps {
  title: string;
  author?: string;
  spine?: string;
}

export function BookCover({ title, author, spine = 'spine-amber' }: BookCoverProps) {
  return (
    <div className={styles.cover} data-spine={spine}>
      {author && <div className={styles.author}>{author}</div>}
      <div className={styles.spacer} />
      <div className={styles.title}>{title}</div>
    </div>
  );
}
