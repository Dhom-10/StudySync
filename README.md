# StudySync

Record a class, get a live transcript in the browser, and send it to Claude for a
plain-language summary — tasks, topics, key points, assignments with due dates, and study
tips — saved to your account so it's there on any device.

This is a full-stack rebuild of an earlier single-file prototype. For architecture details,
conventions, and deeper "why" notes, see [`AGENTS.md`](./AGENTS.md). This README is just to
get it running.

## Stack

- **Frontend** — Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + React Query
- **Backend** — Node.js + Express + TypeScript + Prisma
- **Database** — PostgreSQL (via Docker)
- **AI** — Anthropic Claude, called server-side only

Audio recording and live transcription (MediaRecorder + Web Speech API) happen entirely in
the browser. Only the transcript text is ever sent to the backend — audio is never uploaded.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Postgres)
- An [Anthropic API key](https://console.anthropic.com/settings/keys) — either set one
  server-wide (step 2 below) or add your own later in the app's Settings page

## 1. Start the database

From the repo root:

```bash
cp .env.example .env
docker compose up -d postgres
```

This starts Postgres in the background. Leave it running — you only need to do this once per
machine reboot (`docker compose up -d postgres` again if it's stopped).

> Want a GUI for the database? `docker compose --profile tools up -d` also starts pgAdmin at
> [localhost:5050](http://localhost:5050) (login: `admin@studysync.local` / `admin`).

## 2. Start the backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and, at minimum, set `JWT_SECRET` and `API_KEY_ENCRYPTION_SECRET` to any
random strings (they just need to be non-trivial for local dev — see comments in the file).
Optionally set `ANTHROPIC_API_KEY` if you want a shared fallback key for the whole team, so
nobody has to add their own in Settings to test summaries.

```bash
npm install
npx prisma migrate dev     # creates the database tables
npm run seed                # optional: adds demo accounts + a sample lesson
npm run dev                 # http://localhost:4000
```

The seed script creates two accounts (password for both: `password123`):

| Email                    | Role    |
| ------------------------- | ------- |
| `admin@studysync.dev`     | admin   |
| `student@studysync.dev`   | student |

## 3. Start the frontend

In a new terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the login page. Sign up
for a new account (the very first account created overall becomes admin) or use one of the
seeded accounts above.

## Everyday commands

Run these from `backend/` or `frontend/` respectively:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (backend :4000, frontend :3000) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` *(backend)* | TypeScript check with no build output |
| `npx prisma studio` *(backend)* | Browse/edit the database in a GUI |
| `npx prisma migrate dev` *(backend)* | Apply schema changes after editing `prisma/schema.prisma` |

## Troubleshooting

- **"Can't reach database server"** — Postgres isn't running. Run `docker compose up -d postgres`
  from the repo root and check `docker ps`.
- **Login works but every page redirects back to `/login`** — check that
  `frontend/.env.local`'s `AUTH_COOKIE_NAME` matches `backend/.env`'s `COOKIE_NAME` (both
  default to `studysync_token`, so this usually only breaks if one was edited).
- **Summaries fail with "No Anthropic API key configured"** — either set `ANTHROPIC_API_KEY`
  in `backend/.env` and restart the backend, or add a personal key in the app's Settings page.
- **Live transcription doesn't appear while recording** — the Web Speech API is only
  supported in Chromium-based browsers (Chrome, Edge) and Safari; Firefox isn't supported.
  Audio recording still works everywhere — type the transcript manually after stopping.

## Project layout

```
studysync/
├── backend/     # Express API — see backend/src/routes for endpoints
├── frontend/    # Next.js app — see frontend/src/app for pages
├── docker-compose.yml
└── AGENTS.md    # architecture, conventions, and design decisions
```
