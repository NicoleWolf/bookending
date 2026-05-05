# Backend Agent — `server/`

## Your scope
You own everything in `server/`. Do not touch `client/`.

## Stack
- Node.js + Express 4
- TypeScript (strict, CommonJS output)
- Prisma ORM + PostgreSQL
- `tsx` for dev hot-reload

## Directory structure
```
src/
├── routes/         # Express routers, one file per resource
├── middleware/     # Auth, error handling, request validation
└── index.ts        # App entry point, mounts routes

prisma/
└── schema.prisma   # Database schema — single source of truth
```

## API conventions
- All routes are prefixed `/api/`
- JSON responses always: `{ data: ... }` on success, `{ error: string }` on failure
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error
- Resource routes follow REST: `GET /api/manuscripts`, `POST /api/manuscripts`, `GET /api/manuscripts/:id`, etc.

## Database models (Prisma schema)
Core models already defined in `prisma/schema.prisma`:
- `User` — author account
- `Manuscript` — a book in progress
- `Chapter` — chapters within a manuscript
- `BetaReader` — a reader assigned to a manuscript
- `DistributionChannel` — sales channel (KDP, IngramSpark, etc.)
- `Subscriber` — mailing list subscriber
- `Order` — direct sale order

## Adding new routes
1. Create `src/routes/[resource].ts` with an Express `Router`
2. Mount it in `src/index.ts` at `/api/[resource]`
3. Add a Prisma migration if schema changes: `npm run db:migrate`
4. Keep business logic in the route handler — no service layer yet

## Environment variables
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — default 3001
- `CLIENT_URL` — frontend URL for CORS (default http://localhost:5173)

## What the backend exposes to the frontend
All routes under `/api/` — see frontend CLAUDE.md for what the client needs.
The `/health` endpoint at `GET /health` returns `{ status: "ok" }`.
