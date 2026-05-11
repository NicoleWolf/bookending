import type { HubRecommendation } from '@bookending/shared';
import styles from './Hub.module.css';

interface HouseSuggestsProps {
  recommendation: HubRecommendation | null;
  readerProfile:  'new' | 'returning' | 'all_caught_up';
  onDismiss:      () => void;
  onAction:       (msRef: string | null, verb: string) => void;
}

const EMPTY_COPY: Record<string, { body: string; action: string }> = {
  new: {
    body:   'Bookending opens with whatever you pick up first. The shelf below is where the house has gathered things you might like.',
    action: 'Browse Discover →',
  },
  returning: {
    body:   'Quiet week. Writers you follow are working on something — or wander into Discover and see what\'s new.',
    action: 'Visit your Following →',
  },
  all_caught_up: {
    body:   "You're current on everything you're reading. Nothing waiting on you.",
    action: 'Browse Discover →',
  },
};

export default function HouseSuggests({ recommendation, readerProfile, onDismiss, onAction }: HouseSuggestsProps) {
  if (!recommendation) {
    const empty = EMPTY_COPY[readerProfile] ?? EMPTY_COPY.new;
    return (
      <div className={styles.houseSuggests}>
        <div className={styles.houseLabel}>THE HOUSE</div>
        <p
          className={`serif ${styles.houseBody}`}
          dangerouslySetInnerHTML={{ __html: empty.body }}
        />
        <div className={styles.houseActions}>
          <button className={styles.houseActionPrimary}>{empty.action}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.houseSuggests}>
      <div className={styles.houseLabel}>THE HOUSE SUGGESTS</div>
      <p
        className={`serif ${styles.houseBody}`}
        dangerouslySetInnerHTML={{ __html: recommendation.label }}
      />
      <div className={styles.houseActions}>
        <button
          className={styles.houseActionPrimary}
          onClick={() => onAction(recommendation.manuscriptRef, recommendation.actionVerb)}
        >
          {recommendation.action}
        </button>
        <button className={styles.houseActionDismiss} onClick={onDismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
