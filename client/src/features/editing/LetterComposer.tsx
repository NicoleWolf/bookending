import { useState } from 'react';
import type { Reader, Comment, Manuscript } from './types';
import { Avatar, Pill } from '../../shared/ui/atoms';
import { typeTone } from './data';
import styles from './LetterComposer.module.css';

type Step = 'review' | 'write' | 'sent';

interface Props {
  reader: Reader;
  manuscript: Manuscript;
  readerComments: Comment[];
  onSend: (body: string) => void;
  onClose: () => void;
}

const STEP_LABELS: Record<Step, string> = {
  review: 'Review feedback',
  write:  'Write letter',
  sent:   'Confirm',
};

export default function LetterComposer({ reader, manuscript, readerComments, onSend, onClose }: Props) {
  const [step, setStep] = useState<Step>('review');
  const [body, setBody] = useState('');

  const steps: Step[] = ['review', 'write', 'sent'];

  function send() {
    if (!body.trim()) return;
    onSend(body.trim());
    setStep('sent');
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <div className={styles.head}>
          <div className={styles.headLeft}>
            <span className={styles.headLabel}>
              {step === 'review' ? 'Review feedback' :
               step === 'write'  ? 'Write your letter' :
               'Letter sent'}
            </span>
            <span className={styles.headMeta}>
              {manuscript.title} · {manuscript.draft}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.stepTrack}>
          {steps.map((s, i) => {
            const idx = steps.indexOf(step);
            return (
              <div
                key={s}
                className={styles.stepItem}
                data-active={step === s ? '' : undefined}
                data-done={idx > i ? '' : undefined}
              >
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.stepLabel}>{STEP_LABELS[s]}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.body}>

          {step === 'review' && (
            <>
              <p className={styles.hint}>
                Reader feedback on <em>{manuscript.title}</em>.
                Read it over before writing your letter.
              </p>
              <div className={styles.notesList}>
                {readerComments.length === 0 ? (
                  <p className={styles.noNotes}>No inline notes recorded for this manuscript.</p>
                ) : readerComments.map(c => (
                  <div key={c.id} className={styles.noteCard}>
                    <div className={styles.noteMeta}>
                      <Pill tone={typeTone[c.type]}>{c.type}</Pill>
                      <span className={styles.noteLocation}>
                        {c.chapter.toUpperCase()} · P. {c.page}
                      </span>
                    </div>
                    <p className={`serif ${styles.notePassage}`}>{c.passage}</p>
                    <p className={styles.noteText}>{c.note}</p>
                  </div>
                ))}
              </div>
              <div className={styles.footer}>
                <button className={styles.primaryBtn} onClick={() => setStep('write')}>
                  Write your letter →
                </button>
              </div>
            </>
          )}

          {step === 'write' && (
            <>
              <div className={styles.letterMeta}>
                <Avatar initials={reader.initials} tone={reader.tone} size={28} />
                <div>
                  <div className={styles.letterFrom}>{reader.name}</div>
                  <div className={styles.letterTo}>to Billie Wolf · {manuscript.title}</div>
                </div>
              </div>
              <textarea
                className={styles.textarea}
                placeholder={`Dear Billie,\n\nYour opening line…`}
                value={body}
                onChange={e => setBody(e.target.value)}
                autoFocus
              />
              <div className={styles.footer}>
                <button className={styles.ghostBtn} onClick={() => setStep('review')}>
                  ← Back
                </button>
                <button
                  className={styles.primaryBtn}
                  data-disabled={!body.trim() ? '' : undefined}
                  onClick={send}
                >
                  Send letter →
                </button>
              </div>
            </>
          )}

          {step === 'sent' && (
            <div className={styles.sentState}>
              <div className={styles.sentIcon}>✓</div>
              <div className={styles.sentTitle}>Letter sent</div>
              <p className={styles.sentBody}>
                {reader.name.split(' ')[0]}'s letter has been delivered to Billie Wolf.
                This marks the opening of your correspondence about{' '}
                <em>{manuscript.title}</em>, {manuscript.draft}.
              </p>
              <div className={styles.footer}>
                <button className={styles.ghostBtn} onClick={onClose}>Close</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
