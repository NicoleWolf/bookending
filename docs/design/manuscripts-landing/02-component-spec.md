# Component Spec — Tokens, Components, Data Shape

This doc covers the implementation-level details: design tokens, component
breakdown, data shape, and accessibility. Pair this with `01-design-spec.md`.

## Design tokens

These should be added to the global token file (or Tailwind config) if not
already present. Names follow a `bookending-` prefix to avoid collision.

### Colors

```css
/* Page surface */
--bk-color-page-bg: #F1ECDC;            /* warm cream — page background */
--bk-color-card-bg: #E8E0CB;            /* card body background (slightly darker) */
--bk-color-divider: #B8A982;            /* khaki dividers and pill borders */

/* Text */
--bk-color-text-primary: #2A2620;       /* darkest — titles and primary content */
--bk-color-text-secondary: #4A4232;     /* blurb body text */
--bk-color-text-muted: #6B5F47;         /* labels, eyebrow, metadata */
--bk-color-text-invitation: #C9B58A;    /* soft invitations — empty fields */
--bk-color-text-invitation-hover: #8A7B5C;

/* Accent — used for status pills */
--bk-color-accent-rust: #993C1D;
--bk-color-accent-rust-deep: #4A1B0C;

/* Spine colors — Writer-selectable on detail page */
--bk-spine-teal: #0E4F4D;
--bk-spine-teal-tint: #9FE1CB;          /* text on teal spine */
--bk-spine-cream: #D4C9A8;              /* default spine */
--bk-spine-pink: #E8C9C0;
--bk-spine-pink-tint: #993C1D;          /* text on pink spine */
```

### Typography

```css
--bk-font-serif: Georgia, 'Times New Roman', serif;
--bk-font-mono: 'Courier New', ui-monospace, monospace;

/* Sizes */
--bk-text-eyebrow: 11px;          /* monospace, tracked */
--bk-text-h1: 36px;               /* page title — serif */
--bk-text-intro: 15px;            /* italic intro line */
--bk-text-card-title: 22px;       /* serif italic on cover */
--bk-text-card-subtitle: 13px;    /* serif italic */
--bk-text-pill: 10px;             /* monospace, tracked */
--bk-text-blurb: 13px;            /* serif italic */
--bk-text-meta: 11px;             /* monospace, tracked */

/* Letter-spacing for monospace small caps */
--bk-track-tight: 0.05em;
--bk-track-medium: 0.1em;
--bk-track-loose: 0.18em;
```

### Spacing and shape

```css
--bk-radius-card: 2px;            /* slightly squared, editorial feel */
--bk-card-cover-min-h: 200px;
--bk-card-padding-x: 1.25rem;
--bk-card-padding-y: 1rem;
--bk-grid-gap: 1.5rem;
```

## Component tree

```
ManuscriptsPage
├── PageHeader
│   ├── Eyebrow ("§ 07 · MANUSCRIPTS")
│   ├── Title ("Your manuscripts")
│   └── Intro (italic descriptor)
├── ControlsBar
│   ├── FilterChips (All / Drafting / In Revision / Published)
│   ├── SortDropdown (Recently edited / Alphabetical / By status)
│   └── SearchInput (filters by title)
├── ManuscriptGrid
│   ├── ManuscriptCard × N
│   │   ├── CardCover
│   │   │   ├── AuthorByline
│   │   │   ├── CardTitle
│   │   │   └── CardSubtitle (or invitation)
│   │   └── CardMetadata
│   │       ├── PillRow
│   │       │   ├── StatusPill
│   │       │   ├── VisibilityPill
│   │       │   └── GenreLabel (or invitation)
│   │       ├── BlurbArea (clamped 2 lines, or invitation)
│   │       └── MetaRow (data + invitations, single line truncated)
│   └── NewManuscriptTile
```

## Data shape

The page expects an array of Manuscript objects shaped like this:

```typescript
interface Manuscript {
  id: string;
  title: string;
  subtitle?: string;
  author: string;                         // displayed as byline
  genre?: string;
  subGenre?: string;
  series?: { name: string; number: number };
  language: string;
  estimatedPages?: number;
  blurb?: string;
  targetAudience?: string;
  contentRating?: string;
  keywords?: string[];                    // comma-joined for display
  isbnEbook?: string;
  isbnPrint?: string;
  status: 'drafting' | 'in_revision' | 'published';
  visibility: 'private' | 'public';
  spineColor: string;                     // hex value chosen by Writer
  manuscriptFile?: { name: string; size: number };
  createdAt: string;                      // ISO
  updatedAt: string;                      // ISO
}
```

### Derived display fields

The card needs to compute a few things from the raw data:

- **ISBN display**: if both ebook and print exist, show only one (prefer
  print). If neither exists, show `+ ISBNs` invitation.
- **Keywords display**: join keywords with `, `. If empty, show
  `+ Keywords` invitation.
- **Genre + page count**: combine into one pill string like
  `LITERARY FICTION · 340 PP`. If genre missing, show `+ GENRE` invitation;
  page count is optional and only appended when present.
- **Meta row composition**: build an array of segments, each either a real
  data string or an invitation. Join with ` · ` separator. The whole row
  truncates with ellipsis on overflow.

## Click behavior

- **Card body click** → navigate to `/manuscripts/:id` (the detail page).
- **Soft invitation click** → navigate to `/manuscripts/:id?focus=:fieldName`.
  The detail page reads the `focus` query param and scrolls to / focuses
  that field. Invitation handlers must call `event.stopPropagation()` to
  prevent the card's click handler from firing.
- **New manuscript tile click** → navigate to the new manuscript creation
  flow (whatever route is currently used by the header CTA).

## Filter / sort / search state

Local component state, no URL persistence needed for v1.

```typescript
interface PageState {
  activeFilter: 'all' | 'drafting' | 'in_revision' | 'published';
  sortBy: 'recently_edited' | 'alphabetical' | 'by_status';
  searchQuery: string;
}
```

Filtering pipeline: `manuscripts → filter by status → filter by search →
sort → render`. Render counts in filter chips reflect the **unfiltered**
totals for each status (so the Writer always knows the full shape of their
work).

## Accessibility

- Cards are interactive containers. Use `<a href>` or `<button>` semantics
  rather than a `<div>` with onclick. If using `<a>`, ensure the soft
  invitation links are nested correctly (a link inside a link is invalid
  HTML — solution: use `<button>` for the card and `<a>` for invitations,
  or use `<div role="link" tabindex="0">` with keyboard handlers).
- All interactive elements must be keyboard-reachable (Tab) and activatable
  (Enter / Space).
- Focus rings must be visible — do not remove the default outline without
  providing a clear replacement.
- Pill text uses small font sizes (10px) — ensure the contrast ratio meets
  WCAG AA (4.5:1 for normal text, 3:1 for large). The current rust on cream
  passes; verify pill colors against the actual card backgrounds.
- The blurb is purely decorative on the card — the canonical version lives
  on the detail page. Screen readers can read the truncated version; no
  special handling needed.
- Search input needs a visible label or `aria-label="Search manuscripts"`.
- Sort dropdown needs a visible label or `aria-label="Sort manuscripts"`.

## Edge cases

- **0 manuscripts**: hide the grid entirely; show an empty state with a
  large `+ New manuscript` CTA centered on the page and friendly copy
  ("Your shelf is empty. Add your first manuscript to get started.").
- **Very long titles**: title clamps to 2 lines on the cover, ellipsis if
  longer. Confirm with design whether to allow longer titles to push the
  cover taller instead.
- **Very long blurbs**: clamped to 2 lines, ellipsis (already specified).
- **Very long ISBN + keywords combo**: meta row truncates with ellipsis
  on overflow.
- **Manuscript with no spine color set**: fall back to
  `--bk-spine-cream` (the default cream).
- **Search returns 0 matches**: show "No manuscripts match `<query>`" in
  the grid area, with a "Clear search" button.

## Out of scope (do not implement)

- Pricing fields anywhere on this page.
- List view toggle.
- Bulk select / batch actions.
- Drag-to-reorder.
- URL state for filter/sort/search.
- Cover images beyond spine color.
