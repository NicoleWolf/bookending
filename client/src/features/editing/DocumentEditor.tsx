import { useRef, useState, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { INITIAL_CONTENT, MANUSCRIPT_META } from './data';
import FeedbackPanel from './FeedbackPanel';
import CommunityPanel from './CommunityPanel';
import AnnotationPanel from './AnnotationPanel';
import ChapterNotesPanel from './ChapterNotesPanel';
import VersionList from './VersionList';
import type { VersionMeta } from './VersionList';
import RestoreModal from './RestoreModal';
import ChapterSidebar from './ChapterSidebar';
import { useQuietMode } from '../quiet-mode/QuietModeContext';
import { api } from '../../lib/api';
import styles from './DocumentEditor.module.css';

// ── Helpers ───────────────────────────────────────────────────────
function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatElapsedSummary(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s} ${s === 1 ? 'second' : 'seconds'}`;
  if (s === 0) return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  return `${m} ${m === 1 ? 'minute' : 'minutes'}, ${s} seconds`;
}

// ── Types ─────────────────────────────────────────────────────────
type EditorMode    = 'write' | 'compare' | 'feedback' | 'community' | 'annotate' | 'notes';
type SaveState     = 'idle' | 'saving' | 'saved' | 'error';
type Block         = { html: string; text: string };
interface ChapterSlice { title: string; html: string; }
interface VersionDetail {
  id:       string;
  number:   number;
  label:    string;
  createdAt: string;
  chapters: { id: string; chapterNum: number; title: string; content: string; wordCount: number }[];
}

// ── Reader annotation shape (from /api/manuscripts/:id/reader-annotations) ──
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

interface ReaderImpression {
  readerId:       string;
  readerName:     string;
  readerInitials: string;
  points:         { chapterNum: number; stance: string }[];
}

function applyHighlight(root: HTMLElement, text: string, theme: string, commentId: string) {
  if (!text) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const content = node.textContent ?? '';
    const idx = content.indexOf(text);
    if (idx === -1) continue;
    const mark = document.createElement('mark');
    mark.className = 'readerHighlight';
    mark.dataset.theme = theme;
    mark.dataset.commentId = String(commentId);
    mark.textContent = text;
    const parent = node.parentNode!;
    const before = content.slice(0, idx);
    const after  = content.slice(idx + text.length);
    if (before) parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(mark, node);
    if (after)  parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
    break;
  }
}

function clearHighlights(root: HTMLElement) {
  root.querySelectorAll('mark.readerHighlight').forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
    parent.normalize();
  });
}

// ── Chapter parser ────────────────────────────────────────────────
// Splits manuscript HTML at <h3> boundaries. Preceding <h1>/<h2> elements
// are buffered and prepended to the chapter that follows them.
function parseChapters(html: string): ChapterSlice[] {
  const doc      = new DOMParser().parseFromString(html, 'text/html');
  const children = Array.from(doc.body.children);
  const chapters: ChapterSlice[] = [];
  let buffer:  Element[]       = [];
  let current: Element[] | null = null;
  let title = '';

  for (const el of children) {
    if (el.tagName === 'H1' || el.tagName === 'H2') {
      if (current !== null) {
        chapters.push({ title, html: current.map(e => e.outerHTML).join('\n') });
        current = null;
        title   = '';
      }
      buffer.push(el);
    } else if (el.tagName === 'H3') {
      if (current !== null) {
        chapters.push({ title, html: current.map(e => e.outerHTML).join('\n') });
      }
      title   = el.textContent?.trim() ?? 'Chapter';
      current = [...buffer, el];
      buffer  = [];
    } else if (current !== null) {
      current.push(el);
    }
  }

  if (current !== null) {
    chapters.push({ title, html: current.map(e => e.outerHTML).join('\n') });
  }
  if (chapters.length === 0 && html.trim()) {
    chapters.push({ title: 'Document', html });
  }
  return chapters;
}

// ── Chapter-aware storage ─────────────────────────────────────────
function chDocKey(msId: number, chIdx: number)  { return `bookending_doc_${msId}_ch_${chIdx}`; }
function chSnapKey(msId: number, chIdx: number) { return `bookending_snap_${msId}_ch_${chIdx}`; }

function loadChapterContent(msId: number, chIdx: number, initial: string): string {
  try { return localStorage.getItem(chDocKey(msId, chIdx)) || initial; }
  catch { return initial; }
}

function loadChapterSnapshot(msId: number, chIdx: number, initial: string): string {
  try { return localStorage.getItem(chSnapKey(msId, chIdx)) || initial; }
  catch { return initial; }
}

// ── HTML block parser (compare) ───────────────────────────────────
function parseBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.body.children).map(el => ({
    html: el.outerHTML,
    text: (el.textContent ?? '').trim(),
  }));
}

// ── Compare pane ──────────────────────────────────────────────────
function ComparePane({ html, otherHtml, label, meta, side }: {
  html:      string;
  otherHtml: string;
  label:     string;
  meta:      string;
  side:      'old' | 'new';
}) {
  const blocks     = useMemo(() => parseBlocks(html), [html]);
  const otherTexts = useMemo(
    () => new Set(parseBlocks(otherHtml).map(b => b.text)),
    [otherHtml],
  );

  return (
    <div className={styles.comparePane}>
      <div className={styles.comparePaneHead}>
        <span className={styles.comparePaneLabel}>{label}</span>
        <span className={styles.comparePaneMeta}>{meta}</span>
      </div>
      <div className={styles.compareScroll}>
        <div className={styles.comparePage}>
          {blocks.map((b, i) => {
            const changed = b.text.length > 0 && !otherTexts.has(b.text);
            return (
              <div
                key={i}
                className={styles.compareBlock}
                data-diff={changed ? side : undefined}
                dangerouslySetInnerHTML={{ __html: b.html }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
interface Props {
  manuscriptId: string;
}

export default function DocumentEditor({ manuscriptId }: Props) {
  const msId    = Number(manuscriptId);
  const ctx     = useQuietMode();
  const isQuiet = ctx.isQuiet;

  // Parse chapter structure — prefer imported file, then built-in sample content
  const [chapters, setChapters] = useState<ChapterSlice[]>(() => {
    let base: string;
    try {
      base = localStorage.getItem(`bookending_import_${manuscriptId}`) ?? INITIAL_CONTENT[msId] ?? '';
    } catch {
      base = INITIAL_CONTENT[msId] ?? '';
    }
    return parseChapters(base);
  });

  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [mobileGroup, setMobileGroup]           = useState<'format' | 'view' | null>(null);
  const [mode, setMode]                         = useState<EditorMode>('write');
  const [saveState, setSaveState]               = useState<SaveState>('idle');
  const [activeChapter, setActiveChapter]       = useState(0);
  const [elapsedMs,        setElapsedMs]        = useState(0);
  const [showSummary,      setShowSummary]      = useState(false);
  const [summaryWords,     setSummaryWords]     = useState(0);
  const [summaryElapsedMs, setSummaryElapsedMs] = useState(0);
  const [hasSnap, setHasSnap]                   = useState(() => {
    try { return !!localStorage.getItem(chSnapKey(msId, 0)); } catch { return false; }
  });
  const [selectedText,      setSelectedText]      = useState('');
  const [focusedCommentId,  setFocusedCommentId]  = useState<string | null>(null);
  const [readerAnnotations, setReaderAnnotations] = useState<ReaderAnnotation[]>([]);
  const [readerImpressions, setReaderImpressions] = useState<ReaderImpression[]>([]);
  const [versions,              setVersions]              = useState<VersionMeta[]>([]);
  const [selectedVersionId,     setSelectedVersionId]     = useState<string | null>(null);
  const [selectedVersionDetail, setSelectedVersionDetail] = useState<VersionDetail | null>(null);
  const [confirmRestore,        setConfirmRestore]        = useState(false);
  const [restoring,             setRestoring]             = useState(false);
  const [deleteConfirmIdx,      setDeleteConfirmIdx]      = useState<number | null>(null);

  const saveTimer           = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedTimer          = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const highlightTimer      = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionStartWords   = useRef(0);
  const sessionStartTime    = useRef(0);
  const elapsedTimerRef     = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const exitQuietRef        = useRef<() => void>(() => {});
  // Ref keeps the active chapter index accessible inside editor callbacks
  const activeChapterRef = useRef(0);
  useEffect(() => { activeChapterRef.current = activeChapter; }, [activeChapter]);
  // Ref keeps editor accessible inside the Cmd/Ctrl+S handler without stale closure
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  // Maps editor chapter index → DB chapter number (populated on mount from API)
  const chapterNumbersRef = useRef<Record<number, number>>({});
  // Chapters ref so API callbacks can access latest chapter metadata without stale closures
  const chaptersRef = useRef(chapters);
  useEffect(() => { chaptersRef.current = chapters; }, [chapters]);


  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Begin writing your manuscript here…' }),
    ],
    content: loadChapterContent(msId, 0, chapters[0]?.html ?? ''),
    onUpdate({ editor: ed }) {
      setSaveState('saving');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const html = ed.getHTML();
        const idx  = activeChapterRef.current;
        try { localStorage.setItem(chDocKey(msId, idx), html); } catch {}
        const dbNum = chapterNumbersRef.current[idx] ?? idx;
        const title = chaptersRef.current[idx]?.title ?? `Chapter ${idx + 1}`;
        api.put(`/api/manuscripts/${manuscriptId}/chapters/${dbNum}`, { title, content: html })
          .then(() => { setSaveState('saved'); clearTimeout(savedTimer.current); savedTimer.current = setTimeout(() => setSaveState('idle'), 2000); })
          .catch(err => { console.error('[chapter autosave]', err); setSaveState('error'); });
      }, 600);
    },
  });

  // Keep editorRef in sync so the Cmd/Ctrl+S handler always has the current instance
  useEffect(() => { editorRef.current = editor; }, [editor]);

  // On editor ready: fetch persisted chapters from API, populate chapterNumbersRef,
  // and rebuild chapter state so added chapters survive page reloads.
  useEffect(() => {
    if (!editor) return;
    type ApiChapter = { number: number; title: string; content: string | null };
    api.get<ApiChapter[]>(`/api/manuscripts/${manuscriptId}/chapters`)
      .then(apiChapters => {
        apiChapters.forEach((ac, pos) => { chapterNumbersRef.current[pos] = ac.number; });

        if (apiChapters.length > 0) {
          // API is source of truth for structure — any chapters added since last
          // load are only in the DB, not in the localStorage/initial state.
          const fromApi: ChapterSlice[] = apiChapters.map(ac => ({
            title: ac.title,
            html:  ac.content ?? '',
          }));
          setChapters(fromApi);

          // Load the active chapter's content into the editor
          const activeApiCh = apiChapters[activeChapterRef.current];
          if (activeApiCh?.content) {
            editor.commands.setContent(activeApiCh.content);
            try { localStorage.setItem(chDocKey(msId, activeChapterRef.current), activeApiCh.content); } catch {}
          }

          // Migrate any chapters that have no API content yet (content saved
          // locally but not yet flushed to the server)
          apiChapters.forEach((ac, idx) => {
            if (ac.content) return;
            const chs   = chaptersRef.current;
            const local = (() => { try { return localStorage.getItem(chDocKey(msId, idx)); } catch { return null; } })();
            const activeHtml    = idx === activeChapterRef.current ? editor.getHTML() : null;
            const contentToSave = local ?? activeHtml ?? chs[idx]?.html ?? null;
            if (contentToSave && contentToSave.trim() && contentToSave !== '<p></p>') {
              const dbNum = chapterNumbersRef.current[idx] ?? idx;
              void api.put(`/api/manuscripts/${manuscriptId}/chapters/${dbNum}`, {
                title: ac.title, content: contentToSave,
              }).catch(err => console.error('[chapter init save]', err));
            }
          });
        } else {
          // No DB chapters yet — first ever load. Migrate local/initial content
          // up to the server so subsequent loads use the API path above.
          const chs = chaptersRef.current;
          chs.forEach((ch, idx) => {
            const local = (() => { try { return localStorage.getItem(chDocKey(msId, idx)); } catch { return null; } })();
            const activeHtml    = idx === activeChapterRef.current ? editor.getHTML() : null;
            const contentToSave = local ?? activeHtml ?? ch.html ?? null;
            if (contentToSave && contentToSave.trim() && contentToSave !== '<p></p>') {
              const dbNum = chapterNumbersRef.current[idx] ?? idx;
              void api.put(`/api/manuscripts/${manuscriptId}/chapters/${dbNum}`, {
                title: ch.title, content: contentToSave,
              }).catch(err => console.error('[chapter init save]', err));
            }
          });
        }
      })
      .catch(err => console.error('[chapter init fetch]', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Fetch versions list on mount
  useEffect(() => {
    api.get<VersionMeta[]>(`/api/manuscripts/${manuscriptId}/versions`)
      .then(vs => {
        setVersions(vs);
        if (vs.length > 0) setSelectedVersionId(vs[0].id);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscriptId]);

  // Fetch submitted reader annotations + impression curves for the feedback panel
  useEffect(() => {
    api.get<ReaderAnnotation[]>(`/api/manuscripts/${manuscriptId}/reader-annotations`)
      .then(data => setReaderAnnotations(data))
      .catch(() => {});
    api.get<ReaderImpression[]>(`/api/manuscripts/${manuscriptId}/reader-impressions`)
      .then(data => setReaderImpressions(data))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscriptId]);

  // Fetch full version detail when selection changes
  useEffect(() => {
    if (!selectedVersionId) { setSelectedVersionDetail(null); return; }
    api.get<VersionDetail>(`/api/manuscripts/${manuscriptId}/versions/${selectedVersionId}`)
      .then(setSelectedVersionDetail)
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionId]);

  useEffect(() => () => {
    clearTimeout(saveTimer.current);
    clearTimeout(savedTimer.current);
    clearTimeout(highlightTimer.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
  }, []);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(mode === 'write' || mode === 'compare' || mode === 'notes');
    if (mode !== 'annotate') setSelectedText('');
    if (mode !== 'feedback') setFocusedCommentId(null);
  }, [mode, editor]);

  useEffect(() => {
    if (!editor) return;
    clearTimeout(highlightTimer.current);
    if (mode !== 'feedback') {
      clearHighlights(editor.view.dom as HTMLElement);
      return;
    }
    highlightTimer.current = setTimeout(() => {
      const dom      = editor.view.dom as HTMLElement;
      const activeChNum = chapterNumbersRef.current[activeChapterRef.current] ?? (activeChapterRef.current + 1);
      clearHighlights(dom);
      readerAnnotations
        .filter(a => a.chapterId === activeChNum)
        .forEach(a => applyHighlight(dom, a.selectedText, 'other', a.id));
    }, 0);
    return () => clearTimeout(highlightTimer.current);
  }, [mode, editor, manuscriptId, readerAnnotations]);

  useEffect(() => {
    if (!editor || mode !== 'feedback') return;
    const dom = editor.view.dom as HTMLElement;
    dom.querySelectorAll('mark.readerHighlight').forEach(mark => {
      const el = mark as HTMLElement;
      if (focusedCommentId !== null && el.dataset.commentId === String(focusedCommentId)) {
        el.dataset.selected = '';
      } else {
        delete el.dataset.selected;
      }
    });
  }, [focusedCommentId, mode, editor]);

  // ── Quiet mode ────────────────────────────────────────────────────
  function enterQuiet() {
    if (!editor) return;
    setMode('write');
    sessionStartWords.current = editor.getText().split(/\s+/).filter(Boolean).length;
    sessionStartTime.current  = Date.now();
    setElapsedMs(0);
    elapsedTimerRef.current = setInterval(
      () => setElapsedMs(Date.now() - sessionStartTime.current),
      1000,
    );
    ctx.enter();
  }

  function exitQuiet() {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = undefined;
    }
    const elapsed      = Date.now() - sessionStartTime.current;
    const currentWords = editor ? editor.getText().split(/\s+/).filter(Boolean).length : 0;
    setSummaryWords(Math.max(0, currentWords - sessionStartWords.current));
    setSummaryElapsedMs(elapsed);
    setShowSummary(true);
    ctx.exit();
  }

  exitQuietRef.current = exitQuiet;

  useEffect(() => {
    if (!isQuiet) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') exitQuietRef.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isQuiet]);

  // Cmd/Ctrl+S: flush autosave immediately (all modes)
  useEffect(() => {
    function onSaveShortcut(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 's') return;
      e.preventDefault();
      const ed = editorRef.current;
      if (!ed) return;
      clearTimeout(saveTimer.current);
      const html  = ed.getHTML();
      const idx   = activeChapterRef.current;
      try { localStorage.setItem(chDocKey(msId, idx), html); } catch {}
      const dbNum = chapterNumbersRef.current[idx] ?? idx;
      void api.put(`/api/manuscripts/${manuscriptId}/chapters/${dbNum}`, {
        title:   chaptersRef.current[idx]?.title ?? `Chapter ${idx + 1}`,
        content: html,
      }).catch(() => {});
      setSaveState('saved');
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveState('idle'), 2000);
    }
    document.addEventListener('keydown', onSaveShortcut);
    return () => document.removeEventListener('keydown', onSaveShortcut);
  // manuscriptId is stable for the lifetime of this component instance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chapter switching ─────────────────────────────────────────────
  function switchChapter(idx: number) {
    if (!editor || idx === activeChapter) return;
    // Persist current chapter before leaving
    const html    = editor.getHTML();
    const curIdx  = activeChapter;
    try { localStorage.setItem(chDocKey(msId, curIdx), html); } catch {}
    const dbNum = chapterNumbersRef.current[curIdx] ?? curIdx;
    void api.put(`/api/manuscripts/${manuscriptId}/chapters/${dbNum}`, {
      title:   chapters[curIdx]?.title ?? `Chapter ${curIdx + 1}`,
      content: html,
    }).catch(() => {});
    // Load saved (or initial) content for new chapter
    const newHtml = loadChapterContent(msId, idx, chapters[idx]?.html ?? '');
    editor.commands.setContent(newHtml);
    setActiveChapter(idx);
    setFocusedCommentId(null);
    try {
      setHasSnap(!!localStorage.getItem(chSnapKey(msId, idx)));
    } catch {
      setHasSnap(false);
    }
  }

  function saveVersion() {
    api.post(`/api/manuscripts/${manuscriptId}/versions`)
      .then(() => api.get<VersionMeta[]>(`/api/manuscripts/${manuscriptId}/versions`))
      .then(vs => {
        setVersions(vs);
        if (vs.length > 0) setSelectedVersionId(vs[0].id);
      })
      .catch(err => console.error('[saveVersion]', err));
  }

  async function handleRestore() {
    if (!selectedVersionId) return;
    setRestoring(true);
    try {
      await api.post(`/api/manuscripts/${manuscriptId}/versions/${selectedVersionId}/restore`);
      type ApiChapter = { number: number; title: string; content: string | null };
      const apiChapters = await api.get<ApiChapter[]>(`/api/manuscripts/${manuscriptId}/chapters`);
      apiChapters.forEach((ac, pos) => {
        if (ac.content) {
          try { localStorage.setItem(chDocKey(msId, pos), ac.content); } catch {}
          if (pos === activeChapterRef.current) {
            editor?.commands.setContent(ac.content);
          }
        }
      });
      setConfirmRestore(false);
      setMode('write');
    } catch (err) {
      console.error('[restore]', err);
    } finally {
      setRestoring(false);
    }
  }

  // ── Chapter management ───────────────────────────────────────────
  function addChapter() {
    const newIdx = chaptersRef.current.length;
    const newNum = newIdx + 1;
    const newTitle = `Chapter ${newNum}`;
    // Persist current chapter first
    if (editor) {
      const html   = editor.getHTML();
      const curIdx = activeChapterRef.current;
      try { localStorage.setItem(chDocKey(msId, curIdx), html); } catch {}
      const dbNum = chapterNumbersRef.current[curIdx] ?? curIdx;
      void api.put(`/api/manuscripts/${manuscriptId}/chapters/${dbNum}`, {
        title:   chaptersRef.current[curIdx]?.title ?? `Chapter ${curIdx + 1}`,
        content: html,
      }).catch(() => {});
    }
    chapterNumbersRef.current[newIdx] = newNum;
    setChapters(prev => [...prev, { title: newTitle, html: '' }]);
    setActiveChapter(newIdx);
    setHasSnap(false);
    editor?.commands.setContent('<p></p>');
    void api.put(`/api/manuscripts/${manuscriptId}/chapters/${newNum}`, {
      title:   newTitle,
      content: '<p></p>',
    }).catch(err => console.error('[addChapter]', err));
  }

  function deleteChapter(idx: number) {
    const chs    = chaptersRef.current;
    const chNum  = chapterNumbersRef.current[idx] ?? idx;
    // Re-index localStorage: shift keys above idx down by 1
    for (let i = idx + 1; i < chs.length; i++) {
      const oldDoc  = (() => { try { return localStorage.getItem(chDocKey(msId, i)); } catch { return null; } })();
      const oldSnap = (() => { try { return localStorage.getItem(chSnapKey(msId, i)); } catch { return null; } })();
      if (oldDoc  !== null) { try { localStorage.setItem(chDocKey(msId, i - 1), oldDoc); } catch {} }
      if (oldSnap !== null) { try { localStorage.setItem(chSnapKey(msId, i - 1), oldSnap); } catch {} }
    }
    try { localStorage.removeItem(chDocKey(msId, chs.length - 1)); } catch {}
    try { localStorage.removeItem(chSnapKey(msId, chs.length - 1)); } catch {}
    // Rebuild chapterNumbersRef
    const newRef: Record<number, number> = {};
    for (let i = 0; i < chs.length; i++) {
      if (i < idx)       newRef[i]     = chapterNumbersRef.current[i];
      else if (i > idx)  newRef[i - 1] = chapterNumbersRef.current[i];
    }
    chapterNumbersRef.current = newRef;
    const newChapters = chs.filter((_, i) => i !== idx);
    const newActive   = idx >= newChapters.length ? Math.max(0, newChapters.length - 1) : idx;
    setChapters(newChapters);
    setActiveChapter(newActive);
    const newHtml = loadChapterContent(msId, newActive, newChapters[newActive]?.html ?? '');
    editor?.commands.setContent(newHtml);
    void api.del(`/api/manuscripts/${manuscriptId}/chapters/${chNum}`)
      .catch(err => console.error('[deleteChapter]', err));
    setDeleteConfirmIdx(null);
  }

  function renameChapter(idx: number, title: string) {
    setChapters(prev => prev.map((ch, i) => i === idx ? { ...ch, title } : ch));
    const dbNum  = chapterNumbersRef.current[idx] ?? idx;
    const content = idx === activeChapterRef.current
      ? (editor?.getHTML() ?? chaptersRef.current[idx]?.html ?? '')
      : loadChapterContent(msId, idx, chaptersRef.current[idx]?.html ?? '');
    void api.put(`/api/manuscripts/${manuscriptId}/chapters/${dbNum}`, { title, content })
      .catch(() => {});
  }

  const wordCount   = editor ? editor.getText().split(/\s+/).filter(Boolean).length : 0;
  const msMeta      = MANUSCRIPT_META[msId];
  const currentHtml = editor?.getHTML() ?? '';
  const snapHtml    = loadChapterSnapshot(msId, activeChapter, chapters[activeChapter]?.html ?? '');
  const snapLabel   = hasSnap ? 'Saved version' : `${msMeta?.draft ?? 'Draft'} · original`;

  // ── Shared toolbar ────────────────────────────────────────────────
  const toolbar = (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>

        {/* Hamburger — mobile only, opens chapter drawer */}
        <button
          className={styles.drawerToggle}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open chapters"
        >≡</button>

        {/* Mobile-only group trigger buttons (Phase 5) */}
        <button
          className={styles.mobileGroupBtn}
          data-active={mobileGroup === 'format' ? '' : undefined}
          onClick={() => setMobileGroup(g => g === 'format' ? null : 'format')}
        >Format {mobileGroup === 'format' ? '▴' : '▾'}</button>
        <button
          className={styles.mobileGroupBtn}
          data-active={mobileGroup === 'view' ? '' : undefined}
          onClick={() => setMobileGroup(g => g === 'view' ? null : 'view')}
        >View {mobileGroup === 'view' ? '▴' : '▾'}</button>

        <div className={styles.toolGroup}>
          <button className={styles.toolBtn}
            data-active={editor?.isActive('bold') ? '' : undefined}
            disabled={mode === 'feedback'}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          ><strong>B</strong></button>
          <button className={styles.toolBtn}
            data-active={editor?.isActive('italic') ? '' : undefined}
            disabled={mode === 'feedback'}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          ><em>I</em></button>
        </div>

        <div className={styles.toolDiv} />

        <div className={styles.toolGroup}>
          <button className={styles.toolBtn}
            data-active={editor?.isActive('paragraph') ? '' : undefined}
            disabled={mode === 'feedback'}
            onClick={() => editor?.chain().focus().setParagraph().run()}
          >¶</button>
          {([1, 2, 3] as const).map(level => (
            <button key={level} className={styles.toolBtn}
              data-active={editor?.isActive('heading', { level }) ? '' : undefined}
              disabled={mode === 'feedback'}
              onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
            >H{level}</button>
          ))}
        </div>

        <div className={styles.toolDiv} />

        <div className={styles.toolGroup}>
          <button className={styles.toolBtn}
            disabled={mode === 'feedback' || !editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >↩</button>
          <button className={styles.toolBtn}
            disabled={mode === 'feedback' || !editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >↪</button>
        </div>

        <div className={styles.toolDiv} />

        <div className={styles.toolGroup}>
          <button className={styles.toolBtn}
            data-active={mode === 'feedback' ? '' : undefined}
            onClick={() => setMode(m => m === 'feedback' ? 'write' : 'feedback')}
          >Feedback</button>
          <button className={styles.toolBtn}
            data-active={mode === 'compare' ? '' : undefined}
            onClick={() => setMode(m => m === 'compare' ? 'write' : 'compare')}
          >Compare</button>
          <button className={styles.toolBtn}
            data-active={mode === 'community' ? '' : undefined}
            onClick={() => setMode(m => m === 'community' ? 'write' : 'community')}
          >Circle</button>
          <button className={styles.toolBtn}
            data-active={mode === 'annotate' ? '' : undefined}
            onClick={() => setMode(m => m === 'annotate' ? 'write' : 'annotate')}
          >Annotate</button>
          <button className={styles.toolBtn}
            data-active={mode === 'notes' ? '' : undefined}
            onClick={() => setMode(m => m === 'notes' ? 'write' : 'notes')}
          >Notes</button>
        </div>

      </div>

      <div className={styles.toolbarRight}>
        {mode === 'write' && (
          <button className={styles.quietToggleBtn} onClick={enterQuiet}>
            Quiet
          </button>
        )}
        {mode === 'write' && (
          <button className={styles.saveVersionBtn} onClick={saveVersion}>
            Save version
          </button>
        )}
        {saveState !== 'idle' && (
          <span className={styles.saveLabel} data-state={saveState}>
            {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved'}
          </span>
        )}
        <span className={styles.wordCount}>{wordCount.toLocaleString()} words</span>
      </div>
    </div>
  );

  // ── Mobile group panel (shown below toolbar on small screens) ────────
  const mobilePanel = mobileGroup !== null ? (
    <div className={styles.mobileGroupPanel}>
      {mobileGroup === 'format' && (
        <>
          <button className={styles.toolBtn} data-active={editor?.isActive('bold') ? '' : undefined} disabled={mode === 'feedback'} onClick={() => editor?.chain().focus().toggleBold().run()}><strong>B</strong></button>
          <button className={styles.toolBtn} data-active={editor?.isActive('italic') ? '' : undefined} disabled={mode === 'feedback'} onClick={() => editor?.chain().focus().toggleItalic().run()}><em>I</em></button>
          <div className={styles.mobileGroupDivider} />
          <button className={styles.toolBtn} data-active={editor?.isActive('paragraph') ? '' : undefined} disabled={mode === 'feedback'} onClick={() => editor?.chain().focus().setParagraph().run()}>¶</button>
          {([1, 2, 3] as const).map(level => (
            <button key={level} className={styles.toolBtn} data-active={editor?.isActive('heading', { level }) ? '' : undefined} disabled={mode === 'feedback'} onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}>H{level}</button>
          ))}
          <div className={styles.mobileGroupDivider} />
          <button className={styles.toolBtn} disabled={mode === 'feedback' || !editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>↩</button>
          <button className={styles.toolBtn} disabled={mode === 'feedback' || !editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>↪</button>
        </>
      )}
      {mobileGroup === 'view' && (
        <>
          {(['feedback', 'compare', 'community', 'annotate', 'notes'] as const).map(m => (
            <button
              key={m}
              className={styles.toolBtn}
              data-active={mode === m ? '' : undefined}
              onClick={() => { setMode(prev => prev === m ? 'write' : m); setMobileGroup(null); }}
            >
              {m === 'community' ? 'Circle' : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </>
      )}
    </div>
  ) : null;

  // ── Session summary ────────────────────────────────────────────────
  if (showSummary) {
    return (
      <div className={styles.wrapFull}>
        <div className={styles.summaryScreen}>
          <div className={styles.summaryWords}>{summaryWords.toLocaleString()}</div>
          <div className={styles.summaryWordsLabel}>words written</div>
          <div className={styles.summaryTime}>{formatElapsedSummary(summaryElapsedMs)}</div>
          <button className={styles.summaryReturnBtn} onClick={() => setShowSummary(false)}>
            Return
          </button>
        </div>
      </div>
    );
  }

  // ── Quiet mode ─────────────────────────────────────────────────────
  if (isQuiet) {
    const sessionWordsNow = Math.max(0, wordCount - sessionStartWords.current);
    return (
      <div className={styles.wrapFull}>
        <div className={styles.quietBar}>
          <div className={styles.quietControls}>
            <button
              className={styles.quietToolBtn}
              aria-label="Undo"
              disabled={!editor?.can().undo()}
              onClick={() => editor?.chain().focus().undo().run()}
            >↩</button>
            <button
              className={styles.quietToolBtn}
              aria-label="Redo"
              disabled={!editor?.can().redo()}
              onClick={() => editor?.chain().focus().redo().run()}
            >↪</button>
            <div className={styles.quietToolDiv} />
            <span className={styles.quietStats}>
              {wordCount.toLocaleString()} words
              {' · '}
              <span className={styles.quietSession}>+{sessionWordsNow.toLocaleString()} this session</span>
              {' · '}
              {formatElapsed(elapsedMs)}
            </span>
          </div>
          <div className={styles.quietRight}>
            {saveState !== 'idle' && (
              <span
                className={styles.quietSaveLabel}
                data-state={saveState}
                aria-live="polite"
              >
                {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved'}
              </span>
            )}
            <button className={styles.quietEndBtn} onClick={exitQuiet}>
              End session
            </button>
          </div>
        </div>
        <div className={styles.scrollArea}>
          <div className={styles.page}>
            <EditorContent editor={editor} className={styles.editorContent} />
          </div>
        </div>
      </div>
    );
  }

  // ── Compare mode ──────────────────────────────────────────────────
  if (mode === 'compare') {
    const activeDbNum        = chapterNumbersRef.current[activeChapter] ?? activeChapter;
    const versionChapterHtml = selectedVersionDetail?.chapters.find(
      c => c.chapterNum === activeDbNum,
    )?.content ?? null;
    const selectedMeta    = versions.find(v => v.id === selectedVersionId);
    const compareLhsHtml  = versionChapterHtml ?? snapHtml;
    const compareLhsLabel = selectedMeta?.label ?? snapLabel;
    const compareLhsMeta  = selectedMeta
      ? new Date(selectedMeta.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : (msMeta?.date ?? '');

    return (
      <div className={styles.wrap}>
        <ChapterSidebar
          chapters={chapters}
          activeIndex={activeChapter}
          onSwitch={switchChapter}
          onAdd={addChapter}
          onDelete={idx => setDeleteConfirmIdx(idx)}
          onRename={renameChapter}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
        <div className={styles.editorPane}>
          {toolbar}
          {mobilePanel}
          <div className={styles.compareLayout}>
            <VersionList
              versions={versions}
              selectedId={selectedVersionId}
              onSelect={setSelectedVersionId}
              onRestore={() => setConfirmRestore(true)}
            />
            <ComparePane
              html={compareLhsHtml}
              otherHtml={currentHtml}
              label={compareLhsLabel}
              meta={compareLhsMeta}
              side="old"
            />
            <div className={styles.comparePane}>
              <div className={styles.comparePaneHead}>
                <span className={styles.comparePaneLabel}>Current draft</span>
                <span className={styles.comparePaneMeta}>Working</span>
              </div>
              <div className={styles.compareScroll}>
                <div className={styles.comparePage}>
                  <EditorContent editor={editor} className={styles.editorContent} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {confirmRestore && selectedVersionDetail && (
          <RestoreModal
            versionLabel={selectedVersionDetail.label}
            isRestoring={restoring}
            onConfirm={handleRestore}
            onCancel={() => setConfirmRestore(false)}
          />
        )}
        {deleteConfirmIdx !== null && (
          <div className={styles.deleteModalOverlay}>
            <div className={styles.deleteModal}>
              <p className={styles.deleteModalEyebrow}>Confirm delete</p>
              <h2 className={styles.deleteModalTitle}>Delete "{chapters[deleteConfirmIdx]?.title}"?</h2>
              <p className={styles.deleteModalBody}>
                This chapter and all its content will be permanently removed. This cannot be undone.
              </p>
              <div className={styles.deleteModalActions}>
                <button className={styles.deleteModalCancel} onClick={() => setDeleteConfirmIdx(null)}>
                  Cancel
                </button>
                <button className={styles.deleteModalConfirm} onClick={() => deleteChapter(deleteConfirmIdx)}>
                  Delete chapter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Write / Feedback / Annotate interaction ──────────────────────
  function handleMouseUp() {
    if (mode !== 'annotate') return;
    const text = window.getSelection()?.toString().trim() ?? '';
    if (text) setSelectedText(text);
  }

  function handleScrollAreaClick(e: React.MouseEvent) {
    if (mode !== 'feedback') return;
    const target = e.target as HTMLElement;
    const mark = target.closest('mark.readerHighlight') as HTMLElement | null;
    if (mark) {
      const id = mark.dataset.commentId ?? null;
      setFocusedCommentId(prev => prev === id ? null : id);
    } else {
      setFocusedCommentId(null);
    }
  }

  return (
    <div className={styles.wrap} data-mode={mode}>
      <ChapterSidebar
        chapters={chapters}
        activeIndex={activeChapter}
        onSwitch={switchChapter}
        onAdd={addChapter}
        onDelete={idx => setDeleteConfirmIdx(idx)}
        onRename={renameChapter}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div className={styles.editorPane}>
        {toolbar}
        {mobilePanel}
        <div className={
          (mode === 'feedback' || mode === 'community' || mode === 'annotate' || mode === 'notes')
            ? styles.feedbackLayout
            : undefined
        }>
          <div className={styles.scrollArea} onMouseUp={handleMouseUp} onClick={handleScrollAreaClick}>
            <div className={styles.page}>
              <EditorContent editor={editor} className={styles.editorContent} />
            </div>
          </div>
          {mode === 'feedback'  && (
            <FeedbackPanel
              manuscriptId={manuscriptId}
              chapterHtml={chapters[activeChapter]?.html ?? ''}
              readerAnnotations={readerAnnotations}
              readerImpressions={readerImpressions}
              totalChapters={chapters.length}
              focusedCommentId={focusedCommentId}
              onClearFocus={() => setFocusedCommentId(null)}
            />
          )}
          {mode === 'community' && <CommunityPanel />}
          {mode === 'annotate'  && (
            <AnnotationPanel
              selectedText={selectedText}
              onClearSelection={() => setSelectedText('')}
            />
          )}
          {mode === 'notes' && (
            <ChapterNotesPanel
              key={activeChapter}
              manuscriptId={manuscriptId}
              chapterIndex={activeChapter + 1}
              chapterTitle={chapters[activeChapter]?.title ?? ''}
            />
          )}
        </div>
      </div>
      {deleteConfirmIdx !== null && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModal}>
            <p className={styles.deleteModalEyebrow}>Confirm delete</p>
            <h2 className={styles.deleteModalTitle}>Delete "{chapters[deleteConfirmIdx]?.title}"?</h2>
            <p className={styles.deleteModalBody}>
              This chapter and all its content will be permanently removed. This cannot be undone.
            </p>
            <div className={styles.deleteModalActions}>
              <button className={styles.deleteModalCancel} onClick={() => setDeleteConfirmIdx(null)}>
                Cancel
              </button>
              <button className={styles.deleteModalConfirm} onClick={() => deleteChapter(deleteConfirmIdx)}>
                Delete chapter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
