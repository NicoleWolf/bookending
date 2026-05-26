import { useState, useRef, useEffect, useCallback, type ReactElement } from 'react';
import { Btn } from '../../shared/ui/atoms';
import { IconCheck } from '../../shared/ui/icons';
import type { Manuscript, Highlight, Pending, Submission, AnnotationRecord, ProgressRecord, ImpressionPointRecord, ReaderChapterNoteRecord } from './types';
import InRevisionReaderView from './InRevisionReaderView';
import { STAR_LABELS, STANCE_ORDER, STANCE_VALUE } from './data';
import type { TemplateAnswers } from './data';
import FeedbackTemplate from './FeedbackTemplate';
import WhatsNextCard from './WhatsNextCard';
import { useAuth } from '../auth';
import styles from './Reading.module.css';
import { api } from '../../lib/api';
import ImpressionSparkline from './ImpressionSparkline';
import MarginColumn from './MarginColumn';

interface ReadingRoomProps {
  msRef: string;
  onBack: () => void;
  arcMode?: boolean;
  onArcFinished?: () => void;
}


export default function ReadingRoom({ msRef, onBack, arcMode, onArcFinished }: ReadingRoomProps) {
  const { session, currentUser } = useAuth();

  const [ms,                setMs]                = useState<Manuscript | null>(null);
  const [msLoading,         setMsLoading]         = useState(true);
  const [doneChapters,      setDoneChapters]      = useState<Set<number>>(new Set());
  const [highlights,        setHighlights]        = useState<Highlight[]>([]);
  const [impressionPoints,  setImpressionPoints]  = useState<ImpressionPointRecord[]>([]);
  const [cohortCount,       setCohortCount]       = useState(0);
  const [alreadySub,        setAlreadySub]        = useState<Submission | null>(null);
  const [authorNoteMap,     setAuthorNoteMap]     = useState<Record<number, string>>({});
  const [chapterId,         setChapterId]         = useState<number | null>(null);
  const [pending,           setPending]           = useState<Pending | null>(null);
  const [draftNote,         setDraftNote]         = useState('');
  const [editingId,         setEditingId]         = useState<string | null>(null);
  const [editDraft,         setEditDraft]         = useState('');
  const [seenChapters,      setSeenChapters]      = useState<Set<number>>(new Set());
  const [firstNoteSaved,    setFirstNoteSaved]    = useState(false);
  const [stars,             setStars]             = useState(0);
  const [message,           setMessage]           = useState('');
  const [templateAnswers,   setTemplateAnswers]   = useState<TemplateAnswers>({});
  const [releasedOverrides] = useState<Record<number, boolean>>({});
  const [focusedHighlightId, setFocusedHighlightId] = useState<string | null>(null);
  const [submittedChapters,  setSubmittedChapters]  = useState<Set<number>>(new Set());
  const [notesSheetOpen,     setNotesSheetOpen]     = useState(false);
  const [chapterNoteMap,     setChapterNoteMap]     = useState<Record<number, ReaderChapterNoteRecord>>({});
  const [rereadMode,         setRereadMode]         = useState(false);
  const [guidelinesAcked,   setGuidelinesAcked]    = useState(true);
  const readingRef = useRef<HTMLDivElement>(null);
  const paraRefMap = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (!ms?.instructions) return;
    if (!localStorage.getItem(`bookending-instr-ack-${msRef}`)) {
      setGuidelinesAcked(false);
    }
  }, [ms?.instructions, msRef]);

  function acknowledgeGuidelines() {
    localStorage.setItem(`bookending-instr-ack-${msRef}`, '1');
    setGuidelinesAcked(true);
  }

  useEffect(() => {
    if (localStorage.getItem(`bookending-first-note-${msRef}`)) setFirstNoteSaved(true);

    if (!session?.token) return;

    void api.get<Manuscript>(`/api/reading/${msRef}/manuscript`)
      .then(data => {
        setMs(data);
        if (data.status === 'IN_REVISION') return; // show InRevisionReaderView first
        const first = data.mode === 'serialized'
          ? (data.chapters.find(ch => ch.releasedAt != null) ?? data.chapters[0])
          : data.chapters[0];
        if (first) setChapterId(first.id);
      })
      .catch(() => {})
      .finally(() => setMsLoading(false));

    void (async () => {
      let data: { progress: ProgressRecord | null; annotations: AnnotationRecord[]; cohortCount: number; chapterNotes: ReaderChapterNoteRecord[] } | null = null;
      try { data = await api.get(`/api/reading/${msRef}`); } catch { return; }
      if (!data) return;

      const { progress, annotations, cohortCount: cc, chapterNotes } = data;
      setCohortCount(cc);
      if (progress) {
        const done = new Set<number>(JSON.parse(progress.doneChapters ?? '[]') as number[]);
        setDoneChapters(done);
        if (progress.stars != null) {
          setAlreadySub({ stars: progress.stars, message: progress.message ?? '' });
          setStars(progress.stars);
          setMessage(progress.message ?? '');
        }
      }
      if (annotations.length > 0) {
        setHighlights(annotations.map(a => ({
          id:           a.id,
          chapterId:    a.chapterId,
          paraId:       a.paraId,
          selectedText: a.selectedText,
          note:         a.note,
          status:       a.status,
          thread:       a.replies ?? [],
          time:         new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        })));
        setSubmittedChapters(new Set(
          annotations.filter(a => a.status === 'submitted').map(a => a.chapterId)
        ));
      }
      if (chapterNotes?.length > 0) {
        const map: Record<number, ReaderChapterNoteRecord> = {};
        chapterNotes.forEach(n => { map[n.chapterNum] = n; });
        setChapterNoteMap(map);
      }
    })();

    void api.get<ImpressionPointRecord[]>(`/api/reading/${msRef}/impression`)
      .then(pts => setImpressionPoints(pts))
      .catch(() => {});

    void api.get<{ chapterNum: number; body: string }[]>(`/api/reading/${msRef}/chapter-notes`)
      .then(notes => {
        if (notes.length === 0) return;
        const map: Record<number, string> = {};
        notes.forEach(n => { map[n.chapterNum] = n.body; });
        setAuthorNoteMap(map);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token, msRef]);

  const putProgress = useCallback((patch: Record<string, unknown>) => {
    if (!session?.token) return;
    void api.put(`/api/reading/${msRef}/progress`, patch).catch(() => {});
  }, [session?.token, msRef]);

  const chapters          = ms?.chapters ?? [];
  const chapter           = chapters.find(c => c.id === chapterId) ?? null;
  const isSerial          = ms?.mode === 'serialized';
  const isReleased        = (ch: typeof chapters[0]) =>
    releasedOverrides[ch.id] !== undefined ? releasedOverrides[ch.id] : (ch.releasedAt != null);
  const releasedChapters  = chapters.filter(isReleased);
  const nextUnreleased    = chapters.find(ch => !isReleased(ch)) ?? null;
  const availableChapters = isSerial ? releasedChapters : chapters;
  const caughtUp          = isSerial && chapter !== null &&
    chapter.id === releasedChapters[releasedChapters.length - 1]?.id &&
    doneChapters.has(chapter.id);
  const allDone           = ms
    ? (isSerial
        ? releasedChapters.length > 0 && releasedChapters.every(ch => doneChapters.has(ch.id)) && !nextUnreleased
        : doneChapters.size === chapters.length)
    : false;

  // ARC mode: sync reading progress when chapters complete
  useEffect(() => {
    if (!arcMode || !ms) return;
    const total = ms.chapters.length;
    if (total === 0) return;
    const pct = Math.round((doneChapters.size / total) * 100);
    void api.patch(`/api/manuscripts/${msRef}/arc/progress`, { readingProgress: pct }).catch(() => {});
  }, [arcMode, doneChapters, ms, msRef]);

  useEffect(() => {
    if (pending) setNotesSheetOpen(true);
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPending(null);
        setDraftNote('');
        window.getSelection()?.removeAllRanges();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [pending]);

  const goToChapter = (id: number) => {
    setRereadMode(true);
    setChapterId(id);
    setPending(null);
    setDraftNote('');
    window.getSelection()?.removeAllRanges();
    setSeenChapters(prev => new Set([...prev, id]));
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
    const text = sel.toString().trim();
    const node = sel.anchorNode;
    if (!node || !readingRef.current?.contains(node)) return;
    let el: Element | null = node instanceof Element ? node : node.parentElement;
    while (el && !el.getAttribute('data-para-id')) el = el.parentElement;
    if (!el) return;
    setPending({ chapterId: Number(el.getAttribute('data-chapter-id')), paraId: Number(el.getAttribute('data-para-id')), text });
    setDraftNote('');
    // Keep selection active — text stays highlighted in the article
  };

  const saveNote = async () => {
    if (!pending) return;
    window.getSelection()?.removeAllRanges();
    const tempId = `tmp-${Date.now()}`;
    const h: Highlight = {
      id: tempId, chapterId: pending.chapterId, paraId: pending.paraId,
      selectedText: pending.text, note: draftNote.trim(),
      status: 'draft', thread: [], time: 'just now',
    };
    setHighlights(p => [...p, h]);
    setPending(null); setDraftNote('');
    if (!firstNoteSaved) {
      setFirstNoteSaved(true);
      localStorage.setItem(`bookending-first-note-${msRef}`, '1');
    }
    try {
      const created = await api.post<AnnotationRecord>(`/api/reading/${msRef}/annotations`, {
        chapterId: h.chapterId, paraId: h.paraId, selectedText: h.selectedText, note: h.note,
      });
      setHighlights(p => p.map(x => x.id === tempId ? { ...x, id: created.id } : x));
    } catch { /* temp ID remains */ }
  };

  const saveEdit = (id: string) => {
    setHighlights(p => p.map(h => h.id === id ? { ...h, note: editDraft } : h));
    setEditingId(null);
    if (session?.token) void api.patch(`/api/reading/${msRef}/annotations/${id}`, { note: editDraft }).catch(() => {});
  };

  const deleteHighlight = (id: string) => {
    setHighlights(p => p.filter(h => h.id !== id));
    if (editingId === id) setEditingId(null);
    if (session?.token && !id.startsWith('tmp-')) void api.del(`/api/reading/${msRef}/annotations/${id}`).catch(() => {});
  };

  const submitFinish = () => {
    if (stars === 0) return;
    setAlreadySub({ stars, message, templateAnswers });
    putProgress({
      stars, message,
      templateJson: JSON.stringify(templateAnswers),
      submittedAt: new Date().toISOString(),
    });
  };

  const upsertImpression = (chapterNum: number, stance: string) => {
    setImpressionPoints(prev => {
      const next = prev.filter(p => p.chapterNum !== chapterNum);
      return [...next, { id: `local-${chapterNum}`, chapterNum, stance, createdAt: new Date().toISOString() }];
    });
    if (session?.token) void api.put(`/api/reading/${msRef}/impression/${chapterNum}`, { stance }).catch(() => {});
  };

  const submitChapter = (chapterNum: number) => {
    setHighlights(prev => prev.map(h => h.chapterId === chapterNum ? { ...h, status: 'submitted' as const } : h));
    setChapterNoteMap(prev => {
      const note = prev[chapterNum];
      if (!note) return prev;
      return { ...prev, [chapterNum]: { ...note, status: 'submitted' } };
    });
    setSubmittedChapters(prev => new Set([...prev, chapterNum]));
    if (session?.token) void api.post(`/api/reading/${msRef}/chapters/${chapterNum}/submit`, {}).catch(() => {});
  };

  const saveChapterNote = (chapterNum: number, body: string) => {
    if (!session?.token) return;
    setChapterNoteMap(prev => ({
      ...prev,
      [chapterNum]: { id: prev[chapterNum]?.id ?? '', chapterNum, body, status: prev[chapterNum]?.status ?? 'draft', createdAt: prev[chapterNum]?.createdAt ?? new Date().toISOString() },
    }));
    void api.put(`/api/reading/${msRef}/chapters/${chapterNum}/reader-note`, { body }).catch(() => {});
  };

  const renderPara = (text: string, cId: number, pId: number) => {
    const hl = highlights.filter(h => h.chapterId === cId && h.paraId === pId);
    const hasPending = pending?.chapterId === cId && pending?.paraId === pId;
    if (hl.length === 0 && !hasPending) return text;

    const nodes: (string | ReactElement)[] = [];
    let rem = text;

    if (hasPending && pending) {
      const idx = rem.indexOf(pending.text);
      if (idx !== -1) {
        if (idx > 0) nodes.push(rem.slice(0, idx));
        nodes.push(<span key="pending" className={styles.pendingHighlight}>{pending.text}</span>);
        rem = rem.slice(idx + pending.text.length);
      }
    }

    for (const h of hl) {
      const idx = rem.indexOf(h.selectedText);
      if (idx === -1) continue;
      if (idx > 0) nodes.push(rem.slice(0, idx));
      nodes.push(
        <span
          key={h.id}
          className={styles.highlight}
          data-focused={focusedHighlightId === h.id ? 'true' : undefined}
          onClick={() => setFocusedHighlightId(prev => prev === h.id ? null : h.id)}
        >
          {h.selectedText}
        </span>
      );
      rem = rem.slice(idx + h.selectedText.length);
    }
    if (rem) nodes.push(rem);
    return nodes;
  };

  if (!ms) {
    return (
      <section className={styles.section}>
        <div className={styles.notFoundWrap}>
          <button onClick={onBack} className={styles.backBtn}>← Back to reading</button>
          <p className={styles.notFoundMsg}>
            {msLoading ? 'Loading…' : 'Manuscript not found or access denied.'}
          </p>
        </div>
      </section>
    );
  }

  const isInRevision = ms.status === 'IN_REVISION';

  const authorFirstName = 'the author';
  const readerName  = (session as { user?: { name?: string } } | null)?.user?.name?.split(' ')[0];
  const readerLabel = readerName ? `${readerName}'s desk` : 'your desk';

  const unreadReplies = highlights.reduce((sum, h) =>
    sum + h.thread.filter(t => t.authorRole === 'writer' && !t.readAt).length, 0);

  const currentChapterNum    = chapter?.number ?? null;
  const draftNotesOnChapter  = currentChapterNum !== null
    ? highlights.filter(h => h.chapterId === currentChapterNum && h.status === 'draft')
    : [];
  const chapterSent  = chapter !== null && submittedChapters.has(chapter.number);
  const hasNewDrafts = draftNotesOnChapter.length > 0;

  const currentImpression = chapter
    ? impressionPoints.find(p => p.chapterNum === chapter.number)?.stance ?? null
    : null;
  return (
    <section className={styles.section}>

      {/* ── Author guidelines gate ──────────────────────────────────── */}
      {!guidelinesAcked && ms.instructions && (
        <div className={styles.guideGate} role="dialog" aria-modal="true" aria-label="Author's guidelines">
          <div className={styles.guidePanel}>
            <div className={styles.guideEyebrow}>{ms.title}</div>
            <h2 className={`serif ${styles.guideHeading}`}>Author's Guidelines</h2>
            <div className={styles.guideDivider} />
            <p className={`serif ${styles.guideBody}`}>{ms.instructions}</p>
            <div className={styles.guideDivider} />
            <div className={styles.guideFooter}>
              <p className={styles.guideFootnote}>
                The author asks that you read these before beginning. They won't appear again.
              </p>
              <button className={styles.guideAckBtn} onClick={acknowledgeGuidelines}>
                I've read these — begin reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Background content (inert while guidelines gate is open) ── */}
      <div {...(!guidelinesAcked && ms.instructions ? { inert: true } : {})}>

      {/* ── Masthead ────────────────────────────────────────────────── */}
      <div className={styles.roomHeader}>
        <div className={styles.roomHeaderLeft}>
          <button className={styles.backBtn} onClick={onBack}>← Back to reading</button>
          {isInRevision && rereadMode && (
            <button
              className={styles.backBtn}
              style={{ marginLeft: 16 }}
              onClick={() => { setRereadMode(false); setChapterId(null); }}
            >
              ← Back to overview
            </button>
          )}
          <span className={styles.roomEyebrow}>§ · READING ROOM · {readerLabel.toUpperCase()}</span>
          <h1 className={`serif ${styles.roomTitle}`}>{ms.title}</h1>
          <span className={styles.roomKicker}>
            By {authorFirstName} · {ms.draft} · you are{cohortCount > 0 ? ` 1 of ${cohortCount}` : ' an'} early reader{cohortCount !== 1 ? 's' : ''}
          </span>
        </div>
        {unreadReplies > 0 && (
          <div className={styles.replyPill}>
            <span className={styles.replyPillAvatar}>{authorFirstName.slice(0, 2).toUpperCase()}</span>
            <em className={`serif ${styles.replyPillText}`}>{unreadReplies} new {unreadReplies === 1 ? 'reply' : 'replies'} from {authorFirstName}</em>
          </div>
        )}
      </div>

      {/* ── In Revision landing view ──────────────────────────────── */}
      {isInRevision && !rereadMode && (
        <InRevisionReaderView
          ms={ms}
          highlights={highlights}
          onReread={goToChapter}
        />
      )}

      {/* ── Chapter tabs (hidden in in-revision landing) ─────────── */}
      <div className={styles.chTabs} style={isInRevision && !rereadMode ? { display: 'none' } : undefined}>
        {chapters.map((ch) => {
          const active    = ch.id === chapterId;
          const released  = !isSerial || isReleased(ch);
          const hasUnread = highlights.some(h =>
            h.chapterId === ch.id && h.thread.some(t => t.authorRole === 'writer' && !t.readAt));
          const isNewCh     = isSerial && released && !seenChapters.has(ch.id) && ch.id !== chapterId && ch.releasedAt;
          const chSubmitted = submittedChapters.has(ch.number);
          return (
            <button
              key={ch.id}
              className={styles.chTab}
              data-active={active ? 'true' : undefined}
              data-locked={!released ? 'true' : undefined}
              data-submitted={chSubmitted ? 'true' : undefined}
              onClick={() => released ? goToChapter(ch.id) : undefined}
              disabled={!released}
            >
              {released ? (
                <>
                  <span className={styles.chTabTitle}>{ch.title}</span>
                  {hasUnread && <span className={styles.chUnreadDot} />}
                  {isNewCh && <span className={styles.chNewBadge}>NEW</span>}
                  {chSubmitted && !hasUnread && !isNewCh && <span className={styles.chSentDot} />}
                </>
              ) : (
                <span className={styles.chTabLocked}>
                  Ch. {ch.number + 1} —{' '}
                  {ch.expectedAt
                    ? `expected ${new Date(ch.expectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                    : 'not yet scheduled'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Body grid ──────────────────────────────────────────────── */}
      <div className={styles.bodyGrid} style={isInRevision && !rereadMode ? { display: 'none' } : undefined}>
        <div className={styles.bodyMain}>

          {/* Author guidelines — collapsible reference strip */}
          {chapter && ms.instructions && (
            <details className={styles.instrDetails}>
              <summary className={styles.instrSummary}>
                ▾ Author's Guidelines
              </summary>
              <div className={styles.instrBody}>
                <p className={`serif ${styles.instrText}`}>{ms.instructions}</p>
              </div>
            </details>
          )}

          {/* Manuscript body */}
          {chapter && (
            <article
              ref={readingRef}
              onMouseUp={arcMode ? undefined : handleMouseUp}
              className={styles.articleBody}
              style={arcMode ? { userSelect: 'none', position: 'relative' } : undefined}
            >
              {arcMode && (
                <div
                  aria-hidden
                  className={styles.arcWatermark}
                  style={{
                    '--wm-text': `"${currentUser?.name?.split(' ')[0] ?? 'ARC'} · ARC"`,
                  } as React.CSSProperties}
                />
              )}
              <h2 className={`serif ${styles.chTitle}`}>
                <span className={styles.chTitleNum}>Chapter {chapter.number + 1}</span>
                {chapter.title !== `Chapter ${chapter.number + 1}` && (
                  <span className={styles.chTitleName}>{chapter.title}</span>
                )}
              </h2>

              {chapter.paras.map((p, idx) => (
                <p
                  key={p.id}
                  data-para-id={p.id}
                  data-chapter-id={chapter.id}
                  className={`serif ${styles.chPara}${idx === 0 ? ` ${styles.chParaFirst}` : ''}`}
                  ref={el => {
                    const key = `${chapter.id}-${p.id}`;
                    if (el) paraRefMap.current.set(key, el);
                    else paraRefMap.current.delete(key);
                  }}
                >
                  {renderPara(p.text, chapter.id, p.id)}
                </p>
              ))}

              {/* Chapter footer — impression picker + send */}
              <div className={styles.chFooter}>
                {/* Chapter-level note (no highlight required) */}
                <div className={styles.chNoteRow}>
                  <span className={styles.chFooterLabel}>CHAPTER NOTE</span>
                  <textarea
                    className={styles.chNoteTextarea}
                    placeholder={`A note for ${authorFirstName} about this chapter…`}
                    defaultValue={chapterNoteMap[chapter.number]?.body ?? ''}
                    key={chapter.number}
                    onBlur={e => {
                      const val = e.currentTarget.value.trim();
                      if (val !== (chapterNoteMap[chapter.number]?.body ?? '')) {
                        saveChapterNote(chapter.number, val);
                      }
                    }}
                  />
                </div>

                <div className={styles.chFooterRow}>
                  <span className={styles.chFooterLabel}>YOUR IMPRESSION</span>
                  <div className={styles.stanceRow}>
                    {STANCE_ORDER.map(s => (
                      <button
                        key={s}
                        className={styles.stanceBtn}
                        data-active={currentImpression === s ? 'true' : undefined}
                        onClick={() => upsertImpression(chapter.number, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.chFooterRow}>
                  <span className={styles.chFooterNotes} data-sent={chapterSent && !hasNewDrafts ? 'true' : undefined}>
                    {chapterSent && !hasNewDrafts
                      ? `Sent to ${authorFirstName}`
                      : hasNewDrafts
                        ? `${draftNotesOnChapter.length} note${draftNotesOnChapter.length === 1 ? '' : 's'} drafted`
                        : 'No notes yet'}
                  </span>
                  {chapterSent && !hasNewDrafts ? (
                    <button className={styles.resendBtn} onClick={() => submitChapter(chapter.number)}>send again</button>
                  ) : (
                    <Btn tone="accent" onClick={() => submitChapter(chapter.number)}>
                      {chapterSent ? 'Send update →' : `Send to ${authorFirstName} →`}
                    </Btn>
                  )}
                </div>
              </div>

              {/* Prev / next pagination */}
              <div className={styles.chPagination}>
                {(() => {
                  const idx  = availableChapters.findIndex(c => c.id === chapter.id);
                  const prev = availableChapters[idx - 1];
                  const next = availableChapters[idx + 1];
                  return (
                    <>
                      {prev
                        ? <button className={styles.chPaginationBtn} onClick={() => goToChapter(prev.id)}>← Ch. {prev.number + 1} · {prev.title}</button>
                        : <span />}
                      {next
                        ? <button className={styles.chPaginationBtn} data-next="true" onClick={() => goToChapter(next.id)}>Ch. {next.number + 1} · {next.title} ›</button>
                        : <span />}
                    </>
                  );
                })()}
              </div>

              {/* Caught-up state */}
              {isSerial && caughtUp && nextUnreleased && (
                <div className={styles.caughtUpBox}>
                  <div className={styles.caughtUpFlex}>
                    <div className={styles.caughtUpBody}>
                      <div className={`label ${styles.caughtUpLabel}`}>You're caught up</div>
                      <p className={`serif ${styles.caughtUpText}`}>Chapter {nextUnreleased.number + 1} hasn't been released yet. Check back soon — or leave your notes on what you've read so far.</p>
                    </div>
                    <div className={styles.caughtUpRight}>
                      <div className={`serif ${styles.caughtUpCount}`}>{releasedChapters.length}<span className={styles.caughtUpCountOf}> / {chapters.length}</span></div>
                      <div className={styles.caughtUpSub}>CHAPTERS OUT</div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          )}

          {/* Highlight hint — retires after first note */}
          {!firstNoteSaved && highlights.length === 0 && (
            <p className={styles.highlightHint}>Highlight any passage to leave a note</p>
          )}
        </div>

        {/* ── Right column: chapter note + margin annotations ─── */}
        <div className={styles.rightCol}>
          {chapter && authorNoteMap[chapter.number] && (
            <div className={styles.authorNoteBox}>
              <span className={styles.authorNoteHead}>A chapter note from {authorFirstName}</span>
              <p className={styles.authorNoteText}>{authorNoteMap[chapter.number]}</p>
            </div>
          )}
          <MarginColumn
            highlights={chapter ? highlights.filter(h => h.chapterId === chapter.id) : []}
            paraRefMap={paraRefMap}
            chapterId={chapterId}
            onEdit={(id, draft) => { setEditingId(id); setEditDraft(draft); }}
            onSaveEdit={saveEdit}
            onDelete={deleteHighlight}
            editingId={editingId}
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            authorFirstName={authorFirstName}
            focusedHighlightId={focusedHighlightId}
            onClearFocus={() => setFocusedHighlightId(null)}
            pendingDraft={pending ? {
              pending,
              draftNote,
              onNoteChange: setDraftNote,
              onSave: saveNote,
              onDismiss: () => { setPending(null); setDraftNote(''); window.getSelection()?.removeAllRanges(); },
            } : undefined}
          />
        </div>
      </div>

      {/* ── Impression sparkline ──────────────────────────────────── */}
      <ImpressionSparkline
        chapters={chapters}
        impressionPoints={impressionPoints}
        currentChapterId={chapterId}
        doneChapters={doneChapters}
        authorFirstName={authorFirstName}
        onUpdate={upsertImpression}
        stanceOrder={STANCE_ORDER}
        stanceValue={STANCE_VALUE}
      />

      {/* ── ARC completion gesture ───────────────────────────────── */}
      {arcMode && allDone && (
        <div className={styles.arcFinish}>
          <div className={`label ${styles.arcFinishEyebrow}`}>Advance reader copy</div>
          <p className={`serif ${styles.arcFinishTitle}`}>You've read {ms.title}.</p>
          <p className={styles.arcFinishBody}>
            Now share your honest reaction — whatever it is. Your review appears on the book's listing the day it launches.
          </p>
          <button className={styles.arcFinishBtn} onClick={onArcFinished}>
            Post your review →
          </button>
        </div>
      )}

      {/* ── Manuscript completion panel ──────────────────────────── */}
      {!arcMode && allDone && (
        <div className={styles.completion}>
          {alreadySub ? (
            <div className={styles.alreadySub}>
              <div className={styles.submitLabel}>Reading submitted</div>
              <p className={`serif ${styles.submitTitle}`}>Your reading of <em>{ms.title}</em> is complete.</p>
              <p className={styles.submitSummary}>
                {alreadySub.stars} star{alreadySub.stars !== 1 ? 's' : ''} · {highlights.length} note{highlights.length !== 1 ? 's' : ''}
                {alreadySub.templateAnswers && Object.keys(alreadySub.templateAnswers).length > 0
                  ? ` · structured feedback`
                  : ''
                } sent to {authorFirstName}.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.finishHeader}>
                <div className="label">You've finished the manuscript</div>
              </div>

              {/* Star rating */}
              <div className={styles.starsSection}>
                <div className={styles.starsLabel}>STAR RATING</div>
                <div className={styles.starsRow}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} className={styles.compStarBtn} data-lit={n <= stars ? 'true' : undefined} onClick={() => setStars(n)}>★</button>
                  ))}
                </div>
                {stars > 0 && <div className={styles.starRatingLabel}>{STAR_LABELS[stars].toUpperCase()}</div>}
              </div>

              {/* Structured feedback template */}
              <FeedbackTemplate answers={templateAnswers} onChange={setTemplateAnswers} />

              {/* Message + submit */}
              <div className={styles.msgSection}>
                <div className={styles.msgLabel}>ADDITIONAL NOTES (OPTIONAL)</div>
                <textarea className={styles.msgTextarea} placeholder="A final note for the writer…" value={message} onChange={e => setMessage(e.target.value)} />
                <Btn tone="accent" icon={<IconCheck size={14} />} onClick={submitFinish} disabled={stars === 0}>Submit reading</Btn>
                {stars === 0 && <div className={styles.noRatingHint}>ADD A STAR RATING TO SUBMIT</div>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── What's next card ─────────────────────────────────────── */}
      {allDone && <WhatsNextCard msRef={msRef} />}

      <footer className={styles.roomFooter}>Bookending · a reading room for works in progress</footer>

      {/* ── Mobile: floating notes badge + bottom sheet ──────────── */}
      {(() => {
        const chapterHighlights = chapter
          ? highlights.filter(h => h.chapterId === chapter.id)
          : [];
        const noteCount = chapterHighlights.length + (pending ? 1 : 0);
        if (noteCount === 0) return null;
        return (
          <>
            <button
              className={styles.notesFloatBtn}
              onClick={() => setNotesSheetOpen(true)}
            >
              <span className={styles.notesFloatBadge}>{noteCount}</span>
              Notes
            </button>
            {notesSheetOpen && (
              <>
                <div className={styles.notesSheetBackdrop} onClick={() => setNotesSheetOpen(false)} />
                <div className={styles.notesSheet}>
                  <div className={styles.notesSheetHead}>
                    <span className={styles.notesSheetTitle}>
                      {noteCount} note{noteCount !== 1 ? 's' : ''} · {chapter?.title}
                    </span>
                    <button className={styles.notesSheetClose} onClick={() => setNotesSheetOpen(false)}>✕</button>
                  </div>
                  <div className={styles.notesSheetBody}>
                    <MarginColumn
                      layout="sheet"
                      highlights={chapterHighlights}
                      paraRefMap={paraRefMap}
                      chapterId={chapterId}
                      onEdit={(id, draft) => { setEditingId(id); setEditDraft(draft); }}
                      onSaveEdit={saveEdit}
                      onDelete={deleteHighlight}
                      editingId={editingId}
                      editDraft={editDraft}
                      setEditDraft={setEditDraft}
                      authorFirstName={authorFirstName}
                      focusedHighlightId={focusedHighlightId}
                      onClearFocus={() => setFocusedHighlightId(null)}
                      pendingDraft={pending ? {
                        pending,
                        draftNote,
                        onNoteChange: setDraftNote,
                        onSave: saveNote,
                        onDismiss: () => { setPending(null); setDraftNote(''); setNotesSheetOpen(false); window.getSelection()?.removeAllRanges(); },
                      } : undefined}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        );
      })()}

      </div>{/* end inert wrapper */}
    </section>
  );
}
