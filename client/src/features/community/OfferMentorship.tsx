import { useState } from 'react';
import { Avatar } from '../../shared/ui/atoms';
import type { Mentor } from './types';
import styles from './OfferMentorship.module.css';

const SPECIALTY_OPTIONS = [
  'Literary Fiction', 'Historical Fiction', 'Genre Fiction', 'Crime & Thriller',
  'Romance', 'Science Fiction', 'Horror',
  'Plotting & Structure', 'Voice & Style', 'Scene-Level Craft', 'Pacing & Middles',
  'Short Fiction', 'Self-Publishing', 'Direct Sales',
  'Memoir & Autofiction', 'Cover & Design',
];

const FORMAT_OPTIONS = [
  'Written correspondence',
  'Video calls',
  'Manuscript read-throughs',
  'Voice notes',
];

// ── Success state ────────────────────────────────────────────────── //
function SuccessView({ onBack }: { onBack: () => void }) {
  return (
    <div className={styles.successBody}>
      <div className={styles.successIcon}>✓</div>
      <h2 className={`serif ${styles.successTitle}`}>Your listing is live.</h2>
      <p className={styles.successSub}>
        Authors looking for mentorship can now find you in the directory.
        You can pause or update your listing at any time.
      </p>
      <button className={styles.btnPrimary} onClick={onBack}>
        Back to mentors →
      </button>
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────── //
interface OfferMentorshipProps {
  onBack: () => void;
  onSubmit: (mentor: Omit<Mentor, 'id' | 'mentees'>) => void;
}

export default function OfferMentorship({ onBack, onSubmit }: OfferMentorshipProps) {
  const [bio,         setBio]         = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [formats,     setFormats]     = useState<string[]>([]);
  const [titles,      setTitles]      = useState('');
  const [maxMentees,  setMaxMentees]  = useState('3');
  const [status,      setStatus]      = useState<'available' | 'paused'>('available');
  const [submitted,   setSubmitted]   = useState(false);

  function toggleSpecialty(s: string) {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function toggleFormat(f: string) {
    setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  function handleSubmit() {
    if (!bio.trim() || specialties.length === 0) return;
    onSubmit({
      name:        'Billie Wolf',
      initials:    'BW',
      tone:        'paper',
      books:       parseInt(titles, 10) || 0,
      specialties,
      bio:         bio.trim(),
      available:   status,
    });
    setSubmitted(true);
  }

  const valid = bio.trim().length > 0 && specialties.length > 0;

  if (submitted) return <SuccessView onBack={onBack} />;

  const previewBooks    = parseInt(titles, 10) || 0;
  const bioPreview      = bio.trim() || 'Your bio will appear here…';
  const specPreview     = specialties.length > 0 ? specialties : ['Your specialties'];

  return (
    <div>
      <div className={styles.breadcrumb}>
        <button className={styles.backBtn} onClick={onBack}>← Back to mentors</button>
      </div>

      <div className={styles.layout}>
        {/* ── Form ── */}
        <div className={styles.formCol}>

          <p className={styles.formIntro}>
            Offer your experience to authors earlier in their journey. Sessions are
            informal — a letter, a call, a read-through. You set the pace and the terms.
          </p>

          {/* Pitch / bio */}
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>Your pitch</div>
            <div className={styles.field}>
              <label className={styles.label}>What do you offer?</label>
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder="What's your experience? Who do you work best with? What should a mentee bring to you?…"
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>
          </div>

          {/* Counts */}
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>
                Published titles&ensp;<span className={styles.labelOpt}>(optional)</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                className={styles.input}
                value={titles}
                onChange={e => setTitles(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Max mentees at once</label>
              <select className={styles.select} value={maxMentees} onChange={e => setMaxMentees(e.target.value)}>
                {['1', '2', '3', '5', '10'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Specialties */}
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>
              Specialties&ensp;<span className={styles.sectionReq}>pick at least one</span>
            </div>
            <div className={styles.pillGrid}>
              {SPECIALTY_OPTIONS.map(s => (
                <button
                  key={s}
                  className={styles.pill}
                  data-selected={specialties.includes(s) ? 'true' : undefined}
                  onClick={() => toggleSpecialty(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* How you work */}
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>
              How you work&ensp;<span className={styles.labelOpt}>(optional)</span>
            </div>
            <div className={styles.formatGrid}>
              {FORMAT_OPTIONS.map(f => (
                <label
                  key={f}
                  className={styles.formatOpt}
                  data-selected={formats.includes(f) ? 'true' : undefined}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={formats.includes(f)}
                    onChange={() => toggleFormat(f)}
                  />
                  <span className={styles.formatLabel}>{f}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>Availability</div>
            <div className={styles.statusOpts}>
              {([
                ['available', 'Available now',  'Taking new mentees immediately'            ] as const,
                ['paused',    'Paused',          'Not taking new mentees at this time'       ] as const,
              ]).map(([val, title, desc]) => (
                <div
                  key={val}
                  className={styles.statusOpt}
                  data-active={status === val ? 'true' : undefined}
                  onClick={() => setStatus(val)}
                >
                  <input type="radio" className={styles.radio} readOnly checked={status === val} />
                  <div>
                    <div className={styles.optTitle}>{title}</div>
                    <div className={styles.optDesc}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formActions}>
            <button className={styles.btnGhost} onClick={onBack}>Cancel</button>
            <button
              className={styles.btnPrimary}
              data-disabled={!valid ? 'true' : undefined}
              onClick={handleSubmit}
            >
              Post listing →
            </button>
          </div>
        </div>

        {/* ── Live preview ── */}
        <div className={styles.previewCol}>
          <div className={styles.previewLabel}>LISTING PREVIEW</div>
          <div className={styles.previewCard}>
            <div className={styles.previewCardHead}>
              <Avatar initials="BW" tone="paper" size={38} />
              <div className={styles.previewInfo}>
                <div className={styles.previewName}>Billie Wolf</div>
                <div className={styles.previewStats}>
                  {previewBooks} {previewBooks === 1 ? 'BOOK' : 'BOOKS'} · 0 MENTEES
                </div>
              </div>
              <span className={styles.previewBadge} data-available={status}>
                {status === 'available' ? 'AVAILABLE' : 'PAUSED'}
              </span>
            </div>

            <div className={styles.previewSpecialties}>
              {specPreview.map(s => (
                <span key={s} className={styles.previewTag}>{s}</span>
              ))}
            </div>

            <p className={styles.previewBio} data-placeholder={!bio.trim() ? 'true' : undefined}>
              {bioPreview}
            </p>

            {formats.length > 0 && (
              <div className={styles.previewFormats}>
                {formats.map(f => (
                  <span key={f} className={styles.previewFormat}>✓ {f}</span>
                ))}
              </div>
            )}
          </div>

          <p className={styles.previewNote}>
            This is how your listing will appear to authors looking for mentorship.
          </p>
        </div>
      </div>
    </div>
  );
}
