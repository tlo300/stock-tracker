# Stock Tracker

A Next.js portfolio tracker app using the same stack as world-map-tracker.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS v4, Plus Jakarta Sans
- **Database**: PostgreSQL via Drizzle ORM
- **Language**: TypeScript

## Dev

```bash
npm run dev      # starts on http://localhost:3004
npm run db:push  # push schema to DB
npm run db:studio # open Drizzle Studio
```

## Env

Copy `.env.local.example` to `.env.local` and fill in `DATABASE_URL`.

## Next.js Notes

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Dynamic route handlers use `RouteContext<"/api/path/[param]">` — see existing routes for the pattern.
