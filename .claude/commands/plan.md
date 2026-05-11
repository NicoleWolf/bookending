# /plan — Architecture & Implementation Planning Agent

Use the Agent tool with **model: "opus"** to produce a structured implementation plan for the following feature or change:

> $ARGUMENTS

## What the Opus agent must do

1. Read `CLAUDE.md`, `client/CLAUDE.md`, and `server/CLAUDE.md` to understand project constraints
2. Explore relevant existing files (components, data files, types) related to the request — use Glob and Grep, do NOT read files speculatively
3. Identify every file that will need to change and why
4. Produce the plan in the exact format below
5. Flag any ambiguities that need a decision before coding starts
6. Label each step by complexity: **simple** (use /scaffold or Haiku), **medium** (Sonnet), **complex** (stay with Sonnet, do not delegate)

## Output format the agent must return

```
## Goal
One sentence.

## Files to change
- path/to/file.tsx — reason
- path/to/file.ts  — reason

## Steps
1. [simple] Description — what changes, what file, what the output looks like
2. [medium] Description
3. [complex] Description
...

## Decisions needed before starting
- Question 1?
- Question 2?

## Risks / side effects
- Any downstream breakage to watch for
```

## Rules
- Do NOT write any code. Plans only.
- Do NOT modify any files.
- If the request is too vague to plan, ask one clarifying question and stop.
- Keep each step atomic — one concern per step.
