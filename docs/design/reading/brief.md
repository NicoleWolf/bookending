# Your Reading — page redesign brief

**Page:** `/reading` (the reader's hub, distinct from `/arcs` and `/following`)
**Status:** Design complete, ready for implementation
**Owner:** Product (Nicole)
**Last updated:** May 2026

---

## 1. What this page is

A **reader's hub** organized by the reader's relationship to manuscripts. Its job is to:

1. Tell the reader, in Bookending's editorial voice, what to do next.
2. Surface the manuscripts they are warm on, saved, or have finished — each rendered for its actual state.
3. Connect outward to the reader's deeper surfaces (My ARCs, Following, Discover).

This page is **not**:

- A list of every manuscript the reader has ever touched.
- The home for ARC commitments — those live on `/arcs` (see BK-045).
- The home for followed authors — those live on `/following`.

## 2. Information architecture

Top to bottom, the page has these surfaces:

1. **Masthead** — eyebrow (`§ · READING ROOM`) + page title (`Your reading`).
2. **The House suggests** — one editorial recommendation with one primary action and one dismiss. Always present when there is something to recommend; replaced by an editorial empty state otherwise.
3. **What's warm** — manuscripts the reader has opened recently, recency-weighted, including dormant items explicitly marked.
4. **On your shelf** — saved or recommended manuscripts the reader has not started.
5. **Finished** — completed manuscripts with the reader's verdict and impression.
6. **From authors you follow** — three-tile preview row linking to `/following`.
7. **The House (rail)** — ambient cross-manuscript signal in a right rail. Editorial picks, circle signal, algorithmic nudges. No manuscript-specific activity.

The page does **not** include:

- A stat band at the top. The previous design's "Chapters read / Notes added / Manuscripts / Impressions given" band is removed entirely. Counts that matter belong on the section headers or on the cards.
- A "Labels given" element in the page chrome. Labels belong on the finished book they describe.

## 3. Component specifications

### 3.1 Masthead

- Eyebrow: `§ · READING ROOM`, monospace, 12px, letter-spacing 0.08em, secondary text color.
- Page title: `Your reading`, serif, 32px, weight 500, line-height 1.15.
- **No subline.** The previous "Three manuscripts on your shelf. One waiting on you." line is removed — the House Suggests block does this work better.

### 3.2 The House suggests

The page's center of gravity. One block, full content-width above the two-column grid.

**Layout:**
- White card background, 0.5px secondary border, **3px left edge accent in Bookending red** (`#791F1F`), no border-radius (intentional — the left accent is a deliberate exception to the rounded-corner rule).
- Padding: 1rem 1.25rem.

**Content:**
- Label: `THE HOUSE SUGGESTS`, monospace, 10px, letter-spacing 0.12em, red (`#791F1F`).
- Recommendation: serif, 18px, line-height 1.5. Written in Bookending's editorial voice. References specific entities (book title in italic, author by first name, specific anchors like "chapter 2" or "four days ago"). One sentence preferred; two if needed.
- Actions: one primary button matching the recommendation's verb, and one ghost link ("Not now") that dismisses for the session and triggers the next-best recommendation.

**Recommendation logic (engineering):**

Recommendations are computed server-side and ranked. Priority order:

1. Warm manuscript with an unread author note from a chapter the reader has read.
2. Warm manuscript with a new chapter shipped within the last 14 days.
3. Warm manuscript not opened in 7–28 days (re-engagement prompt).
4. Shelf manuscript matched to the reader by the recommendation engine (highest match score).
5. Editorial pick of the week.

If none of the above apply, show the empty state (see §6.1).

### 3.3 Two-column grid

Below the House Suggests block, the page splits:

- Left column: main content (`minmax(0, 1fr)`).
- Right rail: 180px fixed.
- Gap: 1.5rem.

On viewports under 900px, the rail collapses below the main column. On viewports under 600px, see §7 (mobile).

### 3.4 Section headers

All sections share a consistent header treatment:

- Title: monospace, 11px, letter-spacing 0.1em, uppercase, secondary text color.
- Meta (right-aligned): monospace, 11px, tertiary text color. Section-specific count or link.
- 0.5px tertiary bottom border.
- Margin: 1.75rem top, 0.75rem bottom.

### 3.5 What's warm

Manuscripts the reader has opened, sorted by `last_opened_at` descending.

**Section cap:** Show up to 5. Beyond that, surface a "See all warm reading →" link in the section meta slot.

**Card structure (active):**
- White background, 0.5px secondary border, `--border-radius-lg`.
- Two-column: 88px cover left, content right.
- Content order: title → meta line → activity strip → progress bar → pull-quote (if applicable) → actions.
- Padding: 1.25rem 1.5rem.

**Card structure (dormant):**
- Same skeleton, but **dashed border** instead of solid, `opacity: 0.85`.
- Recency text rendered in italic tertiary text color.
- No pull-quote.
- Action set shifts (see §4 for verb mapping).

**Dormant threshold:** A card is dormant when `last_opened_at` is more than 14 days ago AND there is no new activity (new chapter, new note, reply) since the last open.

**Activity strip (badges):**

Inline row of monospace pills, 10px, letter-spacing 0.06em, with full borders (not single-sided):

| Badge | When to show | Colors |
|---|---|---|
| `NEW CHAPTER` | New chapter shipped since last open | Red 50 bg / Red 900 text / Red 600 border |
| `1 NEW NOTE` (or `N NEW NOTES`) | Unread author note on a chapter the reader has read | Amber 50 bg / Amber 800 text / Amber 400 border |
| `REPLY FROM <FIRST NAME>` | Author replied to reader's impression | Blue 50 bg / Blue 800 text / Blue 400 border |
| `N OF M READ` | Always present on warm cards | Neutral (secondary background) |

Each badge except `N OF M READ` should be tappable and navigate to the relevant anchor (chapter, note, reply).

**Pull-quote:**

When there is a new author note on a chapter the reader has already read, surface it as a pull-quote on the warm card:

- Secondary background, `--border-radius-md`, 12px 14px padding.
- Label: monospace, 10px, letter-spacing 0.08em, tertiary. Format: `NEW · FROM <FIRST NAME>, ON CHAPTER <N>`.
- Quote: serif italic, 14px, line-height 1.5, primary text color. Wrap in straight quotes.
- Truncate at ~140 characters with an ellipsis. Full note opens in the reader.

Pull-quote does not appear on dormant cards even if there is a new note — the dormant state should not be loud.

**Progress bar:**

Segmented bar matching the number of available chapters. Each segment 1fr, 2px gap, 4px height, 1px segment radius.

- `done` segment: primary text color.
- `partial` segment (chapter started but not finished): secondary text color.
- Empty segment: secondary background.

### 3.6 On your shelf

Saved-or-recommended manuscripts the reader has not started.

**Section cap:** Show up to 6 (two rows of three on wide viewports, or three rows of two at current widget width). "See all →" link in section meta beyond that.

**Card structure:**
- Smaller than warm cards: 56px cover, lighter border (`--color-border-tertiary`), padding 1rem 1.25rem.
- Content: title (serif 17px) → meta (mono 10px: `DRAFT N · M CHAPTERS · GENRE`) → reason line (serif italic 13px secondary) → action row.

**Reason line copy:**

| Source | Copy |
|---|---|
| User saved it | "You saved this from Discover." |
| User saved from author's profile | "You saved this from <Author>'s profile." |
| Algorithmic recommendation | "The house thinks this matches your <Dimension>." |
| Editorial pick | "An editorial pick this season." |
| Recommended by a circle | "<N> readers in your circle have started this." |

Dimension (`Range`, `Devotion`, etc.) is whichever reader-profile dimension drove the match — engineering picks the strongest signal.

**Action row:**
- Primary link: `Begin reading →` (serif-less, sans, 12px, 500 weight, underline border).
- Secondary link (varies by source):
  - User-saved: `Remove`
  - Recommended: `Why this?` (opens a small disclosure naming the dimensions and signals)

### 3.7 Finished

Completed manuscripts with the reader's verdict and impression. **This section depends on a data-model addition — see §5.**

**Section cap:** Show 1 expanded card (most recent finish). All others link to a dedicated reading diary page (`/reading/finished`) via the section meta: `1 this season · N all-time →`.

For readers with zero finished manuscripts, hide the section entirely. Do not show an empty state.

**Expanded card structure:**
- White background, 0.5px tertiary border, `--border-radius-lg`, padding 1.25rem 1.5rem.
- Two-column: 64px cover left, content right.

**Content order:**

1. Title (serif 17px, weight 500).
2. Meta line: monospace 10px — `FINISHED <MONTH> · <N> CHAPTERS · BY <AUTHOR NAME>`.
3. Verdict line:
   - Label `YOUR VERDICT` (monospace 10px tertiary) + verdict word (**serif italic, 22px, weight 500, in a color tied to the verdict** — see verdict-color mapping below).
   - 0.5px tertiary bottom border separating it from the impression.
4. Impression: serif 14px, line-height 1.55. In straight quotes. Truncate at ~280 characters with an ellipsis if longer.
5. Action row: three sans 12px secondary links separated by 16px gap.

**Verdict-color mapping:**

The verdict word's color carries editorial weight. Map the existing label vocabulary to ramps:

| Verdict | Color (light mode) |
|---|---|
| `Enthralled` | Teal 600 (`#0F6E56`) |
| `Moved` | Purple 600 (`#534AB7`) |
| `Admiring` | Blue 600 (`#185FA5`) |
| `Curious` | Amber 600 (`#854F0B`) |
| `Unconvinced` | Gray 600 (`#5F5E5A`) |
| `Lost interest` | Gray 400 (`#888780`) |

Dark mode uses the 200 stop from the same ramp. If a new verdict ships, default to Gray 600 until a color is assigned.

**Action row verbs:**
- `Edit impression →`
- `Recommend to a circle`
- `Revisit`

### 3.8 From authors you follow

A preview row connecting to `/following`.

- Three tiles, equal-width flex row, 12px gap.
- Tile: secondary background, `--border-radius-md`, padding 0.75rem 1rem.
- Content: author name (serif 14px weight 500) + activity meta (mono 10px secondary).
- Section meta: `See all →` link to `/following`.

**Activity meta copy:**
- `SHIPPED CHAPTER <N> · <RELATIVE TIME>`
- `NEW MANUSCRIPT IN DRAFT`
- `NEXT BOOK EST. <SEASON>` or `EST. <MONTH YYYY>`
- `NO RECENT ACTIVITY` (fallback)

Sort: most recently active first. Show only 3.

If the reader follows fewer than 3 authors, show what exists and pad with a `Find writers to follow →` tile linking to Discover. If they follow zero, hide the section.

### 3.9 The House (rail)

Right rail, 180px wide, ambient signal only.

**Critical:** This rail must not duplicate any information that lives on a card. If a manuscript has activity, that activity goes on the manuscript card. The rail is for cross-manuscript editorial signal.

**Item structure:**
- Serif 13px line, line-height 1.4, primary text color. Italicize book titles inline.
- Meta line below: monospace 10px tertiary. Categorizes the item (`EDITORIAL PICK`, `FROM YOUR CIRCLE`, `A NUDGE`).
- 10px vertical padding, 0.5px tertiary bottom border between items.

**Item categories:**

| Category | Example copy |
|---|---|
| `EDITORIAL PICK` | "A new manuscript in your favoured genre opened for early readers this week." |
| `FROM YOUR CIRCLE` | "Three readers you trust finished <Book> in <Month>." |
| `A NUDGE` | "Your Range is unusually broad this season — here are two writers outside it." |

Show up to 4 items. No timestamps in this rail (deliberate — rail is editorial, not chronological).

## 4. Verb mapping per card state

| Card state | Primary action | Secondary actions |
|---|---|---|
| Warm, active, new note | Continue reading | Reply to author, Jot an impression |
| Warm, active, no new note | Continue reading | Jot an impression |
| Warm, dormant | Pick it back up | Step back |
| Shelf, user-saved | Begin reading → | Remove |
| Shelf, recommended | Begin reading → | Why this? |
| Finished | Edit impression → | Recommend to a circle, Revisit |

Verbs are not interchangeable across states. "Begin reading" on a warm card is wrong; "Continue reading" on a shelf card is wrong. Enforce in component logic.

## 5. Data-model dependencies

The current implementation does not fully support this design. Required additions:

### 5.1 Finished state

A reader's relationship to a manuscript needs a `finished_at` timestamp and a `verdict` enum (matching the label vocabulary). Finished is reached when:

- The reader explicitly taps "Mark as finished" at the end of the final chapter (gesture exists for ARCs per BK-044; needs to extend to non-ARC reading), OR
- The reader posts an impression on a manuscript where they have read all available chapters.

Once finished, the manuscript leaves "What's warm" and enters "Finished," regardless of subsequent activity. New chapters on a finished manuscript surface in The House rail, not on a warm card.

### 5.2 Dormant detection

The `What's warm` query needs to compute dormancy from `last_opened_at` and `last_activity_at`, not just `last_opened_at` alone. A manuscript is dormant when:

```
last_opened_at < now() - INTERVAL '14 days'
AND last_activity_at < last_opened_at
```

This prevents stale cards from appearing dormant when there is actually new activity for the reader to see.

### 5.3 Shelf source tracking

Each shelf entry needs a `source` field with one of: `self_saved`, `recommended_algo`, `recommended_editorial`, `recommended_circle`. Used to drive the reason-line copy in §3.6.

### 5.4 Recommendation reason

For algorithmic shelf recommendations, store the dominant dimension (`Range`, `Devotion`, `Scrutiny`, `Experience`, `Celerity`) that drove the match, so the reason line can name it.

## 6. Empty states

### 6.1 Nothing to recommend (House Suggests empty)

Replace the House Suggests block with an editorial empty state:

- Same visual frame (white card, red left edge).
- Label: `THE HOUSE`.
- Copy varies by reader profile:
  - **New reader (zero manuscripts touched):** "Bookending opens with whatever you pick up first. The shelf below is where the house has gathered things you might like."
  - **Returning reader, no warm or shelf:** "Quiet week. <N> writers you follow are working on something — or wander into Discover and see what's new."
  - **All caught up:** "You're current on everything you're reading. Nothing waiting on you."
- Primary action varies: `Browse Discover →` or `Visit your Following →`.

### 6.2 What's warm is empty

Hide the section entirely. The House Suggests block already handles the "what should I do" question.

### 6.3 On your shelf is empty

Show a single-line editorial prompt in place of cards: "Save manuscripts from Discover, or accept a house recommendation, to build your shelf." Link to Discover.

### 6.4 Finished is empty

Hide the section entirely. Do not show a placeholder. New readers should not be reminded they haven't finished anything.

### 6.5 The House rail is empty

If there is nothing ambient to show, hide the rail and let the main column take full width. Do not show empty items or placeholders.

## 7. Mobile

This brief specifies desktop. Mobile is a sibling design exercise. Known constraints to design around:

- The House Suggests block needs to remain prominent — likely a card pinned to the top of the viewport, not a banner.
- The two-column grid collapses to a single column. The rail moves below the main content and reduces to a single-line editorial scroll, or is hidden entirely.
- Warm cards: cover scales to 56px, content reflows below.
- Shelf grid collapses to single column.
- Finished impression truncates earlier (~140 characters).
- All hover affordances must have tap equivalents (long-press for "Why this?" disclosure, etc.).

**Engineering note:** Do not ship desktop without designed mobile. The page's primary traffic is expected to be mobile.

## 8. Voice and copy rules

The page's editorial voice is non-negotiable. Specifics:

- **No second-person commands.** Prefer "The house suggests" over "We recommend." Prefer "You're current on everything" over "All caught up!"
- **No game-y language.** No streaks, badges (in the gamification sense), points, XP, levels. The label/verdict system is editorial, not gamified.
- **No exclamation points anywhere on the page.**
- **Specific entities, always.** "Idris shipped chapter 2 four days ago" not "an author shipped a chapter recently." Names, numbers, anchors.
- **Italics for book titles.** Inline `<em>` tags. Never quote marks around titles.
- **Straight quotes for impressions and notes.** ASCII `"` not curly `"` `"` (this matches the existing typography in the design system).
- **Sentence case in all UI labels.** `Continue reading` not `Continue Reading`. Exception: monospace eyebrow/meta labels, which are uppercase by typographic convention.

## 9. Out of scope for this redesign

Items intentionally excluded from this work:

- **A reading-diary page** (`/reading/finished`). Linked from the Finished section meta, but the page itself is a separate design exercise.
- **A dedicated Following page** (`/following`). Linked from the From Authors You Follow section, but designed separately.
- **The "Why this?" disclosure.** Linked from recommended shelf cards, but the disclosure UI itself is a small follow-on.
- **The Mark as finished gesture for non-ARC reading.** Required for the finished state to work (§5.1), but the gesture's UI lives in the manuscript reader, not on this page.
- **Reply to author flow.** Linked from warm cards with new notes, but the reply composer is a separate component.

## 10. Acceptance criteria

The redesign is complete when:

- [ ] The page opens with a House Suggests block driven by the priority ranking in §3.2, with a working dismiss that triggers the next-best recommendation.
- [ ] What's warm shows active and dormant cards with distinct visual treatment and distinct action sets.
- [ ] On your shelf shows source-aware reason lines and source-aware secondary actions.
- [ ] Finished renders the verdict word in serif italic with the verdict-color mapping, alongside the impression as a pull-quote.
- [ ] From authors you follow links to `/following` and shows up to three most-recently-active authors.
- [ ] The rail contains only cross-manuscript ambient signal and never duplicates card-level activity.
- [ ] All empty states in §6 render correctly.
- [ ] No element from the previous design's stat band or chrome-labels remains on the page.
- [ ] Voice and copy rules in §8 pass review.
- [ ] Mobile layout is designed before desktop ships (§7).

## 11. References

- Outside-lead critique that informed this revision (in conversation history).
- Previous Bookending dashboard redesign — voice, rail pattern, lifecycle-lane structure.
- BK-044, BK-045 — ARC reader surfaces.
- BK-021 — writer ARC dashboard.
- Chapter-anchored author notes feature spec.
- Reader reputation dimensions (Devotion, Scrutiny, Experience, Celerity, Range).
