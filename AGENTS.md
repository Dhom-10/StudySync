# StudySync — Agent & Developer Guide

StudySync lets a student record a class, transcribe it live in the browser, and send the
transcript to Claude for a structured, plain-language summary (tasks, topics, key points,
assignments with due dates, study tips).

**Current focus: UI first, backend rebuilt incrementally.** The original backend (Express +
Prisma + Postgres), Docker Compose, and all server-side plumbing from an earlier full-stack
rebuild were removed because they were built too far ahead of the UI. That version still
exists in git history (`git log --all -- backend/` to find it) for reference. `backend/` now
holds a fresh, intentionally minimal Express + TypeScript server (no database, no auth yet) —
grow it one route at a time as the frontend needs real data, rather than re-introducing the
old Prisma/Postgres/JWT setup wholesale.

## Stack

| Layer    | Choice                                                                 |
| -------- | ----------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand, next-themes |
| Backend  | Node.js + Hono + TypeScript (ESM, `.js` import extensions) + SQLite (`node:sqlite`); lesson pipeline only, no auth |
| Audio    | `/dashboard/demo`: MediaRecorder (audio only, cut into ~8 s chunks for a live transcript) -> backend -> ffmpeg -> whisper.cpp (tiny.en) -> Ollama (llama3.2:3b), all local. |

The frontend's data fetching hooks and `frontend/src/lib/api.ts` already expect a fuller API
(`/auth/*`, `/subjects`, `/lessons`, `/assignments`, `/summarize`, `/users/me`, `/stats`,
`/team`) — that's groundwork for later, not something to make work right now unless the user
asks to wire up a specific piece.

## Repo layout

```
studysync/
├── backend/                  # Hono API, port 4000 by default
│   └── src/
│       ├── app.ts            # hono app, cors, routes (/health, /api/lessons)
│       ├── db.ts             # SQLite (node:sqlite), lessons table
│       ├── routes/lessons.ts # POST /api/lessons, /:id/chunks, /:id/finish; GET /api/lessons[/:id]
│       ├── services/         # transcribe.ts (ffmpeg + whisper.cpp), summarize.ts (Ollama)
│       └── index.ts          # entrypoint — reads PORT, starts the server
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
└── AGENTS.md                  # this file
```

## Running it locally

One-time setup for the `/dashboard/demo` pipeline: `brew install ffmpeg whisper-cpp ollama`,
`ollama pull llama3.2:3b`, and download `ggml-tiny.en.bin` into `backend/models/` (see
`backend/.env.example` for the env vars). Start Ollama (`ollama serve`) before using `/dashboard/demo`.
`/dashboard` is the static mock (it has a "Try the live demo" button) and `/dashboard/demo` is the real pipeline; keep both.

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev                  # http://localhost:4000

# Frontend
cd frontend
cp .env.example .env.local   # if present
npm install
npm run dev                  # http://localhost:3000
```

There's no database yet, so pages that depend on persisted data (auth, saved lessons,
assignments, etc.) won't fully function until those routes and a DB are added. That's
expected right now; focus is on layout, components, and visual design, adding backend pieces
only as needed.

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
  regardless, so this is UX only. (Both of these assume a backend that isn't currently running
  — see above.)

## What's not implemented yet

- No database or Docker setup — `backend/` is a bare Express server with a `/health` route
  only; no auth, no Prisma, no persistence. Add these incrementally as the UI needs them.
- No automated test suite (unit/integration/e2e).
- No password reset / email verification flow.
- Audio is captured client-side but discarded on save (never uploaded) — add an upload step
  and object storage if you want playback of past recordings later.
