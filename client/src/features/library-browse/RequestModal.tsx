import { useRef, useEffect, useState } from 'react';
import type { CatalogManuscript } from './data';
import styles from './RequestModal.module.css';

interface Props {
  ms:       CatalogManuscript;
  onSubmit: (ms: CatalogManuscript, note: string) => void;
  onCancel: () => void;
}

export function RequestModal({ ms, onSubmit, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  /* Open as modal on mount; close on Escape via native dialog behaviour */
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (!el.open) el.showModal();

    function onClose() { onCancel(); }
    el.addEventListener('close', onClose);
    return () => el.removeEventListener('close', onClose);
  }, [onCancel]);

  /* Close when clicking the ::backdrop */
  function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const outside =
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top  || e.clientY > rect.bottom;
    if (outside) dialogRef.current?.close();
  }

  async function handleSubmit() {
    setSending(true);
    await onSubmit(ms, note);
    dialogRef.current?.close();
  }

  const authorFirst = ms.author.split(' ').pop() ?? ms.author;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleClick}
      aria-labelledby="req-title"
      aria-describedby="req-body"
    >
      <div className={styles.inner}>
        {/* Eyebrow */}
        <div className={styles.eyebrow}>REQUEST TO READ</div>

        {/* Title */}
        <h2 id="req-title" className={`serif ${styles.title}`}>
          <em>{ms.title}</em>, by {ms.author}
        </h2>

        {/* Body */}
        <p id="req-body" className={styles.body}>
          {ms.author} will see your reader profile and decide whether to accept
          your request. About seven days to hear back.
        </p>

        {/* Profile preview (placeholder) */}
        <div className={styles.profilePreview}>
          <div className={styles.profileLabel}>YOUR READER PROFILE</div>
          <p className={`serif ${styles.profileNote}`}>
            Your reading preferences and history will be visible to {authorFirst}.
          </p>
        </div>

        {/* Note textarea */}
        <label className={styles.noteLabel} htmlFor="req-note">
          A note for the author — optional
        </label>
        <textarea
          id="req-note"
          className={styles.noteInput}
          rows={3}
          placeholder="e.g. I've been following your blog for two years and the themes here are exactly what I read…"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <p className={styles.noteHelper}>Authors read these. Keep it brief.</p>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={sending}
            type="button"
          >
            {sending ? 'Sending…' : 'Send request →'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
