# Implementation Plan — Manuscripts Landing Redesign

This doc breaks the work into ordered tasks with acceptance criteria. Use it
as your checklist when implementing in Claude Code.

## Ordering rationale

Build from the bottom up: tokens first, then primitive components, then
composed components, then the page. This keeps each step verifiable in
isolation and makes the final integration trivial.

---

## Task 1 — Add design tokens

**Files**:
- `src/styles/tokens.css` (or wherever global tokens live)
- Or extend `tailwind.config.js` with the same values

**What to do**: Add all `--bk-*` CSS custom properties from
`02-component-spec.md` § Design tokens. If the project uses Tailwind, also
extend the theme with corresponding utility names.

**Acceptance criteria**:
- Tokens are accessible globally via CSS variables.
- No existing tokens are renamed or removed.
- Light/dark mode considerations: tokens are currently light-mode only.
  Add a TODO comment for dark-mode variants — out of scope for this PR.

---

## Task 2 — Build the `ManuscriptCard` component

**File**: `src/components/manuscripts/ManuscriptCard.tsx`

**Props**: a single `Manuscript` object (see data shape in
`02-component-spec.md`).

**Behavior**:
- Renders the two-half card structure (cover + metadata).
- Whole card is a clickable link to `/manuscripts/:id`.
- Soft invitation links inside the card use `event.stopPropagation()` and
  navigate to `/manuscripts/:id?focus=<fieldName>`.
- Blurb area uses `-webkit-line-clamp: 2` for truncation. Include the
  fallback approach for non-WebKit browsers (it's mostly universal now,
  but verify with the team's browser support matrix).
- Meta row uses `white-space: nowrap; overflow: hidden; text-overflow:
  ellipsis` for single-line truncation.
- Hover: card lifts via `transform: translateY(-2px)` over 150ms.

**Acceptance criteria**:
- Renders correctly with a fully-populated manuscript (all fields present).
- Renders correctly with a minimally-populated manuscript (only title and
  status).
- Soft invitations appear for missing subtitle, genre, blurb, ISBNs,
  keywords, and target audience.
- Clicking the card navigates to the detail page.
- Clicking a soft invitation link does NOT bubble to the card click.
- Card is keyboard-accessible (Tab focuses, Enter activates).
- Status pill shows correct value (DRAFTING / IN REVISION / PUBLISHED).
- Visibility pill shows correct value (PRIVATE / PUBLIC).
- Blurb truncates to exactly 2 lines with ellipsis when content overflows.
- Meta row truncates to 1 line with ellipsis when content overflows.

---

## Task 3 — Build the `NewManuscriptTile` component

**File**: `src/components/manuscripts/NewManuscriptTile.tsx`

**Behavior**: Same dimensions as a `ManuscriptCard`. Dashed border,
centered `+` glyph and `NEW MANUSCRIPT` label. Clicking navigates to the
new manuscript flow.

**Acceptance criteria**:
- Visually matches the spec (dashed border, centered content).
- Same height as adjacent cards (use `min-height` or grid-auto-rows).
- Keyboard accessible.
- Hover state: subtle background tint or border darken.

---

## Task 4 — Build the `ControlsBar` component

**File**: `src/components/manuscripts/ControlsBar.tsx`

**Props**:
- `manuscripts: Manuscript[]` (for computing filter counts)
- `state: PageState`
- `onStateChange: (next: PageState) => void`

**Behavior**:
- Filter chips show counts based on the **unfiltered** manuscript array.
- Active filter chip uses inverse color treatment.
- Sort dropdown is a native `<select>` (style with the existing tokens).
- Search input is a native `<input type="text">` with placeholder
  `SEARCH TITLES`.
- All controls are controlled components — state lives in the parent.

**Acceptance criteria**:
- Filter chip counts update when manuscripts change.
- Clicking a chip updates state.
- Changing sort dropdown updates state.
- Typing in search updates state immediately (debounce optional, not
  required for v1).
- Bar wraps gracefully at narrow widths.

---

## Task 5 — Build the `ManuscriptGrid` component

**File**: `src/components/manuscripts/ManuscriptGrid.tsx`

**Props**:
- `manuscripts: Manuscript[]` (already filtered and sorted)

**Behavior**:
- 2-column grid on desktop, 1-column on mobile.
- Renders a `ManuscriptCard` for each manuscript.
- Renders a single `NewManuscriptTile` at the end of the grid.
- Empty state: if `manuscripts.length === 0` AND no search query, show the
  empty shelf state. If 0 results from search, show the "no matches"
  message instead.

**Acceptance criteria**:
- Grid maintains alignment with mixed card heights.
- New manuscript tile is always last.
- Empty states render correctly.

---

## Task 6 — Build the `ManuscriptsPage` (or update existing route)

**File**: `src/pages/Manuscripts.tsx` (or your route equivalent)

**Behavior**:
- Fetches the manuscripts list (use existing data layer — do not invent a
  new fetcher).
- Holds `PageState` for filter / sort / search.
- Pipes manuscripts through filter → search → sort → render.
- Composes `PageHeader` + `ControlsBar` + `ManuscriptGrid`.
- Removes any existing top-of-page "+ New manuscript" CTA (it lives in the
  global site header only).

**Acceptance criteria**:
- Page renders with real data from the manuscripts API.
- Filter chip counts are accurate.
- Filtering by status works.
- Search filters by title (case-insensitive substring match).
- Sort by recently_edited / alphabetical / by_status all work.
- No pricing data is rendered or referenced anywhere.
- Page is responsive (test at 1440px, 1024px, 768px, 375px widths).

---

## Task 7 — Verify pricing removal

**Why this is a separate task**: pricing is moving to a different surface,
not just hidden. Make sure no pricing references remain.

**What to check**:
- No `price`, `priceEbook`, `pricePaperback`, or similar fields are read
  in any manuscripts-related component.
- The manuscript detail page may still show pricing (out of scope for this
  PR), but the landing page must not.
- Search the codebase for `pricing` and `price` within
  `src/components/manuscripts/` and `src/pages/Manuscripts*` to confirm.

**Acceptance criteria**:
- Grep for `price` in the manuscripts feature directory returns no
  display-related references.

---

## Task 8 — Visual QA pass

**What to check** against the design mockup:
- Card cover spine colors render correctly per manuscript.
- Title and subtitle treatments match (serif italic, correct sizes).
- Pill borders and colors match (rust for status, khaki for visibility).
- Soft invitation color is the muted `#C9B58A`.
- Hover lift on cards is subtle (not janky).
- Filter active state uses inverse colors (dark bg, cream text).
- New manuscript tile has dashed border and is the same height as cards.
- Two-line blurb truncation works at multiple card widths.
- Single-line meta row truncates with ellipsis when content is long.

---

## Task 9 — Accessibility audit

**Run through these manually**:
- Tab through the entire page — every interactive element is reachable.
- Enter/Space activates cards and invitations.
- Screen reader (VoiceOver / NVDA) announces card titles, statuses, and
  invitations meaningfully.
- Focus rings are visible on all interactive elements.
- Color contrast passes WCAG AA on all text/background combinations
  (use a tool like axe DevTools or Lighthouse).

---

## Out of scope for this PR

These are explicitly NOT part of this work:
- List view toggle.
- Pricing on this page (already moved out).
- Required field validation or completeness scores.
- URL state for filter/sort/search.
- Bulk actions or drag-to-reorder.
- Cover image upload (only spine color for now).
- Dark mode variants (add tokens TODO; implement later).
- Manuscript detail page changes (separate work).

## PR description template

When opening the PR, include:

```
### What
Redesigns the Manuscripts landing page so each card mirrors the
manuscript's actual metadata, with soft invitations for missing fields.

### Why
The current cards surface only ISBN/price/blurb as small completeness
checkmarks. Writers can't see at a glance what they've filled in or what
gaps exist. Pricing is also moving to the Shop section.

### Changes
- New ManuscriptCard, NewManuscriptTile, ControlsBar, ManuscriptGrid
  components.
- Manuscripts page composes the above with filter/sort/search.
- Removes pricing references from the landing page.
- Removes redundant top-of-page "+ New manuscript" CTA (site header
  handles it).

### Testing
- [ ] Unit tests for ManuscriptCard render states (full / partial / empty
      manuscript data).
- [ ] Filter chip counts are accurate.
- [ ] Search filters correctly.
- [ ] Sort options all work.
- [ ] Soft invitations stop event propagation (don't trigger card click).
- [ ] Responsive at 1440 / 1024 / 768 / 375.
- [ ] Keyboard accessible.
- [ ] axe DevTools shows no violations.
```
