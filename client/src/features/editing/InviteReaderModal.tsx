import { useState } from 'react';
import type { Manuscript } from './types';
import styles from './InviteReaderModal.module.css';

type Step = 'form' | 'preview' | 'sent';

interface Props {
  defaultManuscriptId: string;
  manuscripts: Manuscript[];
  onInvite: (name: string, email: string, manuscriptId: string) => void;
  onClose: () => void;
}

export default function InviteReaderModal({ defaultManuscriptId, manuscripts, onInvite, onClose }: Props) {
  const [step, setStep]   = useState<Step>('form');
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [msId, setMsId]   = useState<string>(defaultManuscriptId);
  const [note, setNote]   = useState('');

  const ms         = manuscripts.find(m => m.id === msId) ?? manuscripts[0];
  const canPreview = name.trim().length > 0 && email.includes('@');

  function send() {
    onInvite(name.trim(), email.trim(), msId);
    setStep('sent');
  }

  function reset() {
    setName(''); setEmail(''); setNote(''); setMsId(defaultManuscriptId); setStep('form');
  }

  // ── Sent confirmation ──────────────────────────────────────────
  if (step === 'sent') {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" onClick={e => e.stopPropagation()}>
          <div className={styles.sentBody}>
            <div className={styles.sentIcon}>✓</div>
            <p id="invite-modal-title" className={styles.sentTitle}>Invite sent to {name.split(' ')[0]}</p>
            <p className={styles.sentSub}>
              They'll appear in your readers list as pending until they accept and log in to Bookending.
            </p>
            <div className={styles.sentActions}>
              <button className={styles.btnGhost} onClick={reset}>Invite another reader</button>
              <button className={styles.btnPrimary} onClick={onClose}>Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Preview step ───────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" onClick={e => e.stopPropagation()}>
          <div className={styles.head}>
            <span id="invite-modal-title" className={styles.headTitle}>Preview invite</span>
            <button className={styles.closeBtn} aria-label="Close" onClick={onClose}>✕</button>
          </div>

          <div className={styles.previewBody}>
            <p className={styles.previewHint}>This is what {name.split(' ')[0]} will receive.</p>
            <div className={styles.inviteCard}>
              <div className={styles.inviteCardHead}>
                <span className={styles.inviteCardBrand}>Bookending</span>
              </div>
              <div className={styles.inviteCardBody}>
                <p className={styles.inviteCardHeading}>
                  You've been invited to read a manuscript.
                </p>
                <div className={styles.inviteCardMs}>
                  <div className={styles.inviteCardMsTitle}>{ms.title}</div>
                  <div className={styles.inviteCardMsMeta}>
                    {ms.draft.toUpperCase()} · {ms.words.toLocaleString()} words · {ms.chapters} chapters
                  </div>
                </div>
                {note.trim() && (
                  <blockquote className={styles.inviteCardNote}>"{note.trim()}"</blockquote>
                )}
                <p className={styles.inviteCardFrom}>
                  Invited by <strong>Billie Wolf</strong>
                </p>
                <div className={styles.inviteCardCta}>Accept invitation →</div>
              </div>
            </div>
          </div>

          <div className={styles.foot}>
            <button className={styles.btnGhost} onClick={() => setStep('form')}>← Back</button>
            <button className={styles.btnPrimary} onClick={send}>Send invite</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form step ──────────────────────────────────────────────────
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" onClick={e => e.stopPropagation()}>
        <div className={styles.head}>
          <span id="invite-modal-title" className={styles.headTitle}>Invite a beta reader</span>
          <button className={styles.closeBtn} aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className={styles.formBody}>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label htmlFor="invite-name" className={styles.label}>Full name</label>
              <input
                id="invite-name"
                className={styles.input}
                placeholder="e.g. Sarah Chen"
                value={name}
                autoFocus
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="invite-email" className={styles.label}>Email address</label>
              <input
                id="invite-email"
                className={styles.input}
                type="email"
                placeholder="e.g. sarah@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Manuscript to share</label>
            <div className={styles.msOptions}>
              {manuscripts.map(m => (
                <label
                  key={m.id}
                  className={styles.msOption}
                  data-active={msId === m.id ? '' : undefined}
                >
                  <input
                    type="radio"
                    name="manuscript"
                    className={styles.radio}
                    checked={msId === m.id}
                    onChange={() => setMsId(m.id)}
                  />
                  <div className={styles.msOptionText}>
                    <span className={styles.msOptionTitle}>{m.title}</span>
                    <span className={styles.msOptionMeta}>
                      {m.draft} · {m.words.toLocaleString()} words · {m.chapters} chapters
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Personal note <span className={styles.labelOpt}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Tell them what kind of feedback you're looking for…"
              value={note}
              rows={3}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.foot}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button
            className={styles.btnPrimary}
            data-disabled={!canPreview ? '' : undefined}
            onClick={canPreview ? () => setStep('preview') : undefined}
          >
            Preview invite →
          </button>
        </div>
      </div>
    </div>
  );
}
