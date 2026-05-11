# Manuscripts Landing Redesign — Design Spec

## Context

The Manuscripts landing page is the Writer's primary entry point for managing
metadata across all their works. It currently shows a grid of book-cover-style
cards, but those cards are visually inconsistent and surface only three
metadata signals (ISBN, price, blurb) as small completeness checkmarks.

This redesign treats each card as a **mirror** of the manuscript's identity —
showing the Writer what they've already filled in, and offering soft
invitations to fill in what's missing. The editorial bookshelf aesthetic is
preserved. The Writer is the sole user; the page's job is to help them manage
metadata that powers the rest of the Bookending experience.

## Design principles

1. **The card is a mirror.** Whatever the Writer has set up on the manuscript
   detail page should be reflected on the card. Subtitle present? Show it.
   Blurb written? Show a snippet. ISBN assigned? Show it. The card grows
   richer as the manuscript grows richer.

2. **Soft invitations, not alarms.** Empty fields appear as muted "+ Field"
   prompts in a faded khaki tone — discoverable on every card but
   typographically whispered. No "MISSING" warnings, no completeness scores,
   no required-field gating. Filling in metadata is a journey, not a gate.

3. **Whole card is the doorway.** Clicking anywhere on a card opens the
   manuscript detail page. Soft invitation links are exceptions — they use
   `event.stopPropagation()` to deep-link directly to a specific field.

4. **No pricing.** Pricing has moved to the Shop section and is no longer part
   of metadata. Do not surface or reference pricing on this page.

5. **Status and visibility are independent axes.** Drafting / In Revision /
   Published is the lifecycle; Private / Public is the visibility. Both are
   shown on every card.

## Page anatomy

```
────────────────────────────────────────────────────────────────────
  § 07 · MANUSCRIPTS                                                  eyebrow
                                                                     
  Your manuscripts                                                     page title
  Seven works in progress. Each card mirrors what readers and          italic intro
  retailers will see.                                                  
                                                                     
  ─────────────────────────────────────────────────────────────────   
  FILTER  [ALL · 7] [DRAFTING · 4] [IN REVISION · 2] [PUB · 1]        controls bar
                              SORT [Recently edited ▾]  [search]     
  ─────────────────────────────────────────────────────────────────   
                                                                     
  ┌───────────────────────┐  ┌───────────────────────┐                
  │   [book cover]        │  │   [book cover]        │                  card grid
  │                       │  │                       │                  (2 columns)
  │   Title               │  │   Title               │                
  │   Subtitle            │  │   Subtitle            │                
  ├───────────────────────┤  ├───────────────────────┤                
  │ [pills]               │  │ [pills]               │                
  │ "Blurb snippet..."    │  │ "Blurb snippet..."    │                
  │ ISBN · keywords       │  │ + ISBNs  + Keywords   │                
  └───────────────────────┘  └───────────────────────┘                
                                                                     
  ... more cards ...                                                   
                                                                     
  ┌───────────────────────┐                                            
  │         +             │  ← end-of-grid new manuscript tile         
  │   NEW MANUSCRIPT      │     (same size as other cards)             
  └───────────────────────┘                                            
────────────────────────────────────────────────────────────────────
```

Note: The "+ New manuscript" CTA exists in the global site header and is NOT
duplicated at the top of this page. The end-of-grid tile is the only
in-context affordance.

## Card anatomy

Each card has two halves:

### Top half — the book cover (~200px tall)

- **Spine color background.** Comes from the Writer's chosen spine color
  (set on the manuscript detail page). Examples: deep teal `#0E4F4D`, warm
  cream `#D4C9A8`, dusty pink `#E8C9C0`.
- **Author byline** in monospace, top-left: e.g. `BILLIE WOLF`. Color is a
  light tint of the spine (e.g. teal 100 on teal 800).
- **Title** in serif italic, bottom-left, ~22px. Color is a light tint that
  contrasts the spine color.
- **Subtitle** below title, smaller (~13px), serif italic, slightly lower
  contrast. If subtitle is empty, show the soft invitation
  `+ Add a subtitle` in the muted invitation color.

### Bottom half — the metadata reflection (~180px tall)

- **Pill row** (top): up to 3 pills, monospace small caps, ~10px:
  1. Status pill (DRAFTING / IN REVISION / PUBLISHED) with rust-red border
     `#993C1D` and rust-red text.
  2. Visibility pill (PRIVATE / PUBLIC) with neutral khaki border `#B8A982`
     and neutral text `#6B5F47`.
  3. Genre + page count, e.g. `LITERARY FICTION · 340 PP`. No border, just
     muted text. If genre is missing, show `+ GENRE` invitation in muted
     khaki color.

- **Blurb area** (middle): ~13px serif italic.
  - If blurb exists: show it in dark text, **clamped to exactly 2 lines**
    with a CSS `-webkit-line-clamp: 2` and `text-overflow: ellipsis`.
    Always wrap in straight quotes: `"..."`
  - If blurb is empty: show the soft invitation
    `+ Write a back-cover blurb to help readers find this book...` in the
    muted invitation color, on a single line.
  - The blurb area must have a `min-height` to keep cards aligned even when
    blurbs are different lengths.

- **Meta row** (bottom): a single line above a top border. Monospace, ~11px.
  - Show actual data the Writer has entered: full ISBN(s) and the comma-
    separated keywords list, joined with ` · ` (middle dot).
  - Truncate with ellipsis when content exceeds the card width (use
    `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`).
  - For missing fields, show inline soft invitations like `+ ISBNs` or
    `+ Keywords` in the muted invitation color.
  - Mixed state is allowed and expected: e.g.
    `+ ISBNs   lighthouse, coastal, mystery, family`

## Status pill states

| Status      | Border color | Text color  |
|-------------|--------------|-------------|
| DRAFTING    | `#993C1D`    | `#993C1D`   |
| IN REVISION | `#993C1D`    | `#993C1D`   |
| PUBLISHED   | `#993C1D`    | `#993C1D`   |

(All three statuses share the rust-red treatment for now. Future iteration
may differentiate by status — confirm with design before changing.)

## Visibility pill states

| Visibility | Border color | Text color  |
|------------|--------------|-------------|
| PRIVATE    | `#B8A982`    | `#6B5F47`   |
| PUBLIC     | `#B8A982`    | `#6B5F47`   |

## Empty grid tile

The last cell of the grid is always a "new manuscript" affordance:

- Same dimensions as a card (so the grid stays aligned).
- Transparent background with a `0.5px dashed #B8A982` border.
- Centered: `+` glyph (32px, light weight), then `NEW MANUSCRIPT` in
  monospace small caps.
- Click anywhere — opens the new manuscript creation flow.

## Filter and sort behavior

- **Filter chips**: All, Drafting, In Revision, Published. Each shows a
  count. Active chip uses inverse colors (dark bg, cream text). Multi-select
  not required for v1.
- **Sort dropdown**: Recently edited (default), Alphabetical, By status.
- **Search**: filters cards by title match (case-insensitive, substring).
  Live filtering as the Writer types.
- All controls operate client-side — no page navigation, no URL state
  required for v1 (but consider URL params for sort/filter in v1.1).

## Hover and focus states

- Cards lift subtly on hover: `transform: translateY(-2px)` over 150ms.
- Cards have a focus ring when keyboard-navigated (use the host's standard
  focus ring or a 2px rust-red outline).
- Soft invitation links darken on hover (from `#C9B58A` to `#8A7B5C`) and
  underline.

## Responsive behavior

- Desktop (≥900px): 2-column grid.
- Tablet (600–899px): 2-column grid, smaller card cover height.
- Mobile (<600px): 1-column grid, full width cards.
- Filter/sort/search bar wraps gracefully at narrow widths.

## Out of scope for v1

- List view toggle (saved for v1.1).
- Required-field validation or completeness scores.
- Pricing display (now lives in Shop).
- Bulk actions (select multiple, archive, delete).
- Drag-to-reorder.
- Cover image uploads (spine color only for now).
