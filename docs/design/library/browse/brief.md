# Library — Browse by genre

Implementation brief for the Browse-by-genre view of the Bookending Library.

This brief is self-contained. The accompanying brief `library-discover.md` covers the sibling Discover view; the two share the card system, design tokens, and the post-Request flow.

---

## What this view is

Browse-by-genre is the working catalog view of the Library. Where Discover proposes manuscripts to the reader through editorial curation, Browse-by-genre lets the reader filter and sort the catalog directly. It is operational, not editorial.

The reader's job on this page: **narrow the catalog to manuscripts they can actually commit to.** Filters do real work here. Personalization signals stay quiet — they help break ties between three candidates, they don't reorder the page.

---

## Design system fundamentals

### Color tokens

| Token | Value | Use |
|---|---|---|
| `--bk-bg` | `#F5EEDC` | Page background (cream paper) |
| `--bk-text` | `#2A2520` | Primary text |
| `--bk-text-body` | `#4A3F2E` | Body / secondary text |
| `--bk-text-meta` | `#6B5F47` | Eyebrows, meta, helper text |
| `--bk-rule` | `#B8AB8C` | Primary dividers and borders |
| `--bk-rule-soft` | `#D4C9AB` | Soft dividers within cards |
| `--bk-accent` | `#8A1F15` | Brick red — CTAs, active states, accent |
| `--bk-tint` | `#E8D9C4` | Filled chip / band backgrounds |
| `--bk-rail-bg` | `rgba(232, 217, 196, 0.18)` | Left rail background |
| `--bk-status-open` | `#5C7A2E` | Slot status: open (green) |
| `--bk-status-filling` | `#9A521A` | Slot status: filling (darkened orange — passes WCAG AA at 11px) |
| `--bk-status-full` | `#6B5F47` | Slot status: full (gray) |

**Do not use** `#8A8267` for any text carrying meaning — it fails WCAG AA at functional sizes. Use `#6B5F47` instead.

### Typography

- **Serif:** Newsreader (Google Fonts). Italic for titles and editorial voice. Roman for body. Must ship as true italic glyphs — no synthesized italic.
- **Mono:** any clean monospaced font (JetBrains Mono, ui-monospace stack). Caps with letter-spacing for eyebrows, meta, filter labels, sort options.
- **Italic title floor: 18px.** Below that, switch to roman.
- **Functional eyebrow floor: 11px** (status, mechanism, sort, byline meta).
- **Decorative eyebrow floor: 10px.**
- **Nothing below 10px ships.**

### Iconography

- Mechanism icons are placeholders. Open circle for "Open application," downward chevron for "By invitation." All mechanism icons get `aria-hidden="true"`; the text label carries semantics.
- Status states use ornament + word + color:
  - **Open:** `◦` + word "Open" + green
  - **Filling:** `◎` + word "Filling" + darkened orange
  - **Full:** `●` + word "Full" + gray

---

## Page composition

```
┌─────────────────────────────────────────────────┐
│ Masthead — same as Discover                     │
│ + nav (Browse by genre is active)              │
├─────────────────────────────────────────────────┤
│ Meta band — Vol./Issue/counts                   │
├──────────────┬──────────────────────────────────┤
│              │ Results header card              │
│ Left rail    │ ├─ Title + counts + sort         │
│ ├ Genre      │ ├─ Active filter chips           │
│ │ All        │ └─ Hidden manuscripts handle     │
│ │ Lit Fic    │                                  │
│ │ Mystery    │                                  │
│ │ ...        │ ┌──────┐ ┌──────┐ ┌──────┐      │
│ ├ Filters    │ │ Card │ │ Card │ │ Card │ ...  │
│ │ Status     │ └──────┘ └──────┘ └──────┘      │
│ │ Mechanism  │                                  │
│ │ Length     │ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │ Notes ▸    │ │ Card │ │ Card │ │ Card │ ...  │
│ │ □ Avail    │ └──────┘ └──────┘ └──────┘      │
│              │                                  │
│              │ Load all → (pagination handle)   │
└──────────────┴──────────────────────────────────┘
```

### Masthead and meta band

Identical to Discover. The nav active item is `Browse by genre` (brick-red 1.5px underline + `aria-current="page"`).

### Left rail (260px fixed)

Two sections: **Genre** and **Filters**.

#### Genre section

```
GENRE
─────
· All manuscripts          16
  Literary Fiction          5
  Mystery & Thriller        3
  Speculative Fiction       4
  Creative Nonfiction       3
  Poetry & Hybrid           1
```

- Section label: mono caps, 10px, `--bk-text-meta`, 0.5px `--bk-rule` bottom border below the label.
- Items: Newsreader roman, 14px, `--bk-text-body`. Active item gets `--bk-text` color, weight 500, and a brick-red `·` bullet positioned 14px to the left.
- Right-aligned counts in mono caps, 10px, weight 500.
- Items are buttons; clicking changes the genre filter.

#### Filters section

Four filter groups, in order:

**1. Status** — chip group, multi-select.
- Chips: `Open`, `Filling`, `Full`.
- Default: `Open` active.
- Chip pattern: 10px mono caps, 5px×10px padding, 0.5px `--bk-rule` border. Active: `--bk-text` background, cream text, `aria-pressed="true"`.

**2. Mechanism** — chip group, multi-select.
- Chips: `Open application`, `By invitation`.
- Default: none selected.

**3. Length** — chip group, single-select.
- Chips: `Short`, `Medium`, `Long`.
- Helper line below: `< 60K · 60–90K · 90K+` in mono caps 10px, `--bk-text-meta`.

**4. Content notes — avoid** — **collapsed by default.**

This is a special filter group. When collapsed:

```
┌─ ⚠ Content notes — avoid    2 selected  ▸ ┐
└──────────────────────────────────────────┘
Helper line: italic, "Manuscripts with these
notes are hidden from your results. Manage list →"
```

- Collapsed button is full-width, 12px×14px padding, 0.5px `--bk-rule` border, transparent background. Hover: border becomes `--bk-accent`.
- Inside the button: warning glyph + "Content notes — avoid" label on the left; count + chevron on the right.
- Count in `--bk-accent`, weight 500 when non-zero. Neutral `--bk-text-meta` when zero ("0 selected").
- Chevron `▸` collapsed, `▾` expanded.
- Button uses `aria-expanded` and `aria-controls` semantics.
- Expanded state: chip group with ~18 categories (see vocabulary below), plus an italic `+ N more` chip for overflow.

**Below the four filter groups:** the **Available to me** toggle.

```
[ ●—]  Available to me
       (helper: italic, "Hides invitation-only when no profile match.")
```

- Switch pattern: 28px×16px, `--bk-accent` background when on, with a cream knob.
- Implemented as `<button role="switch" aria-checked>` with `aria-label="Available to me"`.

### Main content area

#### Results header card

A unified header block that contains the title, counts, sort, active filter chips, and hidden-manuscripts handle. **All three pieces live in the same visual card**, because they reconcile the same set of counts.

```
┌─────────────────────────────────────────────────┐
│ ╔ 11 manuscripts ╗ open for readers.            │
│                                  SORT  Newest   │
│ FROM 16 LISTED · 3 CLOSING SOON · 2 HIDDEN     │
│                                                 │
│ FILTERS  ┌ Status: Open × ┐  Clear all →       │
│                                                 │
│ ┌─ 2 manuscripts hidden — match content    ─┐  │
│ │ notes you've asked to avoid.              │  │
│ │                              Show hidden → │  │
│ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Title pattern:** Newsreader roman serif, 26px, weight 400. The manuscript count is the italic anchor. Ends with a period.

Examples by filter state:

| Filter state | Title |
|---|---|
| No filters | *All **16 manuscripts**.* |
| Status: Open only | ***11 manuscripts** open for readers.* |
| Status: Open + content notes hiding 2 | ***11 manuscripts** open for readers.* |
| Status + Available to me + content notes | ***8 manuscripts** open and available to you.* |
| Genre filter only | ***5 manuscripts** in Literary Fiction.* |
| Genre + Status: Open | ***4 manuscripts** in Literary Fiction, open for readers.* |

The italic is wrapped in `<em>` inside an otherwise-roman sentence.

**Counts row:** Mono caps, 11px, weight 500. Dot-pipe `·` separators (in `--bk-rule` color).

Counts content varies with filter state:

| State | Counts content |
|---|---|
| No filters | `13 OPEN FOR READERS` (accent) · `4 CLOSING SOON` · `3 FULL` (muted) |
| Status: Open | `FROM 16 LISTED · 4 CLOSING SOON` |
| Status + content notes hiding 2 | `FROM 16 LISTED · 3 CLOSING SOON · 2 HIDDEN` (the hidden count in `--bk-accent`) |
| Status + Available to me + content notes | `FROM 16 LISTED · 3 BY INVITATION HIDDEN · 2 HIDDEN BY CONTENT NOTES` |

**Rule: counts always reconcile back to "16 listed" so the reader does no math.**

**Sort row:** Top-right of the results header. Mono caps, 11px. Active sort gets `--bk-text` color and 1.5px `--bk-accent` underline. Options:

- `Newest` (default)
- `Closing soon`
- `Most read`
- `A–Z`

**Active filter chips:** Below the title/counts row, separated by 14px margin. Pattern:

```
FILTERS  ┌ Status: Open × ┐  Clear all →
```

- Label "FILTERS" in mono caps 10px.
- Chips: `--bk-tint` background, 0.5px `--bk-rule` border, 10px mono caps text in `--bk-text`. The `×` is a `<button>` with `aria-label="Remove filter: Status Open"`, in `--bk-accent`.
- `Clear all →` link in `--bk-accent`, only present when 2+ filters active.

**Content notes filter chips do NOT appear in the active filter strip.** Their selection is communicated by the hidden-manuscripts handle below — not duplicated as chips. (This keeps the active filter strip about filters that change which manuscripts are shown, while the hidden-manuscripts handle handles the protective filter separately.)

**Hidden manuscripts handle:**

```
┌──────────────────────────────────────────────┐
│ ⚠ 2 manuscripts hidden — match content      │
│ notes you've asked to avoid. Show hidden →  │
└──────────────────────────────────────────────┘
```

- Padding 12px×16px, `rgba(232,217,196,0.5)` background, 0.5px `--bk-rule` border, 2px `--bk-accent` **left** border.
- Italic Newsreader 13px helper text, with "N manuscripts hidden" in mono caps (semantically a `<strong>`).
- "Show hidden →" action: mono caps 10px in `--bk-accent`, right-aligned.
- **Only appears when content notes are filtering manuscripts.** Hidden by the Available-to-me toggle is reflected in counts only, no handle.

#### Card grid

4 columns at desktop, 3 at tablet, 2 at mobile-landscape, 1 at mobile. 28px column gap.

Card structure is identical to the Discover standard card with these adjustments:

- **Genre eyebrow is dropped** when the current genre filter is set to a single genre (it'd be redundant — the rail tells you the genre). When "All manuscripts" is active, the genre appears in the byline line instead: `M. ABARA · LITERARY FICTION`.
- **Cards are slightly more compact** (16px top padding vs 18px on Discover) since the grid is denser.
- Otherwise the card is identical.

#### Pagination

```
                3 more manuscripts below — LOAD ALL →
```

Italic Newsreader 13px helper, with `LOAD ALL →` mono caps 11px in `--bk-accent`.

At catalogs above 50 manuscripts, this should become real pagination (next/prev or numbered pages). Deferred — flag for v2.

---

## The manuscript card

The card system is shared with Discover. Full specification in `library-discover.md`. Key points repeated here for self-containment:

### Standard card fields (scan order)

1. Genre eyebrow (omit when single-genre filter is active)
2. Title — Newsreader italic, 20px, weight 400
3. Byline — mono caps, 11px. Includes genre when "All manuscripts" is active
4. Personalization signal (conditional, italic 12px — `--bk-accent` for circle, `--bk-text-meta` for profile match)
5. Hook — Newsreader roman, 13px, single sentence
6. Content notes line (conditional)
7. Soft 0.5px `--bk-rule-soft` divider
8. Length meta — mono caps, 11px
9. Mechanism + slot status — dot-pipe separated, single line
10. CTA — `Request to read →` mono caps, 11px, `--bk-accent`

Card has 0.5px `--bk-rule` top border. Minimum height ~260px.

### Status states (locked)

Use ornament + word + color. Never color alone.

```
◦ Open · 3 of 5 slots         (--bk-status-open)
◎ Filling · 1 slot left       (--bk-status-filling)
● Full · applications closed  (--bk-status-full)
◦ Open · ongoing              (--bk-status-open)
```

### Pending request state

When the reader has already submitted a request for a manuscript, the card shows a pending status block in place of the meta-line CTA:

- Eyebrow in `--bk-accent`: `REQUEST SENT · N DAYS AGO`
- Italic helper: *"Waiting on M. Abara. Most authors respond within a week."*
- Below the meta divider, CTA becomes `Withdraw request` — underlined mono caps in `--bk-text-meta`.

The status block has `--bk-tint` background, 2px `--bk-rule` left border.

---

## Content notes — full system

### Vocabulary v1

Violence (graphic), sexual content (explicit), sexual violence, child harm, domestic abuse, suicide / self-harm, eating disorders, substance use, animal harm, medical trauma, pregnancy loss, mental illness depicted in detail, racism / racial trauma, homophobia / transphobia depicted, ableism depicted, grief / death of family, war / combat, body horror.

### Browse-by-genre behavior (key rule)

**Manuscripts containing notes the reader has flagged are HIDDEN from results by default.**

- The hidden manuscripts do not appear in the grid.
- A handle in the results header card surfaces the count and provides a one-click `Show hidden →` override.
- When the reader clicks Show hidden, the hidden manuscripts appear in a separate section at the bottom of the grid (titled "Hidden by content notes — N manuscripts"), with each card carrying a red 1.5px top border instead of the standard 0.5px gray.

---

## Accessibility requirements (locked)

- All status states use ornament + word + color (never color alone).
- Functional eyebrows ≥11px. Decorative eyebrows ≥10px. Nothing below 10px.
- Italic titles ≥18px. Below 18px, use roman.
- All mechanism icons, ornaments, and `→` arrows get `aria-hidden="true"`.
- Active nav item: `aria-current="page"`.
- Filter chips: `<button aria-pressed>`.
- Available-to-me toggle: `<button role="switch" aria-checked aria-label="Available to me">`.
- Content notes collapsed filter: `<button aria-expanded aria-controls>`.
- Active filter chip remove buttons: `<button aria-label="Remove filter: [filter name]">`. Visible focus ring required.

---

## Empty results state

When filters produce zero visible manuscripts:

- Title still uses the `N manuscripts` pattern (with `0` as the italic anchor).
- Body message: Newsreader italic 14px, `--bk-text-body`, centered, max-width 480px, top margin 56px.
- `CLEAR ALL FILTERS →` action: mono caps 11px in `--bk-accent`, centered, 24px top margin.
- If the only filter active is the content notes avoid list (hiding everything), surface a different message: *"All manuscripts in this view match content notes you've asked to avoid. You can show hidden manuscripts or manage your avoid list."*

---

## Out of scope for this brief

- Reader profile editor, Author dashboard, Author-side content notes input, Manuscript detail page, Discover view, Search results page, Sub-genre taxonomy.
