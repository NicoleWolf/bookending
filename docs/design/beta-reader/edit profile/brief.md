# Bookending — Edit Reader Profile

**Surface:** `/readers/:handle/edit` (and `/readers/new` for first-time setup — same page, three differences noted below)
**Status:** Spec ready for implementation
**Owner:** Design hand-off → Claude Code

---

## What this page is

A settings tool for readers to manage their public profile. The 80% case is a returning reader flipping their availability or tweaking one field and leaving. The 20% case is first-time onboarding. The design optimizes for the 80% case.

This page is deliberately **not** styled to match the view page. The view page is editorial (cream surface, serif type, italicized values) because it sells the reader to writers. The edit page is a tool — neutral surface, sans-serif, app-shell patterns. Brand expression and workflow tooling do different jobs.

---

## Page anatomy (top to bottom)

### 1. Top bar (sticky)
- Breadcrumb: `Readers / Rosa Pereira / Edit`
- Right side: autosave indicator (`Saving…` ↔ `Saved`) + primary button `Done`
- The `Done` button navigates back to the view page. It does not commit — autosave already did. Do not label it "Save."

### 2. Availability card (lead with this)
The highest-frequency edit on the page. Surface it first, full width, with a colored accent.

- States: `on` (green dot, green-tinted border, title "Open to beta read requests") vs `off` (gray dot, neutral border, title "Closed to new requests")
- Helper text changes with state:
  - On: *"Writers can invite you. Your profile stays visible either way."*
  - Off: *"You won't appear in writers' invite searches. Re-open when you have capacity."*
- Toggle: standard switch component, animates on change

### 3. Profile card
- Avatar (64px circle): displays uploaded photo or initials fallback. The avatar itself is the upload target — hover reveals a camera-icon overlay; click opens file picker → crop modal → confirm.
- Two-column field row: `Display name` (required, max 60 chars) and `Location` (optional, max 80 chars, placeholder "Optional")

### 4. About card
- Section label + one-line hint: *"A few sentences on how you read and what you bring. Shown on your public profile."*
- Textarea, 500-char soft limit with right-aligned counter
- Autosaves on input (debounced 500ms)

### 5. Genres card
- Section label + one-line hint: *"Writers filter readers by genre when sending invites."*
- Multi-select chip grid. Selected chips invert to dark fill with a leading checkmark glyph. Unselected chips are outlined.
- Genre list **must come from the same taxonomy** that powers Library filtering and manuscript metadata. Do not hardcode. If the taxonomy module isn't ready, stub with the 12 genres in the mock and flag as a follow-up.

### 6. Footer (in-card, muted)
- Left: link to `View public profile` (opens view page in same tab)
- Right: `Changes save automatically` (text only, no icon)

---

## What is NOT on this page

These were considered and deliberately excluded. Document the rationale here so it doesn't get re-litigated in PR review:

- **Reputation strip** (Devotion / Scrutiny / Experience / Celerity / Range). These are earned, computed by Bookending, and not editable. They belong on the view page only. Putting read-only display content on an edit page muddies the affordance — users will try to click them.
- **Notification preferences.** Account-level concern, lives elsewhere.
- **Manuscript length limits, content sensitivities, languages.** If these ever ship, they go on a separate "Reading preferences" surface, not bloating this one.
- **Explicit Save button.** Autosave with undo is the modern pattern. See "Save behavior" below.

---

## Save behavior

**Autosave on every field**, debounced 500ms. The save-state indicator in the top bar is the user's feedback channel.

States: `idle` (hidden or "Saved" with check), `saving` (spinner + "Saving"), `saved` (check + "Saved"), `error` (warning + "Couldn't save · Retry").

**Undo toast on destructive changes.** When About is cleared, when all genres are deselected, or when availability is toggled off, fire a toast: `"About cleared · Undo"` (etc.). Five-second window. Toast lives in the global toast region, not in the page.

**No `beforeunload` prompt** — autosave makes it unnecessary and they're hostile UX.

---

## Onboarding mode (`/readers/new`)

Same page, three differences. No separate template, no wizard.

1. Breadcrumb: `Readers / New profile / Edit`
2. Primary button label: `Publish profile` (replaces `Done`). Disabled until `display_name` is present AND at least one genre is selected.
3. Banner above the availability card: *"You're not visible to writers yet. Publish your profile when ready."* Dismisses on first publish.

Until publish, autosave still writes — to a draft. On publish, the draft becomes the live profile. Reputation strip on the view page renders em-dashes for all five dimensions until earned.

---

## Validation

| Field | Rule |
|---|---|
| Display name | Required. 1–60 chars. Trim whitespace. |
| Location | Optional. ≤80 chars. |
| About | Optional. ≤500 chars (soft limit; counter goes red past 500, save still works but truncates on display). |
| Genres | At least 1 required to publish (onboarding only). Editing live profile can drop to 0 but flag with a toast: *"You won't appear in genre searches."* |
| Avatar | Optional. Accept jpg/png/webp, ≤5MB, crop to square. Initials fallback if missing. |

---

## States to build

- **Empty / first-time** (onboarding mode, see above)
- **Populated / editing** (the default mock)
- **Saving** (top-bar indicator changes)
- **Save error** (top-bar indicator + retry affordance)
- **Availability off** (card style, helper text, dot color all change)
- **Avatar uploading** (spinner overlay on the avatar circle)
- **Mobile** (single column; identity row stacks avatar above fields; top bar stays sticky)

---

## Visual system

- Page background: `--color-background-tertiary` (tinted page underlay)
- Cards: `--color-background-primary` white surface, `0.5px solid --color-border-tertiary`, `--border-radius-lg`, 20px padding
- Availability card "on" state: same as above, but border becomes `--color-border-success`
- Typography: `--font-sans`, 13–15px body, 12px hints, weight 400/500 only
- Chip selected state: dark fill (`--color-text-primary`), light text (`--color-background-primary`), leading checkmark
- Focus rings: 3px halo using `--color-background-info`
- No serif. No cream. No italicized labels. The brand voice lives on the view page.

**Token mapping (project implementation):**
- `--color-background-tertiary` → `--ink-2`
- `--color-background-primary` → `--ink-3`
- `--color-border-tertiary` → `--rule`
- `--color-border-success` → `--good`
- `--border-radius-lg` → `0` (project standard: square corners)
- `--font-sans` → `var(--sans)`
- `--color-text-primary` → `var(--paper)`

---

## Keyboard & a11y

- Tab order: availability toggle → avatar → display name → location → about → each genre chip → done button
- Genre chips: `role="button"`, `aria-pressed` reflects selected state, Space toggles
- Save-state indicator: `aria-live="polite"` region so screen readers announce "Saving" → "Saved"
- All form fields have associated `<label>` (not just placeholder)
- Avatar upload target: `aria-label="Change profile photo"`
- Color is never the sole carrier of state — selected chips have a checkmark, availability has a text title change, save state has both icon and text

---

## Out of scope (follow-up tickets)

- Avatar crop modal (separate spec)
- Genre taxonomy module (if not already built)
- Toast component with undo action (if not already built)
- Public profile preview pane (rejected for now — `View public profile` link is sufficient)
- Onboarding mode (`/readers/new`) — deferred to follow-up

---

## Reference

- Reader profile view page (for context, not styling): see existing `/readers/:handle` route
- Mock of this page: provided in design hand-off (interactive HTML, dark/light mode tested)
