export type Role = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  notifyEnabled: boolean;
  createdAt: string;
  hasApiKey: boolean;
}

export interface LessonSummary {
  topics: string[];
  keyPoints: string[];
  assignments: { title: string; dueDate: string | null }[];
  tasks: string[];
  studyTip: string;
}

export interface Lesson {
  id: number;
  title: string;
  status: "recording" | "processing" | "done" | "error";
  stage: "transcribing" | "summarizing" | null;
  transcript: string | null;
  segments: { start: number; text: string }[];
  summary: LessonSummary | null;
  error: string | null;
  createdAt: string;
}
