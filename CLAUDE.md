# Bookending — Agent Guide

## What this is
Bookending is a full-stack SaaS platform for self-publishers, covering the entire publishing journey: drafting → beta-reading → print & distribution → direct sales → audience/newsletter → community.

## Repository layout
```
bookending/
├── client/          # React 19 + Vite + TypeScript frontend
├── server/          # Node.js + Express + Prisma backend
├── bookending-handoff/  # Design reference (read-only — do not edit)
```

## Tech stack
| Layer     | Tech |
|-----------|------|
| Frontend  | React 19, Vite, TypeScript, React Router v7 |
| Styling   | CSS custom properties (see `client/src/styles/tokens.css`) — no Tailwind |
| Backend   | Node.js, Express, Prisma ORM |
| Database  | PostgreSQL |
| Auth      | TBD (Clerk or Supabase Auth) |
| Payments  | TBD (Stripe) |

## Three agent domains

### Frontend agent → `client/`
See `client/CLAUDE.md` for full scope.

### Backend agent → `server/`
See `server/CLAUDE.md` for full scope.

### Design agent → `client/src/styles/` + component files
See `client/CLAUDE.md` — design section.

## Design rules (apply everywhere)
- All borders are square (`border-radius: 0`)
- Typography hierarchy: Newsreader serif for editorial content, Inter sans for UI, JetBrains Mono for data/labels
- Use CSS custom properties from `tokens.css` — never hardcode colors
- Dark theme is the only theme — `--ink` background, `--paper` foreground
- The design aesthetic is a literary magazine / newspaper, not a typical SaaS dashboard

## Running locally
```bash
# Frontend
cd client && npm install && npm run dev

# Backend (needs PostgreSQL + .env)
cd server && npm install && npm run dev
```
