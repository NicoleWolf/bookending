import type { CSSProperties, ReactNode } from 'react';
import styles from './Btn.module.css';

type BtnTone = 'primary' | 'accent' | 'ghost' | 'bare' | 'ghost-dark' | 'bare-dark';

interface BtnProps {
  tone?: BtnTone;
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}

export const Btn = ({ tone = 'ghost', children, icon, onClick, style }: BtnProps) => (
  <button
    onClick={onClick}
    className={styles.btn}
    data-tone={tone}
    style={style}
  >
    {children}{icon}
  </button>
);
