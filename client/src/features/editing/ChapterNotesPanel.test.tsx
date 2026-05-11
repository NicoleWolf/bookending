import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import type { ChapterNote } from '@bookending/shared';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get:   vi.fn(),
    post:  vi.fn(),
    patch: vi.fn(),
    del:   vi.fn(),
  },
}));

vi.mock('../../lib/api', () => ({ api: mockApi }));

import ChapterNotesPanel from './ChapterNotesPanel';

const NOTE: ChapterNote = {
  id:        'note_1',
  chapterId: 'ch_1',
  body:      'This chapter sets up the conflict.',
  anchor:    null,
  status:    'ACTIVE',
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-01T10:00:00Z',
};

function renderPanel(overrides?: Partial<{ manuscriptId: string; chapterIndex: number; chapterTitle: string }>) {
  return render(
    <ChapterNotesPanel
      manuscriptId={overrides?.manuscriptId ?? 'ms_1'}
      chapterIndex={overrides?.chapterIndex ?? 1}
      chapterTitle={overrides?.chapterTitle ?? 'The Beginning'}
    />
  );
}

// ── Loading + empty states ────────────────────────────────────────────────────

describe('ChapterNotesPanel — loading and empty states', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state while fetch is in-flight', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderPanel();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty textarea after fetch returns no note', async () => {
    mockApi.get.mockResolvedValue([]);
    renderPanel();
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('shows "Save note" button when no note exists', async () => {
    mockApi.get.mockResolvedValue([]);
    renderPanel();
    await waitFor(() => expect(screen.getByText('Save note')).toBeInTheDocument());
  });

  it('does not show Archive button when no note exists', async () => {
    mockApi.get.mockResolvedValue([]);
    renderPanel();
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
  });

  it('shows "Save note" button with data-disabled when textarea is empty', async () => {
    mockApi.get.mockResolvedValue([]);
    renderPanel();
    const btn = await screen.findByText('Save note');
    expect(btn).toHaveAttribute('data-disabled', '');
  });
});

// ── Existing note (view card) ─────────────────────────────────────────────────

describe('ChapterNotesPanel — with existing note', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows note body in card view when note exists', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    renderPanel();
    await waitFor(() => expect(screen.getByText(NOTE.body)).toBeInTheDocument());
  });

  it('shows "Edit" button when a note exists', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    renderPanel();
    await waitFor(() => expect(screen.getByText('Edit')).toBeInTheDocument());
  });

  it('shows Archive button when a note exists', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    renderPanel();
    await waitFor(() => expect(screen.getByText('Archive')).toBeInTheDocument());
  });

  it('clicking Edit reveals textarea populated with the note body', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    renderPanel();
    fireEvent.click(await screen.findByText('Edit'));
    expect(screen.getByRole('textbox')).toHaveValue(NOTE.body);
  });

  it('Update button is data-disabled when body is unchanged', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    renderPanel();
    fireEvent.click(await screen.findByText('Edit'));
    const btn = await screen.findByText('Update');
    expect(btn).toHaveAttribute('data-disabled', '');
  });

  it('Update button loses data-disabled after body is changed', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    renderPanel();
    fireEvent.click(await screen.findByText('Edit'));
    await waitFor(() => screen.getByRole('textbox'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated content' } });
    expect(screen.getByText('Update')).not.toHaveAttribute('data-disabled');
  });
});

// ── Save ──────────────────────────────────────────────────────────────────────

describe('ChapterNotesPanel — save behaviour', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.useRealTimers());

  it('calls api.post to create a new note', async () => {
    mockApi.get.mockResolvedValue([]);
    mockApi.post.mockResolvedValue({ ...NOTE, body: 'New note' });
    renderPanel();
    await waitFor(() => screen.getByRole('textbox'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New note' } });
    fireEvent.click(screen.getByText('Save note'));
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledOnce());
  });

  it('calls api.patch to update an existing note', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    mockApi.patch.mockResolvedValue({ ...NOTE, body: 'Updated note' });
    renderPanel();
    fireEvent.click(await screen.findByText('Edit'));
    await waitFor(() => screen.getByRole('textbox'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated note' } });
    fireEvent.click(screen.getByText('Update'));
    await waitFor(() => expect(mockApi.patch).toHaveBeenCalledOnce());
  });

  it('shows "Saved" status after a successful save', async () => {
    mockApi.get.mockResolvedValue([]);
    mockApi.post.mockResolvedValue({ ...NOTE, body: 'New note' });
    renderPanel();
    await waitFor(() => screen.getByRole('textbox'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New note' } });
    fireEvent.click(screen.getByText('Save note'));
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
  });

  it('shows "Error" status when save fails', async () => {
    mockApi.get.mockResolvedValue([]);
    mockApi.post.mockRejectedValue(new Error('Network error'));
    renderPanel();
    await waitFor(() => screen.getByRole('textbox'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New note' } });
    fireEvent.click(screen.getByText('Save note'));
    await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument());
  });

  it('Cmd+Enter triggers save', async () => {
    mockApi.get.mockResolvedValue([]);
    mockApi.post.mockResolvedValue({ ...NOTE, body: 'Quick save' });
    renderPanel();
    const textarea = await screen.findByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Quick save' } });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledOnce());
  });
});

// ── Archive ───────────────────────────────────────────────────────────────────

describe('ChapterNotesPanel — archive', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('calls api.del and clears the textarea on archive', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    mockApi.del.mockResolvedValue({});
    renderPanel();
    await waitFor(() => screen.getByText('Archive'));
    fireEvent.click(screen.getByText('Archive'));
    await waitFor(() => expect(mockApi.del).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
  });

  it('reverts to "Save note" button label after archive', async () => {
    mockApi.get.mockResolvedValue([NOTE]);
    mockApi.del.mockResolvedValue({});
    renderPanel();
    await waitFor(() => screen.getByText('Archive'));
    fireEvent.click(screen.getByText('Archive'));
    await waitFor(() => expect(screen.getByText('Save note')).toBeInTheDocument());
  });
});

// ── Ctrl+Enter ────────────────────────────────────────────────────────────────

describe('ChapterNotesPanel — Ctrl+Enter shortcut', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Ctrl+Enter triggers save when body is dirty', async () => {
    mockApi.get.mockResolvedValue([]);
    mockApi.post.mockResolvedValue({ ...NOTE, body: 'Ctrl save' });
    renderPanel();
    const textarea = await screen.findByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Ctrl save' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledOnce());
  });

  it('Enter without modifier does not trigger save', async () => {
    mockApi.get.mockResolvedValue([]);
    renderPanel();
    const textarea = await screen.findByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Some text' } });
    act(() => { fireEvent.keyDown(textarea, { key: 'Enter' }); });
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});
