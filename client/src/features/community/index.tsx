import { useState } from 'react';
import { SectionHead, Btn, Avatar } from '../../shared/ui/atoms';
import { IconArrow, IconArrowUp, IconReaders, IconCheck } from '../../shared/ui/icons';
import type { Mentor } from './types';
import WritingCircles from './WritingCircles';
import OfferMentorship from './OfferMentorship';
import styles from './Community.module.css';

interface CommunityProps {
  section?: 'mentorship' | 'circle';
}

export default function Community({ section = 'mentorship' }: CommunityProps) {
  const view = section;

  const [mentors,       setMentors]       = useState<Mentor[]>([]);
  const [requested,     setRequested]     = useState<Set<number>>(new Set());
  const [showOfferForm, setShowOfferForm] = useState(false);

  const availLabel: Record<'available' | 'full' | 'paused', string> = {
    available: 'Available', full: 'Full roster', paused: 'Paused',
  };

  const mentorshipView = showOfferForm ? (
    <OfferMentorship
      onBack={() => setShowOfferForm(false)}
      onSubmit={m => {
        setMentors(prev => [{ ...m, id: Date.now(), mentees: 0 }, ...prev]);
        setShowOfferForm(false);
      }}
    />
  ) : (
    <div>
      <div className={styles.mentorIntro}>
        <div>
          <p className={styles.mentorIntroText}>
            Experienced authors offering one-on-one guidance to authors earlier in their journey. Sessions are informal — a letter, a call, a manuscript read-through.
          </p>
        </div>
        <Btn tone="ghost" icon={<IconArrowUp size={14} />} onClick={() => setShowOfferForm(true)}>Offer mentorship</Btn>
      </div>

      <div className={styles.mentorGrid}>
        {mentors.map(m => {
          const isRequested = requested.has(m.id);
          return (
            <div key={m.id} className={styles.mentorCard}>
              <div className={styles.mentorCardHead}>
                <Avatar initials={m.initials} tone={m.tone} size={38} />
                <div className={styles.mentorInfo}>
                  <div className={styles.mentorName}>{m.name}</div>
                  <div className={styles.mentorStats}>
                    <span className={styles.mentorStat}>{m.books} BOOKS</span>
                    <span className={styles.mentorStatDivider} />
                    <span className={styles.mentorStat}>{m.mentees} MENTEES</span>
                  </div>
                </div>
                <span className={styles.availBadge} data-available={m.available}>
                  {availLabel[m.available].toUpperCase()}
                </span>
              </div>

              <div className={styles.mentorSpecialties}>
                {m.specialties.map(s => (
                  <span key={s} className={styles.mentorTag}>{s}</span>
                ))}
              </div>

              <p className={styles.mentorBio}>{m.bio}</p>

              <div className={styles.mentorCardFoot}>
                {m.available === 'available' ? (
                  <Btn
                    tone={isRequested ? 'ghost' : 'primary'}
                    icon={isRequested ? <IconCheck size={13} /> : <IconArrow size={13} />}
                    className={styles.btnMentorFull}
                    onClick={() => setRequested(p => { const n = new Set(p); isRequested ? n.delete(m.id) : n.add(m.id); return n; })}
                  >
                    {isRequested ? 'Request sent' : 'Request mentorship'}
                  </Btn>
                ) : (
                  <Btn tone="ghost" className={styles.btnMentorFull} disabled>
                    {m.available === 'full' ? 'Roster full' : 'Currently paused'}
                  </Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {requested.size > 0 && (
        <div className={styles.pendingBox}>
          <div>
            <div className={`label ${styles.pendingLabel}`}>Pending requests</div>
            <p className={styles.pendingText}>
              {requested.size} request{requested.size !== 1 ? 's' : ''} sent — mentors typically respond within a week.
            </p>
          </div>
          <div className={`serif ${styles.pendingCount}`}>{requested.size}</div>
        </div>
      )}
    </div>
  );

  return (
    <section className={styles.section}>
      <SectionHead
        eyebrow="§ 05 · Community"
        title="The Common Press"
        kicker="Mentorship and a writing circle — built around the authors working here."
      >
        <Btn tone="ghost"><IconReaders size={14} /> 1,204 members</Btn>
      </SectionHead>

      {view === 'mentorship' && mentorshipView}
      {view === 'circle'     && <WritingCircles />}
    </section>
  );
}

export function CommunityDashboardCard() {
  return (
    <section className={styles.dashCard}>
      <div className={styles.dashHeader}>
        <div>
          <div className={`label ${styles.dashEyebrow}`}>§ 05 · The Common Press · Community</div>
          <h2 className={`serif ${styles.dashTitle}`}>Authors at your shoulder.</h2>
          <p className={`serif ${styles.dashSubtext}`}>Other independents, working right now. Borrow a beta-reader, swap a cover critique, share a printer who didn't disappoint.</p>
        </div>
        <Btn tone="bare" icon={<IconArrow size={14} />} className={styles.btnInk}>Open the common room</Btn>
      </div>
      <div className={styles.dashCardsGrid} />
      <div className={styles.karmaBar}>
        <div className={styles.karmaLedger}>
          <span className={`label ${styles.karmaLabel}`}>Your karma ledger</span>
          <span className={`serif ${styles.karmaScore}`}>+12</span>
          <span className={styles.karmaDetails}>· 4 critiques given · 2 vendors reviewed · 1 reader vouched</span>
        </div>
        <span className={styles.karmaSlogan}>SPEND IT, DON'T SAVE IT</span>
      </div>
    </section>
  );
}
