export const Bars = ({ values = [], w = 160, h = 36, color = 'var(--paper)' }: { values?: number[]; w?: number; h?: number; color?: string }) => {
  const max = Math.max(...values, 1);
  const bw = w / (values.length * 1.6);
  const gap = bw * 0.6;
  return (
    <svg width={w} height={h}>
      {values.map((v, i) => {
        const bh = (v / max) * h;
        return <rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} fill={color} opacity={0.4 + 0.6 * (v / max)} />;
      })}
    </svg>
  );
};
