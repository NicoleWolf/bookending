# Bookending Dashboard Redesign — Brief

**Status:** Approved for implementation
**Owner:** Nicole
**Companion files:**
- `mockups/writer-dashboard.html` — primary writer view
- `mockups/reader-dashboard.html` — primary reader view
- `mockups/writer-empty-state.html` — writer with no manuscripts
- `mockups/reader-empty-state.html` — reader with no active beta read
- `mockups/screenshots/` — full-page PNGs of each above

The mockups are reference material. They use inline styles for chat-preview rendering. **Do not copy them verbatim into production.** Translate the design intent into the codebase's existing styling system (check `src/features/` and `src/shared/ui/` for the established pattern before generating code).

---

## Goal

Replace the current dashboard — which functions as a flat scrapbook of equally-weighted modules — with a focused architecture that answers a single question on load: **"What deserves my attention right now, and what should I do about it?"**

The current dashboard fails three ways:
1. Every module carries equal visual weight, forcing the user to scan-parse-decide before any value lands.
2. It assumes user = author. Pure readers and dual-role users have no first-class surface.
3. It displays facts but does not advise. The platform should be the expert.

This redesign fixes all three.

---

## Architecture

### Two role surfaces: Writing and Reading

Every user has access to both sides. No gating, no role assignment, no "upgrade to writer" flow. Users self-select what they care about.

The toggle lives **inside the Dashboard page itself**, not in the global nav. It renders as two large serif section-header tabs (`Writing` / `Reading`) just below the masthead, with a 2px red underline marking the active side. This matches the existing site pattern for section headers.

The inactive tab carries a small red unread dot when the other side has activity worth noticing.

### Cross-role nudge bar

A thin red-rule notice bar sits just below the tabs whenever the *other* side has unread activity. Example: on the Writing side, *"3 items waiting on your reading side — Henrik replied to your Ch. 4 note, and Marcus shipped a new chapter of Hollow Meridian."* Includes a "Switch to reading →" inline action.

The nudge appears regardless of which side the user signed up on. Dismissable per-session. Only renders when there is genuine cross-side activity.

### The Desk hero

The fold-owner. A single dark card surfaces *the* most pressing item with:
- A pill tag categorizing the item (`Pacing flag · 3 readers`, `Active conversation · Henrik replied`)
- A monospace timestamp/context line
- A serif italic headline stating the item in plain language
- 1-2 sentences of platform reasoning ("When 3+ readers converge on a passage, revision usually pays off")
- A primary CTA, a secondary CTA, and a dismiss option

Below the hero, a single card with two stacked rows for "Next" and "Then" — the second and third most important items. Each row: pill + headline on top, supporting copy + inline text-link on bottom. No buttons fighting for horizontal space.

### Lifecycle lanes

Three lanes per side. The user's most-active lane is **primary** (full-width, dominant). The other two collapse to **half-width compact cards** in a row beneath.

**Writing side:**
- `§ 01 Write & revise` — the Reading Room table, hotspot histogram, feedback-by-theme rollup
- `§ 02 Prepare & launch` — pre-publish checklist
- `§ 03 Sell & sustain` — sales, reviews, Q&A, attribution

**Reading side:**
- `§ 01 Discover` — open beta reads, invite mechanisms, circle activity
- `§ 02 Read` — active manuscripts and books, reading rhythm, in-manuscript hotspots of the user's notes
- `§ 03 Connect` — Letters in Correspondence, replies received

Lane weighting is determined by the user's most-active stage. The platform decides; the user does not pick.

### Today rail

A persistent feed of community signals (replies, shipped chapters, shared passages, circle events). Lives in a 240px right column **only at the top of the page** — capped at the height of the Desk hero via grid alignment. Below the hero, the right rail terminates and lifecycle lanes use full page width.

Items are: colored dot + serif body line + monospace timestamp. No avatars in the rail; that's reserved for the Reading Room and Discover modules.

### Footer

Editorial chrome stays: `BOOKENDING · A WORKBENCH FOR SELF-PUBLISHERS · MMXXVI` left, `SET IN NEWSREADER & INTER · PRINTED FROM PORTLAND` right. Monospace, muted.

---

## Empty states

Each side has its own empty state. When triggered, the empty state **replaces the entire Dashboard view for that side** — no Desk, no lanes, no rail. Just the masthead, tabs, the empty-state landing, and the footer.

### Writer empty state

Triggered when the user has zero manuscripts.

- Dark hero card, two-column grid: text left (~60%), illustration right (~40%)
- Headline: *"Every book starts with a first page. Yours can start here."*
- Two CTAs: **"Start a new manuscript →"** (primary) and **"Import from Word, Scrivener, or Docs"** (secondary). The import landing page itself enumerates supported formats; this is just the entry.
- Below the hero: three lifecycle preview cards (Write & revise · Prepare & launch · Sell & sustain) — same structure as the populated dashboard, so the architecture is legible before first manuscript.
- "Already have a draft?" import-detail band with format pills (`·docx`, `·scrivener`, `·google docs`, `·markdown`, `·pages`, `·rtf`).
- Tail card: "Read while you write" — points to the Reading side. Non-pushy.
- Soft footer link: "Read about how Bookending works"

### Reader empty state

Triggered when the user has not joined any beta read. (Past beta reads do not affect this — empty state is `currently_in_beta_read == 0`, not `lifetime_beta_reads == 0`.)

- Dark hero card, same two-column grid
- Headline: *"There's a manuscript out there waiting for the right reader."*
- Single CTA: **"Discover a manuscript in the Library →"**. Reader profile setup happens inside that flow, not on this page.
- Below the hero: three lifecycle preview cards (Discover · Read · Connect)
- "Three ways authors invite readers" band explaining the mechanisms (see Domain notes below)
- Tail cards: "Books, too" (storefront) and "Write while you read" (points to Writing side)
- Soft footer link: "Read about being a Bookending reader"

### Partial / inline empty states

When a user has *some* activity on a side but a specific lane is empty (e.g., a writer with a manuscript but no readers yet), that individual lane shows an inline empty state. Stale data in lanes (a finished prior project) renders normally and does not need special handling — it's just stale.

---

## Domain mechanics

These are the platform's actual mechanics. Earlier exploratory copy used some terminology that does not exist in the product. Implement only what's listed here.

### Beta read joining mechanisms

Authors decide who joins each beta read. Three mechanisms exist:

1. **Open apply** — anyone can apply, author reviews applications and accepts readers who fit
2. **Profile match** — authors browse public reader profiles and send direct invitations
3. **Circle** — readers in a user's circle joining a beta read produces social signal in the Library

There is **no vouching feature**. Do not implement, reference, or display vouch-related UI.

### Correspondence

The reader-to-author messaging surface is called **Correspondence**. The artifact users send through it is called a **Letter**. Do not call these "verdict letters."

### No deadlines

Bookending does not enforce due dates on beta reads. All urgency on the Reader side comes from **conversation and activity recency**, not from time-based deadlines.

- ✓ "Henrik replied to your note 3 hours ago"
- ✓ "Active thread on Ch. 4"
- ✓ "2 new chapters since your last read"
- ✗ "Due Friday"
- ✗ "5 days remaining"
- ✗ Countdown timers on the reader side

Launch dates on the Writer side are informational ("launches May 23"), not framed as deadlines.

### Status pills

Reader side uses activity-based status:
- `Active thread` (red border) — author has replied recently
- `2 new ch.` (green border) — new content available
- `Reading` (muted border) — in progress, no signal

Writer side uses verdict/state:
- `Enthralled` (green) — strong positive signal from reader
- `Pacing flag` (red) — reader flagged a passage
- `4★ verdict` (green) — completed read with rating

---

## Visual system

### Typography

- **Serif** (display, headlines, italics): Newsreader, fallback Georgia
- **Sans-serif** (body, UI labels): Inter, fallback system stack
- **Monospace** (eyebrows, timestamps, metadata): JetBrains Mono, fallback ui-monospace

### Color tokens

Use the existing token system in the codebase if one exists. If not, add these to whatever the established pattern is. AA-compliant pairs only.

| Token | Hex | Usage |
|---|---|---|
| `--ink` / `--bk-paper` | `#F4ECD8` | Page background |
| `--ink-2` / `--bk-paper-2` | `#EDE2C7` | Card surfaces, recessed areas |
| `--ink-3` / `--bk-paper-3` | `#E5D6B5` | Section dividers, secondary surfaces |
| `--bk-ink` | `#1F1611` | The Desk hero, empty-state heroes |
| `--rule` / `--bk-rule` | `#C8B991` | Card borders, dividers |
| `--bk-rule-soft` | `#D8CCA8` | Inner dividers, table row separators |
| `--paper` / `--bk-ink` | `#1F1611` | Body text on light surfaces |
| `--paper-dim` / `--bk-ink-2` | `#3A2A1E` | Secondary copy on light surfaces |
| `--muted-2` / `--bk-muted-2` | `#6E5C40` | Eyebrows, timestamps |
| `--bk-paper` | `#F4ECD8` | Body text on dark surfaces |
| `--bk-paper-deep` | `#DCC99C` | Secondary copy on dark surfaces |
| `--accent` / `--bk-oxblood` | `#9A3324` | Primary CTA, active state, urgency |
| *(hardcode `#FFFFFF`)* | `#FFFFFF` | Text on accent-colored backgrounds |
| `--good` / `--bk-moss` | `#3D5440` | Positive verdicts, on-track states |

### Accessibility

**WCAG 2.1 AA, non-negotiable.** Specific audit notes:

- All text on dark hero surfaces (`#1F1611`, `--bk-ink`) must be explicitly set to `#F4ECD8` (`--bk-paper`) or `#DCC99C` (`--bk-paper-deep`). **Do not rely on inheritance** — set color explicitly on every text element. The class-based approach failed in mockup iteration; inline or computed-style overrides eat the parent.
- Secondary buttons on dark backgrounds need a `1.5px` border in `#DCC99C` (`--bk-paper-deep`), not muted border tones. Otherwise the button is invisible at rest.
- Eyebrow monospace at 11px must use `#6E5C40` (`--muted-2`) or darker on cream — `#8A7E66` and lighter fail.
- Primary oxblood `#9A3324` (`--accent`) clears 4.5:1 against cream and white text.
- Status pills with red borders on cream cards: text is also `#9A3324` (`--accent`) for clarity, border at 1px.
- All interactive elements meet 3:1 contrast for non-text UI components.

Run an automated check after wiring. Manual visual review on dynamic content (user names, avatars, generated copy) before merge.

### Spacing

- Page-level padding: 28px top, 32px sides, 32px bottom
- Card padding: 16px / 18px / 22px / 24px depending on density
- Hero padding: 56px all sides for empty states, 24-26px for the Desk
- Section gaps: 28px between hero and lanes, 24px between lanes, 16px between half-width cards
- Today rail width: 240px fixed
- Today rail terminates at hero bottom edge (CSS grid alignment, not absolute height)

---

## Implementation plan

Recommend staging the work in five passes. Do not attempt to ship in one PR.

### Stage 1 — Audit

Read this brief, the mockup HTML, and the existing dashboard implementation. Produce a written plan listing:
- Files implementing the current dashboard
- Component boundaries and what gets renamed/replaced/preserved
- New components needed (Desk hero, lifecycle lane, Today rail item, role tabs, cross-role nudge, empty-state landing)
- Data shape mismatches between mockup placeholder copy and the real backend schema
- Risks (the lane-weighting logic, empty-state detection, the rail-cap-at-hero-height grid)

**Do not write code in this stage.** Output the plan as markdown for review.

### Stage 2 — Tokens and primitives

Verify the `--bk-*` palette in `client/src/styles/tokens.css` covers all needed values (it covers most — add only what's genuinely missing). Build new shared primitives in `src/shared/ui/atoms/`:
- Dark hero card — new
- Activity rail item — new
- Two-column grid utility for hero / illustration layout — new

The following already exist and should be used as-is, not rebuilt:
- `Pill` — already has tones: neutral, paper, accent, good, danger, solid
- `SectionHead` — already handles the section eyebrow + title + kicker pattern

Existing dashboard remains untouched.

### Stage 3 — Build new components in isolation

Build the Desk hero, the three lifecycle lanes, the Today rail, the role tabs, the cross-role nudge bar, and the two empty-state landings as separate components. Render them on a scratch route (`/dashboard-preview` or similar) with hand-stubbed placeholder data.

This stage is for visual fidelity. Compare side-by-side against the mockup screenshots. Iterate until the spacing, typography, and contrast are correct. Do not connect to real data.

### Stage 4 — Wire to data

Map real backend types onto the components. Build adapters where the schema doesn't fit. Specifically:

- Desk hero needs a "what matters most" priority resolver — what's the actual ranking logic?
- Lifecycle lane weighting needs a "current stage" resolver
- The cross-role unread count needs to query both sides
- Empty-state detection needs explicit definitions: writer empty = `manuscripts.length === 0`, reader empty = `active_beta_reads.length === 0`

Write tests for the priority and weighting logic. These will be the most fragile pieces.

### Stage 5 — Replace and ship behind flag

Switch the dashboard route from old to new behind a feature flag. Keep the old implementation in place during rollout. Watch:
- Empty-state paths (most common regression)
- Cross-role nudge dismissal state
- Mobile responsive breakdown of the rail-cap-at-hero-height layout
- Performance: the dashboard makes more queries than it used to (Today rail is live)

Once stable, remove the old dashboard code in a cleanup PR.

---

## Out of scope

Explicitly **not** part of this redesign:

- Global navigation changes (the masthead nav stays as-is for now; we'll revisit)
- The Manuscripts, Library, Authors, Storefront, or Community pages themselves
- The reader profile setup workflow (linked from empty state, but built separately)
- The Correspondence interface itself
- Any backend schema changes beyond what's needed to compute Desk priority and lane weighting
- Mobile-specific layout (desktop first; mobile is a follow-on)

---

## Things Claude Code should ask the user before assuming

- The data shape for manuscripts, beta reads, letters, and community activity
- Whether a feature-flag system already exists, and which one
- Whether automated accessibility testing is set up
- The component pattern (functional + hooks? class components? specific UI library?)
- Whether the existing dashboard has tests and how thoroughly to preserve their intent

If any of these aren't documented, surface the question; don't guess.
