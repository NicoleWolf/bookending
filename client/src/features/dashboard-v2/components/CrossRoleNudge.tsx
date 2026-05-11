import styles from './CrossRoleNudge.module.css';

interface CrossRoleNudgeProps {
  role: 'writing' | 'reading';
  message: string;
  onSwitch: () => void;
  onDismiss: () => void;
}

export const CrossRoleNudge = ({ role, message, onSwitch, onDismiss }: CrossRoleNudgeProps) => (
  <div className={styles.nudge} role="status">
    <p className={`serif ${styles.message}`}>{message}</p>
    <div className={styles.actions}>
      <button className={`mono ${styles.switchBtn}`} onClick={onSwitch}>
        Switch to {role === 'writing' ? 'reading' : 'writing'} →
      </button>
      <button className={`mono ${styles.dismissBtn}`} onClick={onDismiss} aria-label="Dismiss notice">
        ×
      </button>
    </div>
  </div>
);
