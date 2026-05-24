import { useState, useEffect } from 'react';
import styles from './LaunchCountdownCard.module.css';

interface Props {
  launchDate: string; // "YYYY-MM-DD"
  bookTitle:  string;
}

interface TimeLeft {
  days:    number;
  hours:   number;
  minutes: number;
  seconds: number;
  past:    boolean;
}

function computeTimeLeft(launchDate: string): TimeLeft {
  const target = new Date(launchDate + 'T00:00:00').getTime();
  const diff   = target - Date.now();

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };

  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    past:    false,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function LaunchCountdownCard({ launchDate, bookTitle }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(launchDate));

  useEffect(() => {
    setTimeLeft(computeTimeLeft(launchDate));
    const id = setInterval(() => setTimeLeft(computeTimeLeft(launchDate)), 1000);
    return () => clearInterval(id);
  }, [launchDate]);

  const formattedDate = new Date(launchDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className={styles.card}>
      {/* Announces the once-only transition to "now available"; timer itself stays aria-live="off" */}
      <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {timeLeft.past ? `${bookTitle} is now available.` : ''}
      </div>

      <div className={styles.eyebrow}>
        {timeLeft.past ? 'Now available' : 'Launch countdown'}
      </div>

      {timeLeft.past ? (
        <div className={styles.available}>
          <div className={styles.availableMark} aria-hidden="true">✓</div>
          <p className={`serif ${styles.bookTitle}`}>{bookTitle}</p>
          <div className={styles.dateLabel}>
            OUT SINCE {formattedDate.toUpperCase()}
          </div>
        </div>
      ) : (
        <>
          <div
            className={styles.countdown}
            role="timer"
            aria-label={`${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds until launch`}
            aria-live="off"
          >
            <div className={styles.unit}>
              <div className={`serif ${styles.number}`}>{timeLeft.days}</div>
              <div className={styles.unitLabel}>DAYS</div>
            </div>
            <div className={styles.sep} aria-hidden="true">·</div>
            <div className={styles.unit}>
              <div className={`serif ${styles.number}`}>{pad(timeLeft.hours)}</div>
              <div className={styles.unitLabel}>HRS</div>
            </div>
            <div className={styles.sep} aria-hidden="true">·</div>
            <div className={styles.unit}>
              <div className={`serif ${styles.number}`}>{pad(timeLeft.minutes)}</div>
              <div className={styles.unitLabel}>MIN</div>
            </div>
            <div className={styles.sep} aria-hidden="true">·</div>
            <div className={styles.unit}>
              <div className={`serif ${styles.number}`}>{pad(timeLeft.seconds)}</div>
              <div className={styles.unitLabel}>SEC</div>
            </div>
          </div>

          <div className={styles.bookMeta}>
            <p className={`serif ${styles.bookTitle}`}>{bookTitle}</p>
            <div className={styles.dateLabel}>
              LAUNCHING {formattedDate.toUpperCase()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
