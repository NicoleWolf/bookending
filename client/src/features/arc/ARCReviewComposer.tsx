import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import styles from './ARCReviewComposer.module.css';

interface Props {
  manuscriptId: string;
  onBack: () => void;
  onPosted: () => void;
}

interface ManuscriptInfo {
  title: string;
  author?: { name: string };
}

export default function ARCReviewComposer({ manuscriptId, onBack, onPosted }: Props) {
  const [ms,          setMs]          = useState<ManuscriptInfo | null>(null);
  const [body,        setBody]        = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [posted,      setPosted]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    api.get<ManuscriptInfo>(`/api/reading/${manuscriptId}/manuscript`)
      .then(data => setMs(data))
      .catch(() => {});
  }, [manuscriptId]);

  async function handlePost() {
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/manuscripts/${manuscriptId}/arc/review`, { body: body.trim() });
      setPosted(true);
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy() {
    void navigator.clipboard.writeText(body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const bookTitle = ms?.title ?? 'this book';
  const authorName = ms?.author?.name ?? 'the author';

  if (posted) {
    return (
      <div className={styles.wrap}>
        <div className={styles.successBlock}>
          <div className={`label ${styles.successEyebrow}`}>Review posted</div>
          <h2 className={`serif ${styles.successTitle}`}>Thank you for reading.</h2>
          <p className={styles.successBody}>
            Your review of <em>{bookTitle}</em> will appear on the book's listing the day it launches.
            You're now credited as an early reader — a credit that stays with you on your profile.
          </p>
          <div className={styles.crossPostRow}>
            <span className={styles.crossPostHint}>Want to share it elsewhere?</span>
            <button className={styles.copyBtn} onClick={handleCopy} disabled={copied}>
              {copied ? 'Copied ✓' : 'Copy review'}
            </button>
            <span className={styles.crossPostMuted}>for Goodreads, Amazon, or anywhere else — that's between you and them.</span>
          </div>
          <button className={styles.backBtn} onClick={onBack}>Back to My ARCs</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.navBack} onClick={onBack}>← Back</button>

      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={`label ${styles.eyebrow}`}>Advance reader copy · {authorName}</div>
          <h1 className={`serif ${styles.title}`}>{bookTitle}</h1>
          <div className={styles.disclosureTag}>
            Your review will be tagged as an <em>advance reader copy</em> — applied automatically, no action required.
          </div>
        </div>

        <div className={styles.voiceNote}>
          <p>Honest means honest. If the book doesn't work for you, say so. If it works, say why.</p>
          <p>Authors learn more from your real reaction than from a polite one.</p>
        </div>

        <textarea
          className={styles.reviewArea}
          rows={10}
          placeholder={`Your review of ${bookTitle}…`}
          value={body}
          onChange={e => setBody(e.target.value)}
          autoFocus
        />

        <div className={styles.charCount}>{body.length} characters</div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.foot}>
          <button
            className={styles.postBtn}
            disabled={!body.trim() || submitting}
            onClick={handlePost}
          >
            {submitting ? 'Posting…' : 'Post review'}
          </button>
          <p className={styles.footNote}>
            Posted reviews are tagged as advance reader copies and appear on the book's listing at launch.
          </p>
        </div>
      </div>
    </div>
  );
}
