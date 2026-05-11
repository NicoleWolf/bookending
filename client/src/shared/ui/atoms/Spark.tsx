import styles from './Spark.module.css';

export const Spark = ({ values = [], w = 120, h = 28, stroke = 'var(--paper)' }: { values?: number[]; w?: number; h?: number; stroke?: string }) => {
  if (!values.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className={styles.spark}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
};
