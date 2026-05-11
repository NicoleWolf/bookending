# Manuscripts Landing Redesign

This folder contains the design and implementation specs for the
redesigned Manuscripts landing page. The redesign replaces the current
completeness-checkmark approach with a "card as mirror" pattern: each
card reflects the manuscript's actual metadata, with soft invitations
for missing fields.

## Documents

- `01-design-spec.md` — Design intent, principles, page anatomy, card
  anatomy, and out-of-scope items.
- `02-component-spec.md` — Design tokens, component tree, data shape,
  accessibility requirements, and edge cases.
- `03-implementation-plan.md` — Ordered tasks with acceptance criteria,
  ready to execute.

## How to use these docs

Read them in order: 01 → 02 → 03. Doc 01 explains the why and the what,
doc 02 explains the how at the component level, and doc 03 is the
actionable task list with acceptance criteria.

When implementing, treat doc 03 as your checklist. Doc 02 is the
reference for tokens, component contracts, and data shape. Doc 01 is
the source of truth for design intent — refer back to it when making
judgment calls about behavior or visual treatment that the other docs
don't fully specify.

## Out of scope

See the "Out of scope" sections in each doc. Notable items: pricing has
moved to the Shop section and must not appear on this page; list view
toggle is deferred to v1.1; dark mode variants are deferred.
