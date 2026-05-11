# /review — Pre-Commit Code Review Agent (Sonnet)

Use the Agent tool with **model: "sonnet"** to review staged changes before commit.

## What the Sonnet agent must do

1. Run `git diff --staged` to see all staged changes
2. Run `git diff --staged --name-only` to get the file list
3. For each changed file, evaluate it against the checks below
4. Return a structured report — do NOT modify any files

## Review checklist

### Correctness
- [ ] No TypeScript errors introduced (check types manually — do not run tsc)
- [ ] State updates use functional form where stale closure is a risk
- [ ] useEffect dependencies are correct (no missing deps that cause stale reads)
- [ ] No `any` types added without a comment explaining why

### Bookending design rules
- [ ] No hardcoded hex colors — only `var(--token-name)` from tokens.css
- [ ] No `border-radius` values
- [ ] No inline styles for static values (dynamic-only rule)
- [ ] State/variants use `data-*` attributes, not conditional className strings
- [ ] New components have a colocated `.module.css` file

### Safety
- [ ] No `localStorage` keys introduced without checking for conflicts with existing keys
- [ ] No `console.log` left in
- [ ] No commented-out code blocks
- [ ] No TODO comments that block the feature from working

### Structure
- [ ] No new files in wrong directories (features vs shared)
- [ ] No cross-feature imports that create circular dependencies

## Output format

```
## Summary
PASS / PASS WITH WARNINGS / NEEDS CHANGES

## Files reviewed
- filename.tsx — PASS
- filename.module.css — WARN: [issue]
- filename.ts — FAIL: [issue]

## Issues (if any)
### [filename:line] Issue title
What the problem is and the fix.

## Commit message suggestion
A single line following the repo style.
```

## Rules
- Be direct — no hedging, no "you might want to consider"
- If everything passes, say so in 2 lines and give the commit message
- Do NOT rewrite or edit any files
