import { useState } from 'react';
import { api } from '../../lib/api';
import type { QAEntry, PendingQuestion } from '../author-profiles/types';
import type { AppNotification } from '../notifications/data';
import styles from './QAManagement.module.css';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  authorId: string;
  authorFirstName: string;
  qaList: QAEntry[];
  pendingQuestions: PendingQuestion[];
  onQaChange: (list: QAEntry[]) => void;
  onPendingChange: (list: PendingQuestion[]) => void;
  onToast: (n: AppNotification) => void;
}

export function QAManagement({
  authorId, authorFirstName,
  qaList, pendingQuestions,
  onQaChange, onPendingChange,
}: Props) {
  const [answerDrafts,   setAnswerDrafts]   = useState<Record<string, string>>({});
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);

  async function publishAnswer(q: PendingQuestion) {
    const answerText = answerDrafts[q.id]?.trim();
    if (!answerText) return;
    try {
      const updated = await api.patch<{ id: string; question: string; answer: string; publishedAt: string }>(
        `/api/authors/${authorId}/questions/${q.id}`, { answer: answerText }
      );
      onQaChange([{ id: updated.id, question: updated.question, answer: updated.answer, askedAt: updated.publishedAt }, ...qaList]);
    } catch {
      // Fallback: optimistic local update
      onQaChange([{ id: String(Date.now()), question: q.question, answer: answerText, askedAt: q.submittedAt }, ...qaList]);
    }
    onPendingChange(pendingQuestions.filter(p => p.id !== q.id));
    setAnswerDrafts(prev => { const next = { ...prev }; delete next[q.id]; return next; });
    setExpandedAnswer(null);
  }

  async function dismissQuestion(q: PendingQuestion) {
    onPendingChange(pendingQuestions.filter(p => p.id !== q.id));
    try {
      await api.patch(`/api/authors/${authorId}/questions/${q.id}`, { dismiss: true });
    } catch { /* already removed from local state */ }
  }

  return (
    <div className={styles.wrap}>
      {/* Pending questions */}
      {pendingQuestions.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Pending questions</span>
            <span className={styles.badge}>{pendingQuestions.length}</span>
          </div>

          {pendingQuestions.map(q => (
            <div key={q.id} className={styles.pendingCard}>
              <div className={styles.pendingMeta}>
                <span className={styles.fromName}>from {q.submitterName}</span>
                <span className={styles.pendingDate}>{fmtDate(q.submittedAt)}</span>
              </div>
              <p className={styles.pendingQuestion}>{q.question}</p>

              {expandedAnswer === q.id ? (
                <div className={styles.answerForm}>
                  <textarea
                    className={styles.answerTextarea}
                    placeholder="Write your answer…"
                    value={answerDrafts[q.id] ?? ''}
                    onChange={e => setAnswerDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                    rows={4}
                    autoFocus
                  />
                  <div className={styles.answerFormActions}>
                    <button
                      className={styles.publishBtn}
                      onClick={() => void publishAnswer(q)}
                      disabled={!answerDrafts[q.id]?.trim()}
                    >
                      Publish answer
                    </button>
                    <button className={styles.cancelBtn} onClick={() => setExpandedAnswer(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.pendingActions}>
                  <button className={styles.answerBtn} onClick={() => setExpandedAnswer(q.id)}>
                    Answer
                  </button>
                  <button className={styles.dismissBtn} onClick={() => void dismissQuestion(q)}>
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Published Q&As */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>Published answers</span>
          <span className={styles.badge}>{qaList.length}</span>
        </div>

        {qaList.length === 0 ? (
          <p className={styles.empty}>
            No answers published yet. Answer a pending question to get started.
          </p>
        ) : (
          <div className={styles.qaList}>
            {qaList.map(entry => (
              <div key={entry.id} className={styles.qaEntry}>
                <div className={styles.qaQuestion}>
                  <span className={styles.qMark}>Q</span>
                  <p className={styles.qaQuestionText}>{entry.question}</p>
                </div>
                <div className={styles.qaAnswer}>
                  <span className={styles.aMark}>A</span>
                  <div className={styles.qaAnswerBody}>
                    <p className={`serif ${styles.qaAnswerText}`}>{entry.answer}</p>
                    <div className={styles.qaDate}>{fmtDate(entry.askedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingQuestions.length === 0 && qaList.length === 0 && (
        <p className={styles.intro}>
          Readers can submit questions from your public {authorFirstName} profile.
          Answered questions appear here and on your profile.
        </p>
      )}
    </div>
  );
}
