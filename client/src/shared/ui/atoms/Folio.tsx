import styles from './Folio.module.css';

export const Folio = ({ n, of }: { n: number; of: number }) => (
  <span className={styles.folio}>
    {String(n).padStart(2, '0')} <span className={styles.slash}>/</span> {String(of).padStart(2, '0')}
  </span>
);
