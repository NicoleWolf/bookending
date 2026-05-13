import type { CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import { SectionHead, Pill, Btn, Avatar } from '../../shared/ui/atoms';
import { useAuth } from '../auth';
import { IconQuote, IconArrow, IconBook, IconCheck } from '../../shared/ui/icons';
import InviteReaderModal from './InviteReaderModal';
import ReaderMatcher from './ReaderMatcher';
import LetterComposer from './LetterComposer';
import Correspondence from './Correspondence';
import type { BetaReader, Reader, ReaderRating, CorrespondenceThread, Comment } from './types';
import type { BookMetadata } from '../library/data';
import DocumentEditor from './DocumentEditor';
import NotesArchive from './NotesArchive';
import PendingRequests from './PendingRequests';
import WriterSparkline, { type ReaderImpression } from './WriterSparkline';
import {
  MANUSCRIPT_META, DEFAULT_EDITING_META, MANUSCRIPT_GENRES,
  INTEGRATIONS, INITIAL_READERS, INITIAL_INSTRUCTIONS, INITIAL_IMPRESSIONS,
  COMMENTS, TONES, RATING_TAGS, verdictTone,
} from './data';
import { INITIAL_THREADS } from './correspondence-data';
import styles from './Editing.module.css';

type HubView = 'editor' | 'feedback' | 'correspondence' | 'notes';


import { api } from '../../lib/api';
import type { BetaReaderRecord } from '@bookending/shared';

function recordToReader(r: BetaReaderRecord, index: number): Reader {
  return {
    id:       r.id,
    name:     r.name,
    email:    r.email,
    initials: r.name.split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
    tone:     TONES[index % TONES.length],
    progress: r.progress,
    chapter:  r.progress >= 1 ? 'Done' : r.progress > 0 ? '—' : 'Ch. 1',
    verdict:  r.verdict ?? 'just invited',
    last:     r.lastSeenAt ? 'recently' : 'never',
    notes:    r.notesCount,
    since:    'first book',
  };
}

interface EditingHubProps {
  savedBooks: Record<string, BookMetadata>;
  onTabChange?: (tab: string) => void;
}

export default function EditingHub({ savedBooks, onTabChange }: EditingHubProps) {
  const { session }                     = useAuth();
  const [view, setView]                 = useState<HubView>('editor');
  const [activeId, setActiveId]         = useState<string>(
    () => Object.values(savedBooks)[0]?.id ?? ''
  );
  const [filterReader, setFilterReader] = useState('All');
  const [showResolved, setShowResolved] = useState(false);
  const [resolved, setResolved]         = useState<Set<number>>(
    () => new Set(COMMENTS.filter(c => c.resolvedDefault).map(c => c.id))
  );
  const [readers, setReaders]           = useState<Record<string, Reader[]>>(INITIAL_READERS);
  const [instructions, setInstructions] = useState<Record<string, string>>(INITIAL_INSTRUCTIONS);
  const [editingInstr, setEditingInstr] = useState(false);
  const [draftInstr, setDraftInstr]     = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [threads, setThreads]           = useState<CorrespondenceThread[]>(INITIAL_THREADS);
  const [composingFor, setComposingFor] = useState<Reader | null>(null);
  const [corrThreadId, setCorrThreadId] = useState<number | null>(null);
  const [ratings, setRatings]           = useState<Record<string, ReaderRating>>({});
  const [ratingFor, setRatingFor]       = useState<string | null>(null);
  const [ratingStars, setRatingStars]   = useState(0);
  const [ratingTags, setRatingTags]     = useState<string[]>([]);
  const [ratingNote, setRatingNote]     = useState('');

  const [readerImpressions, setReaderImpressions] = useState<ReaderImpression[]>(
    () => INITIAL_IMPRESSIONS[activeId] ?? []
  );

  // Fetch readers from API whenever the active manuscript changes
  useEffect(() => {
    if (!activeId || !session?.token) return;
    void api.get<BetaReaderRecord[]>(`/api/manuscripts/${activeId}/readers`)
      .then(records => setReaders(prev => ({ ...prev, [activeId]: records.map(recordToReader) })))
      .catch(() => { /* silently fail */ });
    setReaderImpressions(INITIAL_IMPRESSIONS[activeId] ?? []);
    void api.get<ReaderImpression[]>(`/api/manuscripts/${activeId}/reader-impressions`)
      .then(data => { if (data.length > 0) setReaderImpressions(data); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, session?.token]);

  const activeBook    = savedBooks[activeId];
  const ms            = {
    id:      activeId,
    title:   activeBook?.title ?? 'Untitled',
    ...(MANUSCRIPT_META[activeId] ?? DEFAULT_EDITING_META),
  };
  const activeReaders = readers[activeId] ?? [];
  const activeInstr   = instructions[activeId] ?? '';

  // Genres for the active manuscript: prefer curated list for known ids,
  // otherwise derive from the catalog entry.
  const activeGenres: string[] = MANUSCRIPT_GENRES[activeId]
    ?? [activeBook?.genre, activeBook?.subgenre].filter((g): g is string => Boolean(g));

  // Full Manuscript[] for Correspondence thread labels.
  const manuscriptList = Object.values(savedBooks).map(b => ({
    id:    b.id,
    title: b.title,
    ...DEFAULT_EDITING_META,
  }));

  const readerNames = ['All', ...activeReaders.map(r => r.name)];
  const msComments  = COMMENTS.filter(c => String(c.manuscriptId) === activeId);
  const visible     = msComments.filter(c => {
    if (!showResolved && resolved.has(c.id)) return false;
    if (filterReader !== 'All' && c.reader.name !== filterReader) return false;
    return true;
  });
  const openCount = msComments.filter(c => !resolved.has(c.id)).length;

  const filteredImpressions = filterReader === 'All'
    ? readerImpressions
    : readerImpressions.filter(r => r.readerName === filterReader);
  const totalChapters = readerImpressions.length > 0
    ? Math.max(...readerImpressions.flatMap(r => r.points.map(p => p.chapterNum)))
    : 0;

  const switchMs = (id: string) => {
    setActiveId(id); setFilterReader('All'); setEditingInstr(false);
  };
  const resolve = (id: number) => setResolved(p => new Set([...p, id]));
  const reopen  = (id: number) => setResolved(p => { const s = new Set(p); s.delete(id); return s; });

  const removeReader = (id: string) => {
    if (!session?.token) return;
    setReaders(p => ({ ...p, [activeId]: (p[activeId] ?? []).filter(r => r.id !== id) }));
    api.del(`/api/manuscripts/${activeId}/readers/${id}`)
      .catch(err => console.error('Failed to remove reader:', err));
  };

  const addReader = (name: string, email: string, manuscriptId: string) => {
    if (!session?.token) return;
    api.post<BetaReaderRecord>(`/api/manuscripts/${manuscriptId}/readers`, { name, email })
      .then(record => {
        const newReader = recordToReader(record, (readers[manuscriptId] ?? []).length);
        setReaders(p => ({ ...p, [manuscriptId]: [...(p[manuscriptId] ?? []), newReader] }));
      })
      .catch(err => console.error('Failed to add reader:', err));
  };

  const openRating = (r: Reader) => {
    const ex = ratings[r.id];
    setRatingFor(r.id);
    setRatingStars(ex?.stars ?? 0);
    setRatingTags(ex?.tags ?? []);
    setRatingNote(ex?.note ?? '');
  };
  const saveRating = (id: string) => {
    setRatings(p => ({ ...p, [id]: { stars: ratingStars, tags: ratingTags, note: ratingNote } }));
    setRatingFor(null);
  };
  const toggleTag = (tag: string) =>
    setRatingTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);

  const startEdit = () => { setDraftInstr(activeInstr); setEditingInstr(true); };
  const saveInstr = () => { setInstructions(p => ({ ...p, [activeId]: draftInstr })); setEditingInstr(false); };

  function readerThread(readerId: string): CorrespondenceThread | undefined {
    return threads.find(t => t.reader.id === readerId);
  }

  function openThread(thread: CorrespondenceThread) {
    setCorrThreadId(thread.id);
    setView('correspondence');
  }

  function handleLetterSent(reader: Reader, body: string) {
    const newThread: CorrespondenceThread = {
      id: Date.now(),
      manuscriptId: activeId,
      draftVersion: ms.draft,
      reader: { id: reader.id, name: reader.name, initials: reader.initials, tone: reader.tone },
      messages: [{
        id: Date.now() + 1,
        author: 'reader',
        authorName: reader.name,
        body,
        sentAt: 'just now',
      }],
      openedAt: 'just now',
    };
    setThreads(prev => [...prev, newThread]);
    setReaders(prev => ({
      ...prev,
      [activeId]: prev[activeId].map(r =>
        r.id === reader.id ? { ...r, verdict: 'sent letter' } : r
      ),
    }));
    setComposingFor(null);
    setCorrThreadId(newThread.id);
    setView('correspondence');
  }

  function handleReply(threadId: number, body: string) {
    setThreads(prev => prev.map(t =>
      t.id === threadId ? {
        ...t,
        messages: [...t.messages, {
          id: Date.now(),
          author: 'writer',
          authorName: 'Billie Wolf',
          body,
          sentAt: 'just now',
        }],
      } : t
    ));
  }

  function renderCommentRow(c: Comment, isLast: boolean) {
    const isResolved = resolved.has(c.id);
    return (
      <div
        key={c.id}
        className={styles.commentRow}
        data-resolved={isResolved ? 'true' : undefined}
        data-last={isLast ? 'true' : undefined}
      >
        <div className={styles.commentBody}>
          <div className={styles.commentMeta}>
            <span className={styles.commentLocation}>
              {c.chapter.toUpperCase()} · P. {c.page}
            </span>
            {c.flaggedBy > 0 && (
              <span className={styles.commentLocation}>+{c.flaggedBy} ALSO FLAGGED</span>
            )}
            {isResolved && <Pill tone="good"><IconCheck size={10} /> resolved</Pill>}
          </div>
          <p className={`serif ${styles.commentPassage}`}>{c.passage}</p>
          <p className={styles.commentNote}>{c.note}</p>
          <div className={styles.commentAuthor}>
            <Avatar initials={c.reader.initials} tone={c.reader.tone} size={24} />
            <span className={styles.commentAuthorName}>{c.reader.name}</span>
            <span className={styles.commentTime}>{c.time}</span>
          </div>
        </div>
        <div className={styles.commentActions}>
          <Btn tone="ghost" className={styles.btnSm}>Reply</Btn>
          {isResolved ? (
            <Btn tone="ghost" className={styles.btnSm} onClick={() => reopen(c.id)}>Reopen</Btn>
          ) : (
            <Btn
              tone="ghost"
              className={`${styles.btnSm} ${styles.btnResolve}`}
              onClick={() => resolve(c.id)}
            >
              <IconCheck size={11} /> Resolve
            </Btn>
          )}
        </div>
      </div>
    );
  }

  const unreadCount = threads.filter(t => {
    const last = t.messages[t.messages.length - 1];
    return last?.author === 'reader';
  }).length;

  return (
    <section className={styles.section}>
      <SectionHead
        eyebrow="§ 01 · Editing & Beta-readers"
        title="Manuscript & feedback"
        kicker={`${ms.title} — ${ms.draft}, ${ms.date}. ${ms.words.toLocaleString()} words, ${ms.chapters} chapters.`}
      >
        <Btn tone="ghost"><IconQuote size={14} /> Feedback · {openCount} open</Btn>
        <Btn tone="primary" icon={<IconArrow size={14} />}>Upload revision</Btn>
      </SectionHead>

      {/* ── View toggle ── */}
      <div className={styles.viewTabs}>
        <button
          className={styles.viewTab}
          data-active={view === 'editor' ? 'true' : undefined}
          onClick={() => setView('editor')}
        >Editor</button>
        <button
          className={styles.viewTab}
          data-active={view === 'feedback' ? 'true' : undefined}
          onClick={() => setView('feedback')}
        >Readers &amp; Feedback</button>
        <button
          className={styles.viewTab}
          data-active={view === 'correspondence' ? 'true' : undefined}
          onClick={() => setView('correspondence')}
        >
          Correspondence
          {unreadCount > 0 && (
            <span className={styles.viewTabBadge}>{unreadCount}</span>
          )}
        </button>
        <button
          className={styles.viewTab}
          data-active={view === 'notes' ? 'true' : undefined}
          onClick={() => setView('notes')}
        >
          Notes
        </button>
      </div>

      {/* ── Manuscript tabs ── */}
      <div className={styles.msTabs}>
        {Object.values(savedBooks).map((b) => {
          const meta = MANUSCRIPT_META[b.id] ?? DEFAULT_EDITING_META;
          return (
            <button
              key={b.id}
              onClick={() => switchMs(b.id)}
              className={styles.msTab}
              data-active={b.id === activeId ? 'true' : undefined}
            >
              {b.id === activeId && <span className={styles.msTabDot} />}
              {b.title}
              <span className={styles.msTabDraft}>{meta.draft.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* ── Editor view ── */}
      {view === 'editor' && <>
        <DocumentEditor key={activeId} manuscriptId={activeId} />

        <div className={styles.panelGrid}>
          <div className={styles.panel}>
            <div className="label">Current manuscript</div>
            <div className={styles.msFileRow}>
              <div className={styles.msCover}>
                <IconBook size={18} className={styles.iconMuted} />
                <div className={styles.msCoverAccent} />
              </div>
              <div>
                <div className={styles.msFileName}>{ms.title}</div>
                <div className={styles.msFileMeta}>{ms.draft.toUpperCase()} · {ms.date.toUpperCase()}</div>
                <div className={styles.msPills}>
                  <Pill tone="neutral">{ms.words.toLocaleString()} words</Pill>
                  <Pill tone="neutral">{ms.chapters} ch.</Pill>
                  <Pill tone="neutral">{ms.pages} pp.</Pill>
                </div>
              </div>
            </div>
            <div className={styles.dropZone} onClick={() => onTabChange?.('Manuscripts')}>
              <div className={styles.dropLabel}>IMPORT A NEW DRAFT</div>
              <div className={styles.dropSub}>Manage manuscript files in Manuscripts →</div>
            </div>
            <div className={styles.btnRow}>
              <Btn tone="ghost" className={styles.btnFull}>Download .docx</Btn>
              <Btn tone="ghost" className={styles.btnFull}>Share with readers</Btn>
            </div>
          </div>

          <div className={styles.panelSm}>
            <div className={styles.toolsHeader}>
              <div className="label">Editing tools</div>
              <span className={styles.toolsCount}>1 CONNECTED</span>
            </div>
            {INTEGRATIONS.map(tool => (
              <div
                key={tool.name}
                className={styles.toolRow}
                data-connected={tool.connected ? 'true' : undefined}
              >
                <div
                  className={styles.toolLogo}
                  data-connected={tool.connected ? 'true' : undefined}
                >{tool.initial}</div>
                <div className={styles.toolInfo}>
                  <div className={styles.toolName}>{tool.name}</div>
                  <div className={styles.toolTagline}>{tool.tagline}</div>
                </div>
                <Btn tone={tool.connected ? 'ghost' : 'accent'} className={styles.btnSm}>
                  {tool.connected ? 'Disconnect' : 'Connect'}
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </>}

      {/* ── Correspondence view ── */}
      {view === 'correspondence' && (
        <Correspondence
          threads={threads}
          manuscripts={manuscriptList}
          initialThreadId={corrThreadId}
          onReply={handleReply}
        />
      )}

      {view === 'feedback' && <>
      {/* ── Pending join requests (REQUEST mode only) ── */}
      {activeBook?.betaMode === 'REQUEST' && (
        <PendingRequests manuscriptId={activeId} />
      )}

      {/* ── Beta reader matching ── */}
      <ReaderMatcher
        manuscriptId={activeId}
        manuscriptTitle={ms.title}
        genres={activeGenres}
        onInvite={(reader: BetaReader) => addReader(reader.name, reader.email, activeId)}
      />

      {/* ── Manage readers + guidelines ── */}
      <div className={styles.readersBox}>
        <div className={styles.readersHeader}>
          <span className="label">Manage readers</span>
          <Btn
            tone="primary"
            icon={<IconArrow size={14} />}
            className={styles.btnSm}
            onClick={() => setShowInviteModal(true)}
          >
            Invite reader
          </Btn>
        </div>

        <div className={styles.readersGrid}>

          {/* Reader list */}
          <div className={styles.readerList}>

            {activeReaders.length === 0 && (
              <p className={styles.readerEmpty}>NO READERS ASSIGNED YET</p>
            )}

            {activeReaders.map(r => {
              const rating    = ratings[r.id] ?? null;
              const isEditing = ratingFor === r.id;
              return (
                <div key={r.id} className={styles.readerCard}>

                  <div className={styles.readerCardBody}>
                    <Avatar initials={r.initials} tone={r.tone} size={32} />
                    <div>
                      <div className={styles.readerNameRow}>
                        <span className={styles.readerName}>{r.name}</span>
                        <Pill tone={verdictTone[r.verdict] ?? 'neutral'}>{r.verdict}</Pill>
                      </div>
                      <div className={styles.readerProgressRow}>
                        <span className={styles.readerProgressLabel}>{r.chapter}</span>
                        <span className={styles.readerProgressLabel}>{Math.round(r.progress * 100)}%</span>
                      </div>
                      <div className={styles.readerBar}>
                        <div
                          className={styles.readerBarFill}
                          style={{ '--progress': `${r.progress * 100}%` } as CSSProperties}
                        />
                      </div>
                    </div>
                    <Btn
                      tone="bare"
                      className={styles.btnRemove}
                      onClick={() => removeReader(r.id)}
                    >
                      Remove
                    </Btn>
                  </div>

                  {(() => {
                    const thread = readerThread(r.id);
                    if (thread) return (
                      <button
                        className={styles.corrBtn}
                        data-unread={thread.messages[thread.messages.length - 1]?.author === 'reader' ? '' : undefined}
                        onClick={() => openThread(thread)}
                      >
                        {thread.messages[thread.messages.length - 1]?.author === 'reader'
                          ? 'Read letter →'
                          : 'View thread →'}
                      </button>
                    );
                    if (r.progress >= 1.0) return (
                      <button
                        className={styles.corrBtn}
                        onClick={() => setComposingFor(r)}
                      >
                        Write letter →
                      </button>
                    );
                    return null;
                  })()}

                  {isEditing ? (
                    <div className={styles.ratingEditFooter}>
                      <div className={styles.starRow}>
                        <div className={styles.stars}>
                          {[1,2,3,4,5].map(n => (
                            <button
                              key={n}
                              className={styles.starBtn}
                              data-lit={n <= ratingStars ? 'true' : undefined}
                              onClick={() => setRatingStars(n)}
                            >★</button>
                          ))}
                        </div>
                        {ratingStars > 0 && (
                          <button className={styles.clearBtn} onClick={() => setRatingStars(0)}>CLEAR</button>
                        )}
                      </div>
                      <div>
                        <div className={styles.tagsLabel}>FEEDBACK LABELS</div>
                        <div className={styles.tagsList}>
                          {RATING_TAGS.map(({ label, positive }) => {
                            const active = ratingTags.includes(label);
                            return (
                              <button
                                key={label}
                                className={styles.ratingTag}
                                data-active={active ? 'true' : undefined}
                                data-positive={positive ? 'true' : 'false'}
                                onClick={() => toggleTag(label)}
                              >{label}</button>
                            );
                          })}
                        </div>
                      </div>
                      <textarea
                        className={styles.ratingTextarea}
                        placeholder="Private note about this reader…"
                        value={ratingNote}
                        onChange={e => setRatingNote(e.target.value)}
                      />
                      <div className={styles.btnRow}>
                        <Btn tone="primary" className={styles.btnXs} onClick={() => saveRating(r.id)}>Save rating</Btn>
                        <Btn tone="ghost" className={styles.btnXs} onClick={() => setRatingFor(null)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.ratingFooter}>
                      {rating ? (
                        <>
                          <div className={styles.ratingDisplay}>
                            <span className={styles.ratingStars}>
                              {'★'.repeat(rating.stars)}{'☆'.repeat(5 - rating.stars)}
                            </span>
                            {rating.tags.map(tag => {
                              const positive = RATING_TAGS.find(t => t.label === tag)?.positive ?? true;
                              return (
                                <span
                                  key={tag}
                                  className={styles.ratingTagBadge}
                                  data-positive={positive ? 'true' : 'false'}
                                >{tag}</span>
                              );
                            })}
                            {rating.note && (
                              <span className={styles.ratingNoteSaved}>· note saved</span>
                            )}
                          </div>
                          <button className={styles.ratingEditBtn} onClick={() => openRating(r)}>Edit</button>
                        </>
                      ) : (
                        <>
                          <span className={styles.ratingNone}>NOT YET RATED</span>
                          <button className={styles.ratingEditBtn} onClick={() => openRating(r)}>Rate reader</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          </div>

          {/* Guidelines */}
          <div className={styles.guidelines}>
            <div className={styles.guidelinesHeader}>
              <div className="label">Reader guidelines</div>
              {!editingInstr && (
                <button className={styles.guidelinesEditBtn} onClick={startEdit}>
                  {activeInstr ? 'Edit' : 'Add guidelines'}
                </button>
              )}
            </div>

            {editingInstr ? (
              <>
                <textarea
                  className={styles.guidelinesTextarea}
                  value={draftInstr}
                  onChange={e => setDraftInstr(e.target.value)}
                />
                <div className={styles.btnRow}>
                  <Btn tone="primary" onClick={saveInstr}>Save</Btn>
                  <Btn tone="ghost" onClick={() => setEditingInstr(false)}>Cancel</Btn>
                </div>
              </>
            ) : activeInstr ? (
              <p className={styles.guidelinesText}>{activeInstr}</p>
            ) : (
              <p className={styles.guidelinesEmpty}>NO GUIDELINES YET — ADD CONTEXT FOR YOUR READERS</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Reader impressions sparkline ── */}
      <WriterSparkline readers={filteredImpressions} totalChapters={totalChapters} />

      {/* ── Inline comments inbox ── */}
      <div className={styles.commentsBox}>
        <div className={styles.commentsNav}>
          {readerNames.map((r) => (
            <button
              key={r}
              className={styles.filterBtn}
              data-active={filterReader === r ? 'true' : undefined}
              onClick={() => setFilterReader(r)}
            >
              {r === 'All' ? 'All readers' : r.split(' ')[0]}
            </button>
          ))}
          <div className={styles.navSpacer} />
          <button
            className={styles.resolvedToggle}
            data-active={showResolved ? 'true' : undefined}
            onClick={() => setShowResolved(v => !v)}
          >
            {showResolved ? '— HIDE RESOLVED' : '+ SHOW RESOLVED'}
          </button>
        </div>

        {visible.length === 0 ? (
          <div className={styles.commentsEmpty}>
            <span className={styles.commentsEmptyText}>NO OPEN NOTES</span>
          </div>
        ) : (
          visible.map((c, i) => renderCommentRow(c, i === visible.length - 1))
        )}

        <div className={styles.commentsFooter}>
          <span className={styles.commentsStat}>{msComments.length} TOTAL</span>
          <span className={styles.commentsStat}>{resolved.size} RESOLVED</span>
          <span className={styles.commentsStatAccent}>{openCount} OPEN</span>
        </div>
      </div>
      </>}
      {/* ── Notes view ── */}
      {view === 'notes' && (
        <NotesArchive key={activeId} manuscriptId={activeId} />
      )}

      {/* ── Mobile bottom nav ── */}
      <nav className={styles.bottomNav}>
        <button
          className={styles.bottomNavTab}
          data-active={view === 'editor' ? '' : undefined}
          onClick={() => setView('editor')}
        >Editor</button>
        <button
          className={styles.bottomNavTab}
          data-active={view === 'feedback' ? '' : undefined}
          onClick={() => setView('feedback')}
        >Feedback</button>
        <button
          className={styles.bottomNavTab}
          data-active={view === 'correspondence' ? '' : undefined}
          onClick={() => setView('correspondence')}
        >
          Corr
          {unreadCount > 0 && <span className={styles.bottomNavBadge}>{unreadCount}</span>}
        </button>
        <button
          className={styles.bottomNavTab}
          data-active={view === 'notes' ? '' : undefined}
          onClick={() => setView('notes')}
        >Notes</button>
      </nav>

      {showInviteModal && (
        <InviteReaderModal
          defaultManuscriptId={activeId}
          manuscripts={manuscriptList}
          onInvite={addReader}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {composingFor && (
        <LetterComposer
          reader={composingFor}
          manuscript={ms}
          readerComments={COMMENTS.filter(
            c => String(c.manuscriptId) === activeId && c.reader.name === composingFor.name
          )}
          onSend={body => handleLetterSent(composingFor, body)}
          onClose={() => setComposingFor(null)}
        />
      )}
    </section>
  );
}
