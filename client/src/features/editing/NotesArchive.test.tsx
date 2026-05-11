import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get:   vi.fn(),
    patch: vi.fn(),
    del:   vi.fn(),
  },
}));

vi.mock('../../lib/api', () => ({ api: mockApi }));

import NotesArchive from './NotesArchive';

const activeNote = {
  id: 'note_1', chapterId: 'ch_1', chapterNum: 1, chapterTitle: 'The Beginning',
  body: 'Active note body', anchor: null, status: 'ACTIVE' as const,
  createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-05-02T10:00:00Z',
};

const archivedNote = {
  id: 'note_2', chapterId: 'ch_2', chapterNum: 2, chapterTitle: 'The Middle',
  body: 'Archived note body', anchor: null, status: 'ARCHIVED' as const,
  createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-15T10:00:00Z',
};

function renderArchive() {
  return render(<NotesArchive manuscriptId="ms_1" />);
}

// ── Loading ───────────────────────────────────────────────────────────────────

describe('NotesArchive — loading', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading text while fetch is in-flight', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderArchive();
    expect(screen.getByText(/loading notes/i)).toBeInTheDocument();
  });
});

// ── Active notes ──────────────────────────────────────────────────────────────

describe('NotesArchive — active notes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the body of an active note', async () => {
    mockApi.get.mockResolvedValue([activeNote]);
    renderArchive();
    await waitFor(() => expect(screen.getByText('Active note body')).toBeInTheDocument());
  });

  it('shows chapter heading for the note', async () => {
    mockApi.get.mockResolvedValue([activeNote]);
    renderArchive();
    await waitFor(() => expect(screen.getByText(/ch\. 1/i)).toBeInTheDocument());
  });

  it('shows Archive action button on an active note', async () => {
    mockApi.get.mockResolvedValue([activeNote]);
    renderArchive();
    await waitFor(() => expect(screen.getByRole('button', { name: /^archive$/i })).toBeInTheDocument());
  });

  it('shows empty-state message when there are no active notes', async () => {
    mockApi.get.mockResolvedValue([]);
    renderArchive();
    await waitFor(() => expect(screen.getByText(/no active notes/i)).toBeInTheDocument());
  });

  it('archives a note when Archive is clicked', async () => {
    mockApi.get.mockResolvedValue([activeNote]);
    mockApi.del.mockResolvedValue({ id: 'note_1', status: 'ARCHIVED' });
    renderArchive();
    await waitFor(() => screen.getByRole('button', { name: /^archive$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^archive$/i }));
    await waitFor(() => expect(mockApi.del).toHaveBeenCalledOnce());
  });
});

// ── Archived section ──────────────────────────────────────────────────────────

describe('NotesArchive — archived section', () => {
  beforeEach(() => vi.clearAllMocks());

  it('archived note body is hidden by default', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    renderArchive();
    await waitFor(() => screen.getByRole('button', { name: /archived/i }));
    expect(screen.queryByText('Archived note body')).not.toBeInTheDocument();
  });

  it('expands to show archived notes when the toggle is clicked', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    renderArchive();
    const toggle = await screen.findByRole('button', { name: /archived/i });
    fireEvent.click(toggle);
    expect(screen.getByText('Archived note body')).toBeInTheDocument();
  });

  it('collapses again on a second toggle click', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    renderArchive();
    const toggle = await screen.findByRole('button', { name: /archived/i });
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(screen.queryByText('Archived note body')).not.toBeInTheDocument();
  });

  it('shows Restore button on an archived note', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    renderArchive();
    fireEvent.click(await screen.findByRole('button', { name: /archived/i }));
    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument();
  });

  it('shows Delete permanently button on an archived note', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    renderArchive();
    fireEvent.click(await screen.findByRole('button', { name: /archived/i }));
    expect(screen.getByRole('button', { name: /delete permanently/i })).toBeInTheDocument();
  });

  it('calls api.patch to restore a note', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    mockApi.patch.mockResolvedValue({ ...archivedNote, status: 'ACTIVE' });
    renderArchive();
    fireEvent.click(await screen.findByRole('button', { name: /archived/i }));
    fireEvent.click(screen.getByRole('button', { name: /restore/i }));
    await waitFor(() => expect(mockApi.patch).toHaveBeenCalledOnce());
  });
});

// ── Permanent delete confirmation ─────────────────────────────────────────────

describe('NotesArchive — permanent delete confirmation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "Are you sure?" prompt before deleting', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    renderArchive();
    fireEvent.click(await screen.findByRole('button', { name: /archived/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('hides the prompt when Cancel is clicked', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    renderArchive();
    fireEvent.click(await screen.findByRole('button', { name: /archived/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it('calls permanent-delete endpoint when "Yes, delete" is confirmed', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    mockApi.del.mockResolvedValue({ deleted: true });
    renderArchive();
    fireEvent.click(await screen.findByRole('button', { name: /archived/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    await waitFor(() => expect(mockApi.del).toHaveBeenCalledOnce());
  });

  it('removes the note from the list after permanent delete', async () => {
    mockApi.get.mockResolvedValue([archivedNote]);
    mockApi.del.mockResolvedValue({ deleted: true });
    renderArchive();
    fireEvent.click(await screen.findByRole('button', { name: /archived/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    await waitFor(() => expect(screen.queryByText('Archived note body')).not.toBeInTheDocument());
  });
});
