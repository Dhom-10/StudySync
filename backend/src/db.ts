import { DatabaseSync } from "node:sqlite";

export type LessonStatus = "recording" | "processing" | "done" | "error";
export type LessonStage = "transcribing" | "summarizing" | null;

export interface LessonRow {
  id: number;
  title: string;
  status: LessonStatus;
  stage: LessonStage;
  transcript: string | null;
  summary: string | null; // JSON, see services/summarize.ts
  error: string | null;
  created_at: string;
}

export interface SegmentRow {
  seq: number;
  start_sec: number;
  text: string;
}

const db = new DatabaseSync(process.env.DB_PATH ?? "./studysync.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    stage TEXT,
    transcript TEXT,
    summary TEXT,
    error TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    seq INTEGER NOT NULL,
    start_sec INTEGER NOT NULL,
    text TEXT NOT NULL
  )
`);

// Failed sessions are not kept. A restart in the middle of a recording or processing would leave a lesson
// stuck forever, so those are discarded too (their transcript lines go with them).
db.exec(`
  DELETE FROM segments WHERE lesson_id IN (SELECT id FROM lessons WHERE status IN ('error', 'recording', 'processing'));
  DELETE FROM lessons WHERE status IN ('error', 'recording', 'processing');
`);

export default db;
