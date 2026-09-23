# StudySync — Agent & Developer Guide

StudySync lets a student record a class, transcribe it live in the browser, and send the
transcript to Claude for a structured, plain-language summary (tasks, topics, key points,
assignments with due dates, study tips). This doc describes the real full-stack rebuild:
architecture, conventions, and how to run it. Read this before making changes so new work
stays consistent with what's here.

## Stack

| Layer    | Choice                                                                 |
| -------- | ----------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand, next-themes |
| Backend  | Node.js + **Express** + TypeScript, Prisma ORM, PostgreSQL, JWT in an httpOnly cookie |
| AI       | Backend proxies to the Anthropic API (`@anthropic-ai/sdk`). Frontend never sees an API key. |
| Audio    | MediaRecorder + Web Speech API, entirely client-side. Only the **transcript text** reaches the backend — audio is never uploaded or stored. |
| DB       | PostgreSQL via Docker Compose locally                                   |

Express was chosen over Fastify for its ubiquity and because nothing here needs Fastify's
extra throughput — no strong reason to deviate from the sensible default.

## Repo layout

```
studysync/
├── backend/                 # Express API, port 4000 by default
│   ├── prisma/schema.prisma # DB schema (source of truth for models)
│   ├── prisma/seed.ts       # Seeds an admin + student with sample data
│   └── src/
│       ├── routes/          # One file per resource, mounted in app.ts under /api/*
│       ├── middleware/      # requireAuth, requireRole, error handler
│       └── lib/             # env, prisma client, auth (jwt/bcrypt), crypto (API key
│                             # encryption), anthropic (Claude call + response parsing)
├── frontend/                 # Next.js App Router, port 3000 by default
│   └── src/
│       ├── app/(auth)/       # /login, /signup — public, centered card layout
│       ├── app/(app)/        # /record, /lessons, /assignments, /subjects,
│       │                     # /statistics, /team, /settings — behind the sidebar shell
│       ├── components/       # ui/ (shadcn primitives) + feature folders + layout/
│       ├── hooks/            # one file per resource: React Query hooks (use-lessons.ts,
│       │                     # use-assignments.ts, …) and recording hooks
│       ├── lib/               # api.ts (typed fetch client), types.ts, dates.ts, colors.ts
│       ├── store/             # ui-store.ts — Zustand, mobile nav + notified-assignment ids
│       └── proxy.ts           # Next 16's renamed `middleware.ts` — auth gate for routes
├── docker-compose.yml         # Postgres (+ optional pgAdmin behind the `tools` profile)
└── AGENTS.md                  # this file
```

## Running it locally

```bash
# 1. Database
cp .env.example .env                 # repo root — docker-compose reads this
docker compose up -d postgres        # add `--profile tools` for pgAdmin on :5050

# 2. Backend
cd backend
cp .env.example .env                 # fill in ANTHROPIC_API_KEY if you want a fallback key
npm install
npx prisma migrate dev               # creates tables
npm run seed                         # optional: admin@studysync.dev / student@studysync.dev, both password123
npm run dev                          # http://localhost:4000

# 3. Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev                          # http://localhost:3000
```

Both dev servers and the Postgres container were run and smoke-tested while building this
(migrations applied, seed loaded, full auth → subjects → lessons → tasks → assignments →
stats → team round trip verified via curl against the real DB, plus `next build`/`tsc`/
`eslint` all clean). What was **not** exercised is the in-browser MediaRecorder/Web Speech
flow and a real Claude summarization call — no browser automation was available in this
session and no live Anthropic key was configured. Manually record a short lesson and confirm
the waveform, live transcript, and summary generation before shipping.

## Auth model

- `POST /api/auth/signup|login` set an httpOnly, `SameSite=Lax` cookie (`studysync_token` by
  default) containing a JWT `{ sub: userId, role }`. The **first** user to sign up becomes
  `admin`; everyone after that is `student`.
- Every `/api/*` route (other than `/auth/*` and `/health`) runs `requireAuth`, which verifies
  the JWT and attaches `req.user`. `requireRole("admin")` gates `/api/team`.
- The frontend's `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) does a
  **presence-only** cookie check to redirect fast before render. It does not verify the JWT —
  the backend is the actual source of truth and re-checks on every request. A spoofed cookie
  gets past the proxy but 401s on the first API call, which the `(app)/layout.tsx` auth guard
  turns into a redirect to `/login`.
- **Cookie sharing in dev**: cookies aren't port-scoped, so a cookie set by
  `http://localhost:4000` is sent on requests to `http://localhost:3000` too — this is why the
  Next proxy can read it. **In production**, put the frontend and backend behind the same
  registrable domain (e.g. reverse-proxy `/api` to the backend on `app.studysync.com`, or set
  the cookie's `Domain` explicitly) or this breaks.

## AI summary flow

1. Frontend records audio + live transcript entirely client-side (`use-recording-session.ts`
   composes `use-audio-recorder.ts` for MediaRecorder/waveform/wake-lock and
   `use-speech-recognition.ts` for the Web Speech API transcript).
2. On stop, the user reviews/edits the transcript, then `POST /api/summarize` sends **only the
   transcript text** (never audio) to the backend.
3. Backend (`src/lib/anthropic.ts`) calls Claude with a system prompt that forces a strict JSON
   shape (`suggestedTitle, tasks[], topics[], assignments[{text,dueDate,dueTime}], keyPoints[],
   dates[], studyTips[]`) and defensively parses the response (strips code fences, filters
   non-string array entries) — `/summarize` is stateless and just returns that JSON.
4. The frontend then `POST /api/lessons` with `{ transcript, summary, tasks, assignments, ... }`
   in one call, which persists the Lesson + Summary + Tasks + Assignments (source: `"lesson"`)
   transactionally via nested Prisma creates.
5. Each user's Anthropic key is set in Settings, encrypted at rest with AES-256-GCM
   (`API_KEY_ENCRYPTION_SECRET`) and decrypted only for the outbound Claude call. If a user
   hasn't set one, the backend falls back to `ANTHROPIC_API_KEY` from the server's own `.env`
   (optional — omit it to force every user to bring their own key).

## Frontend conventions

- **Data fetching**: every resource gets a `hooks/use-<resource>.ts` file exporting React
  Query hooks. Mutations invalidate the relevant query keys (see `use-lessons.ts` for the
  fan-out: saving a lesson touches lessons, subjects (lesson counts), assignments, and stats).
- **Client state**: Zustand (`store/ui-store.ts`) is only for UI state that doesn't belong on
  the server — mobile nav open/closed, which assignment IDs already fired a browser
  notification this session. Everything else is server state via React Query.
- **Dialog forms** (`subject-form-dialog.tsx`, `assignment-form-dialog.tsx`) split the form
  into a child component that only mounts while the dialog is open, so its local state
  initializes fresh from props every time — no `useEffect` needed to re-sync fields between
  "create" and "edit". Follow this pattern for new dialogs rather than reaching for an effect.
- **shadcn/ui is on Base UI, not Radix**: this project's shadcn install resolved to the
  `base-nova` style, which composes via `@base-ui/react` instead of Radix. The practical
  difference: there is **no `asChild` prop**. To render a trigger/item as a different element
  (e.g. a `Link`), pass `render={<Link href="..." />}` and put the visible content as
  `children` on the *outer* primitive, e.g.:
  ```tsx
  <DialogTrigger render={<Button variant="outline" />}>
    <Plus /> New subject
  </DialogTrigger>
  ```
  When the render target isn't a native `<button>` (e.g. a `Link`/`<a>`), also pass
  `nativeButton={false}` on `Button`. `TooltipProvider` similarly takes `delay`, not
  `delayDuration`. If you add new shadcn components, check the generated source under
  `components/ui/` for the same pattern before wiring up triggers.
- **Tailwind v4**: there is no `tailwind.config.ts` — theme tokens (including the forest/mint
  palette) live as CSS custom properties in `src/app/globals.css` under `:root` / `.dark`, fed
  into Tailwind via `@theme inline`. Change the palette there, not in a JS config.
- **Route protection**: pages under `app/(app)/` assume `(app)/layout.tsx` has already
  confirmed a session (it redirects to `/login` otherwise) — don't re-implement auth checks
  per page. The `/team` page additionally redirects non-admins client-side; the backend 403s
  regardless, so this is UX only.

## Database

`backend/prisma/schema.prisma` is the source of truth. Key relationships:

- `User 1—N Subject/Lesson/Assignment`, cascade-deleted with the user.
- `Lesson 1—1 Summary`, `Lesson 1—N Task`, both cascade-deleted with the lesson.
- `Assignment` is its own top-level entity (not nested under Lesson) so manually-added
  assignments and lesson-derived ones (`source: "lesson" | "manual"`) live in one table;
  `lessonId` is nullable and `SetNull`s if the lesson is deleted, so an assignment survives
  even if you delete the lesson it came from.
- `dueDate`/`dueTime` are plain `YYYY-MM-DD` / `HH:MM` strings (not `DateTime`), matching what
  the prototype and the Claude summary schema produce — sorts correctly lexicographically and
  avoids timezone conversion headaches for what's really a local calendar date.

Run `npx prisma studio` (from `backend/`) to browse data visually.

## Environment variables

See `.env.example` at the repo root (Postgres/Docker) and inside `backend/` and `frontend/`.
Notably:

- `backend/.env`: `JWT_SECRET` and `API_KEY_ENCRYPTION_SECRET` must be real random secrets in
  any shared environment — the checked-in `.env.example` values are placeholders only.
- `frontend/.env.local`: `AUTH_COOKIE_NAME` must match `backend/.env`'s `COOKIE_NAME` — it's
  only used for the presence check in `proxy.ts`.

## What's not implemented yet

- No automated test suite (unit/integration/e2e) — everything above was verified manually via
  `tsc`/`eslint`/`next build` plus curl against a live Postgres instance.
- No password reset / email verification flow.
- No rate limiting beyond `/api/auth/*` and `/api/summarize` (see `app.ts`).
- Audio is captured client-side but discarded on save (never uploaded) — add an upload step
  and object storage if you want playback of past recordings later.
