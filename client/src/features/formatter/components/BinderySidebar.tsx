import { STEPS } from '../steps';
import styles from './BinderySidebar.module.css';

interface Props {
  activeStep: number;
  onStepChange: (step: number) => void;
}

export default function BinderySidebar({ activeStep, onStepChange }: Props) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={`mono ${styles.sectionMark}`}>§ THE BINDERY</span>
        <p className={`serif ${styles.tagline}`}>Seven rooms.<br />One book.</p>
      </div>

      <hr className="rule" />

      <nav className={styles.steps}>
        {STEPS.map(step => {
          const isActive   = step.n === activeStep;
          const isComplete = step.n < activeStep;
          const isLocked   = step.n > activeStep;

          return (
            <button
              key={step.n}
              className={styles.step}
              data-active={isActive   ? '' : undefined}
              data-complete={isComplete ? '' : undefined}
              data-locked={isLocked   ? '' : undefined}
              onClick={() => !isLocked && onStepChange(step.n)}
              disabled={isLocked}
            >
              <div className={styles.stepRow}>
                <span className={`mono ${styles.stepNum}`}>
                  {String(step.n).padStart(2, '0')}
                </span>
                <span className={`sans ${styles.stepLabel}`}>{step.label}</span>
              </div>
              <span className={`mono ${styles.stepSub}`}>{step.sub}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.savedRow}>
          <span className={`mono ${styles.savedDot}`} />
          <span className={`mono ${styles.savedText}`}>SAVED · JUST NOW</span>
        </div>
        <p className={`sans ${styles.savedNote}`}>
          You can leave at any time. The shelf will keep your place.
        </p>
      </div>
    </aside>
  );
}
