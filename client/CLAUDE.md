# Frontend Agent — `client/`

## Your scope
You own everything in `client/`. Do not touch `server/`.

## Stack
- React 19 + TypeScript (strict)
- Vite 8 for bundling
- React Router v7 for routing
- No component library — all UI is hand-built using the design system

## Component structure
```
src/
├── components/
│   ├── atoms/          # Shared primitives: Pill, Btn, Avatar, SectionHead, Spark, Bars, Folio
│   ├── icons/          # SVG icon components (stroke-based, 1.5px, currentColor)
│   ├── masthead/       # Top-of-page hero + nav
│   ├── beta-readers/   # §01 Reading room
│   ├── distribution/   # §02 Print & distribution
│   ├── storefront/     # §03 Direct sales shop
│   ├── audience/       # §04 Mailing list
│   └── community/      # §05 Author community
├── styles/
│   └── tokens.css      # ALL design tokens — never hardcode colors or fonts
└── App.tsx             # Root composition
```

## Design rules
- Import tokens via CSS custom properties, never hardcode hex values
- Use `className="mono"`, `"serif"`, `"label"`, `"smallcaps"`, `"rule"`, `"rule-thick"` utility classes (defined in tokens.css)
- All inline styles use `var(--token-name)` for colors
- Zero border-radius on all UI elements
- Inline styles are the pattern — don't add CSS modules or styled-components

## Atom components (already built)
All in `src/components/atoms/index.tsx`:
- `Folio` — page number display
- `SectionHead` — section header with eyebrow, title, kicker, and optional action buttons
- `Pill` — status badge (tones: neutral, paper, accent, good, danger, solid)
- `Btn` — button (tones: primary, accent, ghost, bare)
- `Placeholder` — decorative striped placeholder box
- `Spark` — SVG sparkline
- `Bars` — SVG bar chart
- `Avatar` — circular avatar with initials (tones: ink, paper, accent, gold, muted)

## Icon components (already built)
All in `src/components/icons/index.tsx` — named exports like `IconArrow`, `IconBell`, etc.

## Adding new features
1. Add routes in a `src/router.tsx` file using `createBrowserRouter`
2. New section components go in their own subdirectory under `components/`
3. API calls should use `fetch` with a base URL from `import.meta.env.VITE_API_URL`
4. Types shared across components go in `src/types/index.ts`

## What the frontend needs from the backend
- Auth endpoints (sign in, sign out, session)
- REST API under `/api/` for: manuscripts, beta-readers, channels, orders, subscribers
- See `server/CLAUDE.md` for API design
