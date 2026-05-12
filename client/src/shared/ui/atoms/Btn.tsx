import type { CSSProperties, ReactNode } from 'react';
import styles from './Btn.module.css';

type BtnTone = 'primary' | 'accent' | 'ghost' | 'bare' | 'ghost-dark' | 'bare-dark';

interface BtnProps {
  tone?: BtnTone;
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const Btn = ({ tone = 'ghost', children, icon, onClick, disabled, className, style }: BtnProps) => (
  <button
    onClick={onClick}
    className={`${styles.btn}${className ? ` ${className}` : ''}`}
    data-tone={tone}
    disabled={disabled}
    style={style}
  >
    {children}{icon}
  </button>
);
