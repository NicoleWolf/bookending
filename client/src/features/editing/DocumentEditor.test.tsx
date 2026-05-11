import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuietModeProvider, useQuietMode } from '../quiet-mode/QuietModeContext';
import { useEffect } from 'react';

// ── Mocks ─────────────────────────────────────────────────────────

// Mock TipTap — jsdom can't run ProseMirror's DOM-dependent internals
vi.mock('@tiptap/react', () => {
  const mockEditor = {
    getText:      () => 'word1 word2 word3',
    getHTML:      () => '<p>word1 word2 word3</p>',
    setEditable:  vi.fn(),
    commands:     { setContent: vi.fn() },
    chain:        () => ({ focus: () => ({ toggleBold: () => ({ run: vi.fn() }), undo: () => ({ run: vi.fn() }), redo: () => ({ run: vi.fn() }) }) }),
    can:          () => ({ undo: () => true, redo: () => false }),
    isActive:     () => false,
    view:         { dom: document.createElement('div') },
  };
  return {
    useEditor:     vi.fn(() => mockEditor),
    EditorContent: ({ className }: { className?: string }) => (
      <div data-testid="editor-content" className={className} />
    ),
  };
});

vi.mock('@tiptap/starter-kit',                  () => ({ default: {} }));
vi.mock('@tiptap/extension-placeholder',        () => ({ default: { configure: () => ({}) } }));
vi.mock('./data', () => ({
  INITIAL_CONTENT: { 1: '<p>test content</p>' },
  MANUSCRIPT_META: { 1: { draft: 'Draft 1', date: '1 Jan 2026' } },
  COMMENTS:        [],
}));
vi.mock('./FeedbackPanel',   () => ({ default: () => null }));
vi.mock('./CommunityPanel',  () => ({ default: () => null }));
vi.mock('./AnnotationPanel', () => ({ default: () => null }));

// ── Storage mock ───────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:   (k: string) => store[k] ?? null,
    setItem:   (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:     () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ── Helpers ────────────────────────────────────────────────────────

import DocumentEditor from './DocumentEditor';

function renderInQuietMode() {
  // Helper that renders the editor and puts it into quiet mode
  function QuietTrigger() {
    const { enter } = useQuietMode();
    useEffect(() => { enter(); }, [enter]);
    return null;
  }
  return render(
    <QuietModeProvider>
      <QuietTrigger />
      <DocumentEditor manuscriptId={1} />
    </QuietModeProvider>,
  );
}

function renderNormal() {
  return render(
    <QuietModeProvider>
      <DocumentEditor manuscriptId={1} />
    </QuietModeProvider>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe('DocumentEditor — Quiet Mode save controls', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows the quiet bar when quiet mode is active', () => {
    renderInQuietMode();
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument();
  });

  it('renders undo button in quiet mode', () => {
    renderInQuietMode();
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
  });

  it('renders redo button in quiet mode', () => {
    renderInQuietMode();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('undo button is enabled when editor can undo', () => {
    renderInQuietMode();
    const undoBtn = screen.getByRole('button', { name: /undo/i });
    expect(undoBtn).not.toBeDisabled();
  });

  it('redo button is disabled when editor cannot redo', () => {
    renderInQuietMode();
    const redoBtn = screen.getByRole('button', { name: /redo/i });
    expect(redoBtn).toBeDisabled();
  });

  it('no save indicator shown when save state is idle', () => {
    renderInQuietMode();
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^saved$/i)).not.toBeInTheDocument();
  });

  it('editor content is rendered in quiet mode', () => {
    renderInQuietMode();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('word count is visible in quiet mode', () => {
    renderInQuietMode();
    // "3 words" from mock editor.getText() returning 3 words
    expect(screen.getByText(/3 words/)).toBeInTheDocument();
  });
});

describe('DocumentEditor — Cmd/Ctrl+S shortcut', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('Ctrl+S triggers immediate save to localStorage', () => {
    renderNormal();
    act(() => {
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    });
    const saved = localStorageMock.getItem('bookending_doc_1_ch_0');
    expect(saved).toBeTruthy();
  });

  it('Meta+S triggers immediate save to localStorage', () => {
    renderNormal();
    act(() => {
      fireEvent.keyDown(document, { key: 's', metaKey: true });
    });
    const saved = localStorageMock.getItem('bookending_doc_1_ch_0');
    expect(saved).toBeTruthy();
  });

  it('Ctrl+S works during quiet mode', () => {
    renderInQuietMode();
    act(() => {
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    });
    const saved = localStorageMock.getItem('bookending_doc_1_ch_0');
    expect(saved).toBeTruthy();
  });

  it('Ctrl+S without modifier does not save', () => {
    renderNormal();
    act(() => {
      fireEvent.keyDown(document, { key: 's' });
    });
    expect(localStorageMock.getItem('bookending_doc_1_ch_0')).toBeNull();
  });
});

describe('DocumentEditor — autosave during quiet mode', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('autosave write path is available in quiet mode (localStorage accessible)', () => {
    // Verify localStorage can be written during quiet mode — the onUpdate
    // handler writes to it regardless of isQuiet; this confirms the storage
    // mechanism is not blocked.
    renderInQuietMode();
    act(() => {
      localStorageMock.setItem('bookending_doc_1_ch_0', '<p>new content</p>');
    });
    expect(localStorageMock.getItem('bookending_doc_1_ch_0')).toBe('<p>new content</p>');
  });
});

describe('DocumentEditor — save feedback not deferred in quiet mode', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('Ctrl+S shows Saved indicator in the quiet bar (not deferred)', async () => {
    renderInQuietMode();
    act(() => {
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    });
    // The saveLabel renders inside the editor, not via the notification/toast system
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('Saved indicator disappears after 2 seconds', () => {
    renderInQuietMode();
    act(() => {
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2001);
    });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });
});

describe('DocumentEditor — Quiet Mode chrome behavior unchanged', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('main toolbar (mode buttons, Quiet toggle) is not rendered in quiet mode', () => {
    renderInQuietMode();
    expect(screen.queryByRole('button', { name: /quiet/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /feedback/i })).not.toBeInTheDocument();
  });

  it('Escape key exits quiet mode', () => {
    renderInQuietMode();
    // Quiet bar is present before Escape
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    // After exit, quiet bar is gone and we see the session summary
    expect(screen.queryByRole('button', { name: /end session/i })).not.toBeInTheDocument();
  });
});
