import styles from './DashboardFooter.module.css';

export const DashboardFooter = () => (
  <footer className={styles.footer}>
    <span className={`mono ${styles.copy}`}>BOOKENDING · A WORKBENCH FOR SELF-PUBLISHERS · MMXXVI</span>
    <span className={`mono ${styles.copy}`}>SET IN NEWSREADER &amp; INTER · PRINTED FROM PORTLAND</span>
  </footer>
);
