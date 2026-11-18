# StudySync: test report and checklist

Owner: Abdulrahman Nasser (QA, Docs and Booth)
Last update: November 17, 2026
Code tested: `main` at commit `83b368b` (October 28, 2026)

This file has three parts:

1. What I tested and the results
2. The bug list (most important first)
3. A manual checklist anyone can run before a demo

## Summary

| Bug | Priority | Owner (from the work plan) | Status |
| --- | --- | --- | --- |
| B1 Long lectures cut at ~28 min | High | Tram (AI and Recording) | Open |
| B2 Failed session deleted | High | Allen (Backend) | Open |
| B3 No warning when leaving during a recording | Medium | Juan (Frontend) | Open |
| B4 Due dates only 2 weeks ahead | Medium | Tram (AI and Recording) | Open |
| B5 No real accounts | Medium | Allen (Backend) | Open |
| B6 Backend lint broken | Low | Allen (Backend) | Open |
| B7 `npm audit` issues | Low | Juan (Frontend) | Open |
| B8 Build needs internet for fonts | Low | Juan (Frontend) | Open (booth risk, see booth plan) |
| B9 README out of date | Low | Abdulrahman (Docs) | ✅ Fixed in this pull request |
| B10 Memory growth | Low | Allen (Backend) | Open |

---

## 1. What I tested

| Check | Result | Notes |
| --- | --- | --- |
| Backend installs (`npm install`) | ✅ Pass | |
| Backend type check (`tsc --noEmit`) | ✅ Pass | No type errors |
| Backend lint (`npm run lint`) | ❌ Fail | No ESLint config and ESLint is not in `package.json` (see B6) |
| Frontend installs (`npm install`) | ✅ Pass | `npm audit` reports 14 issues (see B7) |
| Frontend type check (`tsc --noEmit`) | ✅ Pass | No type errors |
| Frontend lint (`npm run lint`) | ✅ Pass | No warnings |
| Frontend build (`npm run build`) | ⚠️ Needs internet | Fonts come from Google Fonts at build time (see B8) |
| `GET /health` | ✅ Pass | Returns `{"status":"ok"}` |
| Start a session (`POST /api/lessons`) | ✅ Pass | Returns a new id |
| Send an audio piece | ✅ Pass | Transcript line is saved with its time |
| Send a piece with missing fields | ✅ Pass | Clear 400 error |
| Send a piece to a session that does not exist | ✅ Pass | 404 "Lesson not found" |
| Finish a session | ✅ Pass | Summary is saved, title is made from the topics |
| Finish the same session twice | ✅ Pass | 409 "Lesson already finished" |
| Finish with no speech | ✅ Pass | Error "No speech was detected in the recording" |
| Delete a session | ✅ Pass | 204, then 404 when you open it |
| **1-hour lecture** (450 pieces) | ❌ Fail | Summary only reads the first ~28 minutes (see B1) |
| **Summary fails, then backend restarts** | ❌ Fail | The whole transcript is deleted (see B2) |

**How I tested the backend:** I ran the real backend with two stand-ins: a fake `whisper-cli`
that returns a fixed sentence, and a fake Ollama that reports how many characters it received.
This tests our code (routes, database, queue, limits) without needing a Mac and the AI models.
The speech and summary quality still need a test on a real Mac (part 3).

---

## 2. Bug list

I tested and wrote fix ideas; fixing is up to each owner. I have a tested fix ready for B1, B2, B3, B4, B6, B7 and B10 if an owner wants it, just ask.

Priority: **High** = can lose data or breaks a Sprint 3 goal. **Medium** = bad experience.
**Low** = cleanup.

### B1. Long lectures: the summary only reads the first ~28 minutes (High)

- **Where:** `backend/src/services/summarize.ts`, `MAX_TRANSCRIPT_CHARS = 24_000` and `num_ctx: 8192`
- **Steps:** Record (or simulate) a 1-hour lecture, then press Stop.
- **Expected:** The summary covers the whole hour.
- **Actual:** The transcript was 50,774 characters but the model only got the first 24,000.
  The last line it read was from minute 28. Anything said after that (often the homework at the
  end of class!) never reaches the summary. The user is not told.
- **Why it matters:** Sprint 3 goal is recordings up to 3 hours. A 3-hour lecture would lose
  about 85% of its content.
- **Fix idea:** Summarize in parts (for example every 20 minutes), then merge the parts into one
  summary. At the very least, show a warning when the transcript was cut.

### B2. A failed summary is deleted when the backend restarts (High)

- **Where:** `backend/src/db.ts` (startup cleanup) and `GET /api/lessons` in `routes/lessons.ts`
- **Steps:** Record a lecture. Ollama is off (or times out), so the summary fails. Restart the backend.
- **Expected:** The transcript is kept, and I can press "Summarize again" later.
- **Actual:** At startup the backend deletes every session with status `error`, `recording` or
  `processing`, together with all its transcript lines. A failed session is also hidden from the
  sidebar list right away, so the user can't find it to retry.
- **Why it matters:** Someone records a 1-hour class, the summary times out, they close the
  laptop. The whole class is gone.
- **Fix idea:** Never delete a session that has transcript lines. Show failed sessions in the
  sidebar with a "Summarize again" button.

### B3. Refreshing or closing the tab during a recording (Medium)

- **Where:** `frontend/src/hooks/use-audio-recorder.ts`, `app/dashboard/demo/page.tsx`
- **Problem:** There is no "Are you sure you want to leave?" warning while recording. A refresh
  stops the recording and the session stays in `recording`. Because of B2, the next backend
  restart deletes it.
- **Fix idea:** Add a `beforeunload` warning while recording.

### B4. Assignments due more than two weeks away get no date (Medium)

- **Where:** `upcomingDays()` in `summarize.ts` gives the model only the next 15 days.
- **Problem:** "The final project is due December 11" said in mid-November comes back with
  `dueDate: null`.
- **Fix idea:** Give a longer date list, or let the user add or edit the date by hand
  (that is also the "manual add" Sprint 3 goal).

### B5. No real accounts (Medium, Sprint 3 goal)

- Login is a `localStorage` flag. Everyone using the app sees all sessions, and lessons can't be
  opened on another device. `DELETE /api/lessons` clears every session with no login needed.

### B6. Backend `npm run lint` is broken (Low)

- `backend/package.json` has a `lint` script, but there is no `eslint.config.js` and ESLint is not
  a dependency. Either add a config or remove the script.

### B7. `npm audit`: 14 known issues in the frontend (Low)

- Most come from `shadcn` (a CLI tool) being in `dependencies` instead of `devDependencies`, which
  pulls in `systeminformation` (high). The open Dependabot pull request fixes `systeminformation`.
  Moving `shadcn` to `devDependencies` removes most of the rest.

### B8. The frontend build needs internet for fonts (Low, booth risk)

- `layout.tsx` uses `next/font/google` (Figtree, JetBrains Mono). `npm run build` fails with no
  internet. `npm run dev` still works, but text falls back to a default font.
- Before the booth, run the app once at home with internet, or switch to `next/font/local`.

### B9. The README doesn't match the code in a few places (Low)

- The README says pieces are "~8 s", but the recorder uses 4-second pieces
  (`SEGMENT_MS = 4000`) with a preview every 1.5 s.
- The README says Node 24. Node 22.23 also works (with an "experimental SQLite" warning).
- Leftover files from the old version: `proxy.ts` (checks a JWT cookie that no longer exists),
  `use-auth.ts`, `google-icon.tsx`.
- The README only explains setup on a Mac. See `SETUP-WINDOWS.md`.

- **Fixed in this pull request:** README updated (piece size, Node version, links to this file and the Windows guide).

### B10. Small memory growth on long runs (Low)

- `latestRequest` and `finalized` in `routes/lessons.ts` are never cleared after a session
  ends. This is fine for a demo but grows forever on a server that runs for weeks.

---

## 3. Manual checklist (run before every demo)

Run this on the demo laptop. Write ✅ or ❌ and a short note. Takes about 15 minutes.

### Setup

- [ ] `ollama serve` is running and `ollama list` shows `llama3.2:3b`
- [ ] `backend/models/ggml-small.en.bin` exists
- [ ] Backend starts with no errors on http://localhost:4000 (`/health` shows ok)
- [ ] Frontend starts on http://localhost:3000
- [ ] The microphone input is the laptop, not a phone (macOS Continuity)

### Pages

- [ ] `/` landing page loads, the live demo loop plays
- [ ] `/login`: "Log in" works and goes to the dashboard
- [ ] `/dashboard`: the static fallback screen shows, "Try the live demo" opens the demo
- [ ] Log out and back in works
- [ ] Phone size (Chrome DevTools, iPhone width): pages are readable, nothing cut off

### Recording

- [ ] Allow the microphone: recording starts, the timer counts, the waveform moves
- [ ] Block the microphone: a clear error message shows
- [ ] Say one sentence: it appears in the transcript within about 10 seconds
- [ ] Stop: "Summarizing…" shows, then the summary appears
- [ ] Say "The essay is due this Friday": it shows under Assignments with Friday's date
- [ ] Say "Please read chapter 8": it shows under Tasks
- [ ] Silence only: the message "No speech was detected" shows

### Sessions

- [ ] The new session appears in the sidebar with a readable title
- [ ] Open an old session: its transcript and summary show
- [ ] Delete a session: it disappears
- [ ] Stop the backend during a summary: the error shows and "Summarize again" works after restart

### Long recording (do once per sprint)

- [ ] 10 minutes: summary works, note the time it takes
- [ ] 30 minutes: summary works, note the time it takes
- [ ] 60 minutes: note what happens (expected to cut at ~28 min, see B1)

### Results log

| Date | Tester | Laptop | Passed | Failed | Notes |
| --- | --- | --- | --- | --- | --- |
| Nov 17 | Abdulrahman | (code tests, part 1) | 14 | 3 | B1, B2, B6 |
| | | | | | |
