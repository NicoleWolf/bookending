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
├── features/
│   ├── masthead/              # Top-of-page hero + nav
│   ├── landing/               # Landing page
│   ├── dashboard/             # Dashboard overview
│   ├── editing/               # §01 Editing / beta-reading
│   ├── reading/               # §01 Reading room
│   ├── print-distribution/    # §02 Print & distribution
│   ├── storefront/            # §03 Direct sales shop
│   ├── audience/              # §04 Mailing list & brand
│   └── community/             # §05 Author community
├── shared/
│   └── ui/
│       ├── atoms/      # Shared primitives: Pill, Btn, Avatar, SectionHead, Spark, Bars, Folio
│       └── icons.tsx   # SVG icon components (stroke-based, 1.5px, currentColor)
├── styles/
│   └── tokens.css      # ALL design tokens — never hardcode colors or fonts
└── App.tsx             # Root composition
```

## Design rules
- Import tokens via CSS custom properties, never hardcode hex values
- Use `className="mono"`, `"serif"`, `"label"`, `"smallcaps"`, `"rule"`, `"rule-thick"` utility classes (defined in tokens.css)
- CSS Modules are the styling pattern — colocate a `ComponentName.module.css` file next to each component
- Zero border-radius on all UI elements
- Truly dynamic values (computed colors, percentages from data) stay as inline `style={{}}` props; everything static goes in the module CSS

## CSS Modules conventions
- Use `data-*` attribute selectors for variant/state-based styles: `[data-active]`, `[data-draft]`, `[data-zero]` etc.
- Use CSS custom properties as a bridge for computed JS values: `style={{ '--foo': value } as CSSProperties}` consumed via `var(--foo)` in CSS
- Compose global utility classes with module classes: `className={\`serif \${styles.title}\`}`
- Use `:last-child` / `:not(:last-child)` instead of index-based conditional borders in JSX
- Use child selectors for coupled parent→child state: `.parent[data-active] .child { font-weight: 600; }`
- Light-theme preview areas (store preview, press release thumbnail) use hardcoded dark-on-light hex values — no tokens exist for these

## Atom components (already built)
All in `src/shared/ui/atoms/` — imported from `../../shared/ui/atoms`:
- `Folio` — page number display
- `SectionHead` — section header with eyebrow, title, kicker, and optional action buttons
- `Pill` — status badge (tones: neutral, paper, accent, good, danger, solid)
- `Btn` — button (tones: primary, accent, ghost, bare)
- `Placeholder` — decorative striped placeholder box
- `Spark` — SVG sparkline
- `Bars` — SVG bar chart
- `Avatar` — circular avatar with initials (tones: ink, paper, accent, gold, muted)

## Icon components (already built)
All in `src/shared/ui/icons.tsx` — imported as `import { IconArrow, IconBell, ... } from '../../shared/ui/icons'`

## Adding new features
1. Add routes in a `src/router.tsx` file using `createBrowserRouter`
2. New section components go in their own subdirectory under `components/`
3. API calls should use `fetch` with a base URL from `import.meta.env.VITE_API_URL`
4. Types shared across components go in `src/types/index.ts`

## What the frontend needs from the backend
- Auth endpoints (sign in, sign out, session)
- REST API under `/api/` for: manuscripts, beta-readers, channels, orders, subscribers
- See `server/CLAUDE.md` for API design
