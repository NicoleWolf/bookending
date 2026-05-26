import { useState, useEffect } from 'react';
import type { AuthorReaderChapterNoteRecord } from '@bookending/shared';
import { Avatar } from '../../shared/ui/atoms';
import { api } from '../../lib/api';
import { FEEDBACK_TEMPLATE } from '../reading/data';
import type { TemplateAnswers } from '../reading/data';
import CheckInsTab from './CheckInsTab';
import ApplicationsTab from './ApplicationsTab';
import styles from './FeedbackPanel.module.css';

interface ReaderAnnotation {
  id:             string;
  readerId:       string;
  readerName:     string;
  readerInitials: string;
  chapterId:      number;
  selectedText:   string;
  note:           string;
  createdAt:      string;
}

interface ReaderSubmission {
  readerId:       string;
  readerName:     string;
  readerInitials: string;
  stars:          number;
  message:        string;
  templateJson:   string | null;
  submittedAt:    string;
}

type PanelTab = 'annotations' | 'overall' | 'checkins' | 'applicants';

interface Props {
  manuscriptId:       string;
  manuscriptTitle?:   string;
  chapterHtml:        string;
  readerAnnotations:  ReaderAnnotation[];
  readerChapterNotes: AuthorReaderChapterNoteRecord[];
  focusedCommentId:   string | null;
  onClearFocus:       () => void;
}

const STAR_LABELS = ['', 'Did not finish', 'Had issues', 'Worth the time', 'Recommended', 'Exceptional'];

function starStr(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

function TemplateAnswerDisplay({ answers }: { answers: TemplateAnswers }) {
  return (
    <div className={styles.templateAnswers}>
      {FEEDBACK_TEMPLATE.map(cat => {
        const catAnswers = cat.prompts.filter(p => answers[p.id] !== undefined && answers[p.id] !== '');
        if (catAnswers.length === 0) return null;
        return (
          <div key={cat.id} className={styles.templateCat}>
            <div className={`label ${styles.templateCatLabel}`}>{cat.label}</div>
            {cat.prompts.map(prompt => {
              const val = answers[prompt.id];
              if (val === undefined || val === '') return null;
              return (
                <div key={prompt.id} className={styles.templateAnswer}>
                  <div className={styles.templateQuestion}>{prompt.text}</div>
                  {prompt.type === 'scale' && typeof val === 'number' && prompt.scale && (
                    <div className={styles.templateScale}>
                      {prompt.scale[val - 1]}
                      <span className={styles.templateScalePos}>{val}/5</span>
                    </div>
                  )}
                  {prompt.type === 'text' && typeof val === 'string' && (
                    <p className={`serif ${styles.templateNote}`}>&ldquo;{val}&rdquo;</p>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function passageInChapter(passage: string, chapterHtml: string): boolean {
  if (!chapterHtml) return true;
  const plain = chapterHtml.replace(/<[^>]+>/g, ' ');
  return plain.includes(passage);
}

export default function FeedbackPanel({
  manuscriptId, manuscriptTitle, chapterHtml, readerAnnotations, readerChapterNotes,
  focusedCommentId, onClearFocus,
}: Props) {
  const [filter,      setFilter]      = useState('All');
  const [panelTab,    setPanelTab]    = useState<PanelTab>('annotations');
  const [submissions, setSubmissions] = useState<ReaderSubmission[]>([]);

  useEffect(() => {
    if (!manuscriptId) return;
    void api.get<ReaderSubmission[]>(`/api/manuscripts/${manuscriptId}/reader-submissions`)
      .then(data => setSubmissions(data))
      .catch(() => setSubmissions([]));
  }, [manuscriptId]);

  const comments    = readerAnnotations.filter(a => passageInChapter(a.selectedText, chapterHtml));
  const readerNames = [...new Set(comments.map(c => c.readerName))];
  const names       = ['All', ...readerNames];

  const isFocused = focusedCommentId !== null;
  const visible   = isFocused
    ? comments.filter(c => c.id === focusedCommentId)
    : filter === 'All'
      ? comments
      : comments.filter(c => c.readerName === filter);

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.headTitle}>Feedback</span>
        <div className={styles.panelTabs} role="tablist">
          <button
            id="tab-annotations"
            className={styles.panelTab}
            role="tab"
            aria-selected={panelTab === 'annotations'}
            aria-controls="panel-annotations"
            data-active={panelTab === 'annotations' ? '' : undefined}
            onClick={() => setPanelTab('annotations')}
          >
            Annotations
          </button>
          <button
            id="tab-overall"
            className={styles.panelTab}
            role="tab"
            aria-selected={panelTab === 'overall'}
            aria-controls="panel-overall"
            data-active={panelTab === 'overall' ? '' : undefined}
            onClick={() => setPanelTab('overall')}
          >
            Overall
            {submissions.length > 0 && (
              <span className={styles.panelTabCount}>{submissions.length}</span>
            )}
          </button>
          <button
            id="tab-checkins"
            className={styles.panelTab}
            role="tab"
            aria-selected={panelTab === 'checkins'}
            aria-controls="panel-checkins"
            data-active={panelTab === 'checkins' ? '' : undefined}
            onClick={() => setPanelTab('checkins')}
          >
            Check-ins
          </button>
          <button
            id="tab-applicants"
            className={styles.panelTab}
            role="tab"
            aria-selected={panelTab === 'applicants'}
            aria-controls="panel-applicants"
            data-active={panelTab === 'applicants' ? '' : undefined}
            onClick={() => setPanelTab('applicants')}
          >
            Applicants
          </button>
        </div>
      </div>

      {/* ── Overall feedback tab ── */}
      {panelTab === 'overall' && (
        <div id="panel-overall" className={styles.overallList} role="tabpanel" aria-labelledby="tab-overall">
          {submissions.length === 0 ? (
            <p className={styles.empty}>No overall feedback submitted yet.</p>
          ) : (
            submissions.map(sub => {
              let answers: TemplateAnswers = {};
              if (sub.templateJson) {
                try { answers = JSON.parse(sub.templateJson) as TemplateAnswers; } catch { /* noop */ }
              }
              const hasTemplate = Object.keys(answers).length > 0;
              return (
                <div key={sub.readerId} className={styles.overallCard}>
                  <div className={styles.overallHead}>
                    <Avatar initials={sub.readerInitials} tone="accent" size={20} />
                    <span className={styles.overallName}>{sub.readerName}</span>
                    <span
                      className={styles.overallStars}
                      aria-label={`${sub.stars} out of 5 — ${STAR_LABELS[sub.stars]}`}
                    >
                      {starStr(sub.stars)}
                    </span>
                    <span className={styles.overallDate}>{fmtDate(sub.submittedAt)}</span>
                  </div>
                  {sub.message && (
                    <p className={`serif ${styles.overallMessage}`}>&ldquo;{sub.message}&rdquo;</p>
                  )}
                  {hasTemplate && <TemplateAnswerDisplay answers={answers} />}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Check-ins tab ── */}
      {panelTab === 'checkins' && (
        <div id="panel-checkins" role="tabpanel" aria-labelledby="tab-checkins" className={styles.annotationsPanel}>
          <CheckInsTab manuscriptTitle={manuscriptTitle} />
        </div>
      )}

      {/* ── Applicants tab ── */}
      {panelTab === 'applicants' && (
        <div id="panel-applicants" role="tabpanel" aria-labelledby="tab-applicants" className={styles.annotationsPanel}>
          <ApplicationsTab manuscriptId={manuscriptId} />
        </div>
      )}

      {/* ── Annotations tab ── */}
      {panelTab === 'annotations' && (
        <div id="panel-annotations" className={styles.annotationsPanel} role="tabpanel" aria-labelledby="tab-annotations">
          {isFocused ? (
            <div className={styles.focusBanner}>
              <button className={styles.focusBack} onClick={onClearFocus}>← All feedback</button>
              <span className={styles.focusLabel}>passage selected</span>
            </div>
          ) : (
            <div className={styles.filters}>
              {names.map(name => (
                <button
                  key={name}
                  className={styles.filterBtn}
                  data-active={filter === name ? '' : undefined}
                  onClick={() => setFilter(name)}
                >
                  {name === 'All' ? 'All' : name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          <div className={styles.list}>
            {visible.length === 0 ? (
              <p className={styles.empty}>
                {readerAnnotations.length === 0 ? 'No reader feedback yet.' : 'No feedback on this chapter.'}
              </p>
            ) : (
              visible.map(c => (
                <div key={c.id} className={styles.card} data-focused={isFocused ? '' : undefined}>
                  <div className={styles.cardTop}>
                    <span className={styles.location}>Ch. {c.chapterId}</span>
                  </div>
                  <p className={`serif ${styles.passage}`}>"{c.selectedText}"</p>
                  {c.note && <p className={styles.note}>{c.note}</p>}
                  <div className={styles.author}>
                    <Avatar initials={c.readerInitials} tone="accent" size={20} />
                    <span className={styles.authorName}>{c.readerName}</span>
                    <span className={styles.authorTime}>
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {readerChapterNotes.length > 0 && (
            <div className={styles.chapterNotes}>
              <div className={styles.chapterNotesHead}>
                <span className={styles.headTitle}>Chapter notes</span>
                <span className={styles.headCount}>{readerChapterNotes.length}</span>
              </div>
              {readerChapterNotes.map(n => (
                <div key={n.id} className={styles.card}>
                  <p className={`serif ${styles.note}`}>{n.body}</p>
                  <div className={styles.author}>
                    <Avatar initials={n.readerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()} tone="accent" size={20} />
                    <span className={styles.authorName}>{n.readerName}</span>
                    <span className={styles.authorTime}>
                      {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
