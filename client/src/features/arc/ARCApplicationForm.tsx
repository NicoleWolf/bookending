import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import styles from './ARCApplicationForm.module.css';

interface ArcProgramInfo {
  id: string; isOpen: boolean; mode: 'MANUAL' | 'AUTO'; cap: number | null;
  reviewDeadline: string | null; launchDate: string | null;
  myApplication: { id: string; status: string } | null;
}

interface ManuscriptInfo {
  id: string; title: string; author: { name: string };
}

interface Props {
  manuscriptId: string;
  onBack: () => void;
  onSubmitted: () => void;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ARCApplicationForm({ manuscriptId, onBack, onSubmitted }: Props) {
  const [program,     setProgram]     = useState<ArcProgramInfo | null>(null);
  const [manuscript,  setManuscript]  = useState<ManuscriptInfo | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [pitch,       setPitch]       = useState('');
  const [ackReview,   setAckReview]   = useState(false);
  const [ackDeadline, setAckDeadline] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<ArcProgramInfo | null>(`/api/manuscripts/${manuscriptId}/arc/program`),
      // Fetch manuscript info via reading route which is reader-accessible
      api.get<{ title: string; author?: { name: string } } | null>(`/api/reading/${manuscriptId}/manuscript`).catch(() => null),
    ]).then(([prog, ms]) => {
      setProgram(prog);
      if (ms) {
        setManuscript({
          id: manuscriptId,
          title: ms.title,
          author: { name: ms.author?.name ?? 'the author' },
        });
      }
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [manuscriptId]);

  async function handleSubmit() {
    if (!ackReview || !ackDeadline) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/manuscripts/${manuscriptId}/arc/apply`, {
        pitch: pitch.trim() || null,
      });
      setSubmitted(true);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.formWrap}>
        <div className={styles.loading}>Loading…</div>
      </div>
    );
  }

  if (!program?.isOpen) {
    return (
      <div className={styles.formWrap}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <div className={styles.closedNotice}>
          This ARC program is not currently open.
        </div>
      </div>
    );
  }

  const bookTitle = manuscript?.title ?? 'this book';
  const authorName = manuscript?.author?.name ?? 'the author';
  const deadlineStr = program.reviewDeadline ? fmtDate(program.reviewDeadline) : '[deadline]';
  const launchStr   = program.launchDate     ? fmtDate(program.launchDate)     : '[launch date]';
  const isAutoAccept = program.mode === 'AUTO';

  if (submitted) {
    return (
      <div className={styles.formWrap}>
        <div className={styles.successBlock}>
          <div className={`label ${styles.successEyebrow}`}>ARC</div>
          <h2 className={`serif ${styles.successTitle}`}>
            {isAutoAccept ? "You're in." : 'Application submitted.'}
          </h2>
          <p className={styles.successBody}>
            {isAutoAccept
              ? `Your advance copy of ${bookTitle} is ready. Head to My ARCs to start reading.`
              : `${authorName} will review your application. You'll hear back soon.`}
          </p>
          <button className={styles.successBtn} onClick={onBack}>Back to profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formWrap}>
      <button className={styles.backBtn} onClick={onBack}>← Back</button>

      <div className={styles.formInner}>
        <div className={styles.formHead}>
          <div className={`label ${styles.formEyebrow}`}>Advance reader copy · {authorName}</div>
          <h1 className={`serif ${styles.formTitle}`}>{bookTitle}</h1>
          <p className={styles.formSubhead}>
            {isAutoAccept
              ? `Accepted on submission${program.cap ? `, up to ${program.cap} readers.` : '.'}`
              : 'The author personally reviews each application.'}
          </p>
        </div>

        {/* Commitment copy — the editorial centrepiece */}
        <div className={styles.commitmentBlock}>
          <h2 className={`serif ${styles.commitmentHeading}`}>What you're agreeing to</h2>
          <p className={styles.commitmentBody}>
            If accepted, you'll receive <em>{bookTitle}</em> to read on Bookending. In return, you'll share
            an honest review — your genuine response, whatever that is — by {deadlineStr}, ahead of the
            book's launch on {launchStr}.
          </p>
          <p className={styles.commitmentBody}>
            Your review will be posted to Bookending and tagged as an advance reader copy, in keeping with
            review disclosure norms. You're welcome to cross-post to other platforms; that's between you
            and them.
          </p>
          <p className={styles.commitmentBody}>
            Honest means honest. If the book doesn't work for you, say so. If it works, say why. Authors
            learn more from your real reaction than from a polite one.
          </p>

          <h2 className={`serif ${styles.commitmentHeading}`}>What you get</h2>
          <p className={styles.commitmentBody}>
            Your review appears on the book's listing the day it launches. You'll be credited as an early
            reader of <em>{bookTitle}</em> — a credit that stays with you on your reader profile, alongside
            every other book you've helped bring into the world.
          </p>
        </div>

        {/* Acknowledgments */}
        <div className={styles.ackSection}>
          <label className={styles.ackRow}>
            <input
              type="checkbox"
              className={styles.ackCheck}
              checked={ackReview}
              onChange={e => setAckReview(e.target.checked)}
            />
            <span className={styles.ackLabel}>
              I'll post an honest review by {deadlineStr}.
            </span>
          </label>
          <label className={styles.ackRow}>
            <input
              type="checkbox"
              className={styles.ackCheck}
              checked={ackDeadline}
              onChange={e => setAckDeadline(e.target.checked)}
            />
            <span className={styles.ackLabel}>
              I understand the deadline falls before the launch on {launchStr}.
            </span>
          </label>
        </div>

        {/* Optional pitch */}
        <div className={styles.pitchSection}>
          <label className={`label ${styles.pitchLabel}`}>
            Anything you'd like {authorName} to know? <span className={styles.pitchOptional}>(optional)</span>
          </label>
          <textarea
            className={styles.pitchArea}
            rows={4}
            placeholder="Your reading interests, what draws you to this book, how you discovered it — or leave it blank. Your reader profile does most of the work."
            value={pitch}
            onChange={e => setPitch(e.target.value)}
          />
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <div className={styles.formFoot}>
          <button
            className={styles.submitBtn}
            disabled={!ackReview || !ackDeadline || submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? '…'
              : isAutoAccept
              ? 'Accept and start reading'
              : 'Submit application'}
          </button>
          <p className={styles.submitHint}>
            Stepping back later doesn't affect your standing — it's better than a missed deadline, for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
