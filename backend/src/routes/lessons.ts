import { Hono } from "hono";
import db, { type LessonRow, type SegmentRow } from "../db.js";
import { summarize } from "../services/summarize.js";
import { transcribe } from "../services/transcribe.js";

const lessons = new Hono();

function findLesson(id: number) {
  return db.prepare("SELECT * FROM lessons WHERE id = ?").get(id) as unknown as LessonRow | undefined;
}

function findSegments(id: number) {
  return db
    .prepare("SELECT seq, start_sec, text FROM segments WHERE lesson_id = ? ORDER BY seq")
    .all(id) as unknown as SegmentRow[];
}

function serialize(row: LessonRow, withSegments = true) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    stage: row.stage,
    transcript: row.transcript,
    segments: withSegments ? findSegments(row.id).map((s) => ({ start: s.start_sec, text: s.text })) : [],
    summary: row.summary ? JSON.parse(row.summary) : null,
    error: row.error,
    createdAt: row.created_at,
  };
}

// Whisper and the LLM are heavy; run one job at a time, in the order they arrive.
let queue: Promise<void> = Promise.resolve();
function enqueue(job: () => Promise<void>) {
  queue = queue.then(job);
}

// Whisper marks silence/noise with tags like [BLANK_AUDIO] or (music); drop those.
function cleanText(text: string) {
  const cleaned = text.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
  return /^\(.*\)$/.test(cleaned) ? "" : cleaned;
}

async function transcribeChunk(lessonId: number, seq: number, start: number, audio: Buffer) {
  try {
    const text = cleanText(await transcribe(audio));
    if (text) {
      db.prepare("INSERT INTO segments (lesson_id, seq, start_sec, text) VALUES (?, ?, ?, ?)").run(
        lessonId,
        seq,
        start,
        text
      );
    }
  } catch (err) {
    // Non-fatal: surfaced to the UI, and used as the reason if nothing could be transcribed at all.
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Lesson ${lessonId} chunk ${seq} failed:`, message);
    db.prepare("UPDATE lessons SET error = ? WHERE id = ?").run(message, lessonId);
  }
}

async function summarizeLesson(id: number) {
  try {
    const transcript = findSegments(id)
      .map((s) => s.text)
      .join(" ");
    if (!transcript) throw new Error(findLesson(id)?.error ?? "No speech was detected in the recording");

    db.prepare("UPDATE lessons SET transcript = ?, stage = 'summarizing' WHERE id = ?").run(transcript, id);
    const summary = await summarize(transcript);

    db.prepare("UPDATE lessons SET summary = ?, status = 'done', stage = NULL, error = NULL WHERE id = ?").run(
      JSON.stringify(summary),
      id
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Lesson ${id} failed:`, message);
    db.prepare("UPDATE lessons SET status = 'error', stage = NULL, error = ? WHERE id = ?").run(message, id);
  }
}

// Start a lesson; the browser then sends short audio chunks while recording.
lessons.post("/", (c) => {
  const { lastInsertRowid } = db
    .prepare("INSERT INTO lessons (title, status) VALUES ('Untitled lecture', 'recording')")
    .run();
  return c.json({ id: Number(lastInsertRowid) }, 201);
});

lessons.post("/:id/chunks", async (c) => {
  const id = Number(c.req.param("id"));
  const lesson = findLesson(id);
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);
  if (lesson.status !== "recording") return c.json({ error: "Lesson is no longer recording" }, 409);

  const form = await c.req.parseBody();
  const audio = form["audio"];
  const seq = Number(form["seq"]);
  const start = Number(form["start"]);
  if (!(audio instanceof File) || audio.size === 0 || !Number.isInteger(seq) || !Number.isFinite(start)) {
    return c.json({ error: "Send multipart fields 'audio', 'seq' and 'start'" }, 400);
  }

  const buffer = Buffer.from(await audio.arrayBuffer());
  enqueue(() => transcribeChunk(id, seq, Math.max(0, Math.floor(start)), buffer));
  return c.json({ ok: true }, 202);
});

// Queued after the pending chunks, so it always sees the full transcript.
lessons.post("/:id/finish", (c) => {
  const id = Number(c.req.param("id"));
  const lesson = findLesson(id);
  if (!lesson) return c.json({ error: "Lesson not found" }, 404);
  if (lesson.status !== "recording") return c.json({ error: "Lesson already finished" }, 409);

  db.prepare("UPDATE lessons SET status = 'processing', stage = 'transcribing' WHERE id = ?").run(id);
  enqueue(() => summarizeLesson(id));
  return c.json({ ok: true });
});

lessons.get("/", (c) => {
  const rows = db.prepare("SELECT * FROM lessons ORDER BY id DESC").all() as unknown as LessonRow[];
  return c.json(rows.map((row) => serialize(row, false)));
});

lessons.get("/:id", (c) => {
  const row = findLesson(Number(c.req.param("id")));
  if (!row) return c.json({ error: "Lesson not found" }, 404);
  return c.json(serialize(row));
});

export default lessons;
