# Quiet Mode

Quiet Mode is a distraction-free writing session for the manuscript editor.

## What it hides

Platform chrome and social surfaces:
- Global navigation (masthead)
- Community panel
- Notification center
- Presence indicators
- Sidebars

## What it keeps

Editor functionality remains fully visible and operational:
- Save state indicator (Saving… / Saved)
- Undo and redo controls
- Word count (total and session delta)
- Elapsed session time
- Autosave (runs on its normal cadence — 600ms debounce after typing)
- Cmd/Ctrl+S shortcut (flushes autosave immediately)

> **Principle:** Quiet Mode protects the writer from the platform, not from their own tools.

## Notification deferral

Platform notifications (new followers, deadline warnings, etc.) that arrive during a Quiet Mode session are deferred and flushed as toasts when the session ends.

Save feedback is **not** deferred — it renders inline within the editor bar so the writer always knows their work is saved.

## Session flow

1. Click **Quiet** in the editor toolbar (write mode only)
2. Platform chrome fades out; the quiet bar appears with editor controls
3. Write. Autosave runs continuously. Cmd/Ctrl+S flushes immediately.
4. Press **End session** or **Escape** to exit
5. Exit summary shows words written and session duration
6. Deferred notifications flush as toasts

## State

Managed by `QuietModeContext` (`QuietModeProvider` wraps the app in `main.tsx`):

| Field          | Purpose                                           |
|----------------|---------------------------------------------------|
| `isQuiet`      | Whether a session is active                       |
| `enter()`      | Start a session                                   |
| `exit()`       | End a session                                     |
| `deferred`     | Platform notifications queued during the session  |
| `addDeferred`  | Queue a notification                              |
| `clearDeferred`| Flush the queue (called by App.tsx on `isQuiet` → false) |
