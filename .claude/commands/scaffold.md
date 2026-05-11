# /scaffold — Boilerplate Generation Agent (Haiku)

Use the Agent tool with **model: "haiku"** to generate boilerplate code from the following spec:

> $ARGUMENTS

The spec is either:
- A step marked `[simple]` from a /plan output
- A direct description like "new CSS module for X" or "new React component named Y that does Z"

## What the Haiku agent must do

1. Read the single most relevant existing file as a pattern reference — one file only
2. Generate the requested boilerplate following that pattern exactly
3. Write the file(s) using the Write or Edit tool
4. Return a one-line summary of what was created

## Hard rules the agent must follow (Bookending project)

- **Styling**: CSS Modules only — colocate a `ComponentName.module.css` next to every new component. No inline styles except for truly dynamic JS values.
- **Colors**: Only CSS custom properties from `tokens.css` — never hardcode hex values
- **Border radius**: Always `0` — never add `border-radius`
- **State/variants**: Use `data-*` attribute selectors (`[data-active]`, `[data-draft]`) in CSS — not class variants
- **Typography**: `var(--serif)` for editorial content, `var(--sans)` for UI, `var(--mono)` for data/labels
- **Icons**: Import from `../../shared/ui/icons` — do not inline SVGs
- **Comments**: None unless the WHY is non-obvious

## What the agent must NOT do

- Do not read more than 2 files
- Do not implement logic — only structure and style scaffolding
- Do not add error handling, loading states, or features not in the spec
- Do not run any commands
