import type { CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import { SectionHead, Pill, Btn, Avatar } from '../../shared/ui/atoms';
import { useAuth } from '../auth';
import { IconQuote, IconArrow, IconBook, IconCheck } from '../../shared/ui/icons';
import InviteReaderModal from './InviteReaderModal';
import ReaderMatcher from './ReaderMatcher';
import LetterComposer from './LetterComposer';
import Correspondence from './Correspondence';
import type { BetaReader, Reader, CorrespondenceThread, Comment } from './types';
import type { BookMetadata } from '../library/data';
import DocumentEditor from './DocumentEditor';
import NotesArchive from './NotesArchive';
import NotesFromBefore from './NotesFromBefore';
import RevisionChangelogView from './RevisionChangelogView';
import PendingRequests from './PendingRequests';
import WriterSparkline, { type ReaderImpression } from './WriterSparkline';
import {
  MANUSCRIPT_META, DEFAULT_EDITING_META, MANUSCRIPT_GENRES,
  INTEGRATIONS, TONES, verdictTone,
} from './data';
import styles from './Editing.module.css';

type HubView = 'editor' | 'feedback' | 'correspondence' | 'notes' | 'notes-from-before' | 'changelog';


import { api } from '../../lib/api';
import type { BetaReaderRecord } from '@bookending/shared';

function recordToReader(r: BetaReaderRecord, index: number): Reader {
  return {
    id:                  r.id,
    name:                r.name,
    email:               r.email,
    initials:            r.name.split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
    tone:                TONES[index % TONES.length],
    progress:            r.progress,
    chapter:             r.progress >= 1 ? 'Done' : r.progress > 0 ? '—' : 'Ch. 1',
    verdict:             r.verdict ?? 'just invited',
    last:                r.lastSeenAt ? 'recently' : 'never',
    notes:               r.notesCount,
    since:               'first book',
    devotionQueued:      r.devotionQueued,
    arcReservationEarned: r.arcReservationEarned,
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
  const [resolved, setResolved]         = useState<Set<number>>(new Set());
  const [readers, setReaders]           = useState<Record<string, Reader[]>>({});
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [editingInstr, setEditingInstr] = useState(false);
  const [draftInstr, setDraftInstr]     = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [threads, setThreads]           = useState<CorrespondenceThread[]>([]);
  const [composingFor, setComposingFor] = useState<Reader | null>(null);
  const [corrThreadId, setCorrThreadId] = useState<number | null>(null);
  const [msDropdownOpen, setMsDropdownOpen] = useState(false);

  const [readerImpressions, setReaderImpressions] = useState<ReaderImpression[]>([]);

  const [editorialNote, setEditorialNote]     = useState<string | null>(null);
  const [editingNote, setEditingNote]         = useState(false);
  const [noteDraft, setNoteDraft]             = useState('');
  const [revisionPausedAt, setRevisionPausedAt] = useState<string | null>(null);

  // Sync editorial note + revision date from active book metadata
  useEffect(() => {
    const book = savedBooks[activeId];
    setEditorialNote(book?.editorialNote ?? null);
    setRevisionPausedAt(book?.revisionPausedAt ?? null);
    setEditingNote(false);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch readers + instructions from API whenever the active manuscript changes
  useEffect(() => {
    if (!activeId || !session?.token) return;
    void api.get<BetaReaderRecord[]>(`/api/manuscripts/${activeId}/readers`)
      .then(records => setReaders(prev => ({ ...prev, [activeId]: records.map(recordToReader) })))
      .catch(() => { /* silently fail */ });
    void api.get<ReaderImpression[]>(`/api/manuscripts/${activeId}/reader-impressions`)
      .then(data => { if (data.length > 0) setReaderImpressions(data); })
      .catch(() => {});
    void api.get<{ readerInstructions: string | null }>(`/api/manuscripts/${activeId}/instructions`)
      .then(data => setInstructions(prev => ({ ...prev, [activeId]: data.readerInstructions ?? '' })))
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
  const msComments: Comment[] = [];
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

  const startEdit = () => { setDraftInstr(activeInstr); setEditingInstr(true); };
  const saveInstr = () => {
    setInstructions(p => ({ ...p, [activeId]: draftInstr }));
    setEditingInstr(false);
    void api.patch(`/api/manuscripts/${activeId}`, { readerInstructions: draftInstr }).catch(() => {});
  };

  async function saveEditorialNote() {
    const trimmed = noteDraft.trim() || null;
    setEditorialNote(trimmed);
    setEditingNote(false);
    await api.patch(`/api/manuscripts/${activeId}/editorial-note`, { note: trimmed }).catch(() => {});
  }

  async function handleOpenDoor() {
    if (!window.confirm('Open the door? This will reopen feedback and apply Devotion +1 to your held readers.')) return;
    await api.post(`/api/manuscripts/${activeId}/open-door`).catch(() => {});
    setRevisionPausedAt(null);
    setView('editor');
  }

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

  const isInRevision = activeBook?.status === 'in-revision';
  const revisionDay  = revisionPausedAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(revisionPausedAt).getTime()) / 86_400_000))
    : null;

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

      {/* ── In Revision status row ── */}
      {isInRevision && (
        <div className={styles.revisionStatusRow}>
          <span className={styles.revisionStatusLabel}>
            <span className={styles.revisionStatusDot} />
            In Revision
            {revisionDay !== null && (
              <>
                <span className={styles.revisionStatusSep}>·</span>
                <span className={styles.revisionDayCount}>Day {revisionDay}</span>
              </>
            )}
          </span>
          <button className={styles.revisionOpenDoorBtn} onClick={handleOpenDoor}>
            Open the door
          </button>
        </div>
      )}

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
        {isInRevision && (
          <button
            className={styles.viewTab}
            data-active={view === 'notes-from-before' ? 'true' : undefined}
            onClick={() => setView('notes-from-before')}
          >
            Notes from before
          </button>
        )}
        {isInRevision && (
          <button
            className={styles.viewTab}
            data-active={view === 'changelog' ? 'true' : undefined}
            onClick={() => setView('changelog')}
          >
            Revision changelog
          </button>
        )}
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

      {/* ── Mobile manuscript dropdown (replaces tabs on small screens) ── */}
      <div className={styles.msDropdownWrap}>
        {msDropdownOpen && (
          <div className={styles.msDropdownBackdrop} onClick={() => setMsDropdownOpen(false)} />
        )}
        <button
          className={styles.msDropdownTrigger}
          onClick={() => setMsDropdownOpen(o => !o)}
        >
          <span className={styles.msDropdownSelected}>
            <span className={styles.msTabDot} />
            <span>{ms.title}</span>
            <span className={styles.msTabDraft}>{ms.draft.toUpperCase()}</span>
          </span>
          <span className={styles.msDropdownChevron}>{msDropdownOpen ? '▴' : '▾'}</span>
        </button>
        {msDropdownOpen && (
          <div className={styles.msDropdownList}>
            {Object.values(savedBooks).map((b) => {
              const meta = MANUSCRIPT_META[b.id] ?? DEFAULT_EDITING_META;
              return (
                <button
                  key={b.id}
                  className={styles.msDropdownItem}
                  data-active={b.id === activeId ? '' : undefined}
                  onClick={() => { switchMs(b.id); setMsDropdownOpen(false); }}
                >
                  <span>{b.title}</span>
                  <span className={styles.msTabDraft}>{meta.draft.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Editor view ── */}
      {view === 'editor' && <>
        <DocumentEditor key={activeId} manuscriptId={activeId} />

        {/* ── Editorial note rail (in-revision only) ── */}
        {isInRevision && (
          <div className={styles.editorialNoteRail}>
            <div className={styles.editorialNotePrompt}>Note to readers</div>
            {editingNote ? (
              <>
                <textarea
                  className={styles.editorialNoteEditArea}
                  rows={4}
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  placeholder="Write a short note to your readers about the revision…"
                  autoFocus
                />
                <div className={styles.editorialNoteEditRow}>
                  <button className={styles.editorialNoteActionLink} onClick={saveEditorialNote}>Save note</button>
                  <button className={styles.editorialNoteActionLink} onClick={() => setEditingNote(false)}>Cancel</button>
                </div>
              </>
            ) : editorialNote ? (
              <>
                <p className={styles.editorialNoteText}>{editorialNote}</p>
                <div className={styles.editorialNoteActions}>
                  <button
                    className={styles.editorialNoteActionLink}
                    onClick={() => { setNoteDraft(editorialNote ?? ''); setEditingNote(true); }}
                  >Edit note</button>
                  <button
                    className={styles.editorialNoteActionLink}
                    data-accent=""
                    onClick={handleOpenDoor}
                  >Open the door</button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.editorialNotePlaceholder}>
                  Your readers can see that you're in revision. Add a note to tell them what you're working on.
                </p>
                <div className={styles.editorialNoteActions}>
                  <button
                    className={styles.editorialNoteActionLink}
                    onClick={() => { setNoteDraft(''); setEditingNote(true); }}
                  >Write a note</button>
                </div>
              </>
            )}
          </div>
        )}

        {isInRevision && (
          <div className={styles.revisionStatsRow}>
            <div className={styles.revisionStatCell}>
              <span className={styles.revisionStatCellLabel}>Notes from before</span>
              <span className={styles.revisionStatCellValue}>
                <button
                  style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setView('notes-from-before')}
                >View →</button>
              </span>
            </div>
          </div>
        )}

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

        {/* ── Reader impressions sparkline ── */}
        <WriterSparkline readers={filteredImpressions} totalChapters={totalChapters} />
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
              return (
                <div key={r.id} className={styles.readerCard}>

                  <div className={styles.readerCardBody}>
                    <Avatar initials={r.initials} tone={r.tone} size={32} />
                    <div>
                      <div className={styles.readerNameRow}>
                        <span className={styles.readerName}>{r.name}</span>
                        <Pill tone={verdictTone[r.verdict] ?? 'neutral'}>{r.verdict}</Pill>
                        {r.arcReservationEarned && <Pill tone="good">ARC Reserved</Pill>}
                        {r.devotionQueued && !r.arcReservationEarned && <Pill tone="accent">Devotion +1</Pill>}
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

      {/* ── Notes from before view (in-revision only) ── */}
      {view === 'notes-from-before' && (
        <NotesFromBefore key={activeId} manuscriptId={activeId} />
      )}

      {/* ── Revision changelog view (in-revision only) ── */}
      {view === 'changelog' && (
        <RevisionChangelogView key={activeId} manuscriptId={activeId} />
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
        {isInRevision && (
          <button
            className={styles.bottomNavTab}
            data-active={view === 'notes-from-before' ? '' : undefined}
            onClick={() => setView('notes-from-before')}
          >Before</button>
        )}
        {isInRevision && (
          <button
            className={styles.bottomNavTab}
            data-active={view === 'changelog' ? '' : undefined}
            onClick={() => setView('changelog')}
          >Log</button>
        )}
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
          readerComments={[]}
          onSend={body => handleLetterSent(composingFor, body)}
          onClose={() => setComposingFor(null)}
        />
      )}
    </section>
  );
}
