# Manuscripts — In Revision: Design Brief

See source brief: `c:\Users\Nicole\Desktop\brief.md`

## Status

Phases 1 and 2 implemented. Phases 3–5 pending.

## Implementation log

### Phase 1 — Schema & backend (complete)

**Schema additions (`server/prisma/schema.prisma`):**
- `Manuscript.editorialNote String?` — writer's note to readers during revision
- `Manuscript.revisionPausedAt DateTime?` — timestamp when IN_REVISION was entered
- `Manuscript.revisionChangelog String @default("[]")` — JSON changelog (consumed by Phase 5 UI)
- `BetaReader.devotionQueued Boolean @default(false)` — set true when revision is entered
- `BetaReader.arcReservationEarned Boolean @default(false)` — set true on exit
- `Annotation.revisionTag String?` — Open / Addressed / Themed tagging
- `ReaderChapterNote.revisionTag String?` — same tagging for chapter summary notes

**New API routes (`server/src/routes/manuscripts.ts`):**
- `POST /api/manuscripts/:id/enter-revision` — transitions to IN_REVISION, archives submitted feedback as `archived_in_revision`, queues devotion for all beta readers
- `PATCH /api/manuscripts/:id/editorial-note` — update or clear the author's note
- `POST /api/manuscripts/:id/open-door` — exit IN_REVISION → DRAFTING, apply devotion + ARC reservation
- `GET /api/manuscripts/:id/notes-from-before` — archived reader feedback (annotations + chapter notes) with revision tags
- `PATCH /api/manuscripts/:id/notes-from-before/:noteId` — tag an archived note (Open / Addressed / Themed)

### Phase 2 — Writer view (complete)

**Shared types (`packages/shared/src/index.ts`):**
- `ManuscriptRecordSchema` extended with `editorialNote` and `revisionPausedAt`

**BookMetadata (`client/src/features/library/data.ts`):**
- Added `editorialNote?: string | null` and `revisionPausedAt?: string | null`

**App.tsx `recordToBook`:**
- Maps new API fields through to BookMetadata

**EditingHub (`client/src/features/editing/index.tsx`):**
- `HubView` type extended with `'notes-from-before'`
- `○ IN REVISION · DAY {n}` status row with **Open the door** action
- Editorial note pull-quote rail (3px oxblood left border) — write/edit/placeholder states
- **Notes from before** tab in view toggle (visible when in-revision)
- Enter-revision and open-door API calls wired

**New component (`client/src/features/editing/NotesFromBefore.tsx`):**
- Fetches archived feedback, groups by chapter
- Attribution line, anchor quote (if annotation), body text
- Tagging select: Untagged / Open / Addressed / Themed

**ChapterSidebar (`client/src/features/editing/ChapterSidebar.tsx`):**
- `inRevision` and `unreleasedChapters` props added
- "Behind the door" section rendered when in-revision with unreleased chapters

**CSS additions (`client/src/features/editing/Editing.module.css`, `ChapterSidebar.module.css`):**
- In-revision status row styles
- Editorial note pull-quote rail (oxblood border, italic serif)
- Notes from before list styles

## Phases 3–5 (pending)

- **Phase 3** — Reader-facing `InRevisionReaderView` component (status row, author's note, chapter strip, "Your slot is held" closer)
- **Phase 4** — Annotation graduation logic (anchor deleted → chapter-level note, struck-through original text)
- **Phase 5** — Devotion reputation display, ARC reservation badge, `RevisionChangelogView` component
