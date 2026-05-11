# Bookending Formatter — Brief

**Status:** Draft
**Owner:** Nicole
**Companion files:**
- `mockups/` — design mockups (TBD)
- `screenshots/` — reference screenshots (TBD)

---

## Goal

_Describe what the formatter does and why it exists._

---

## Architecture

_Describe the UI structure, components, and key interactions._

---

## Visual system

Follow the global design system:
- Typography: Newsreader (display/headlines), Inter (UI/body), JetBrains Mono (data/labels/eyebrows)
- Colors: use `--bk-*` tokens from `client/src/styles/tokens.css` — no hardcoded values
- All borders square (`border-radius: 0`)
- Dark theme only

---

## Implementation plan

_Staging plan TBD. Recommend 3–5 passes: audit → primitives → build in isolation → wire to data → ship._

---

## Out of scope

_List what this work explicitly does not include._

---

## Things Claude Code should ask before assuming

- _List open questions about data shape, patterns, or platform mechanics._
