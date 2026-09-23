export type Role = "student" | "admin";
export type AssignmentSource = "lesson" | "manual";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  notifyEnabled: boolean;
  createdAt: string;
  hasApiKey: boolean;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  lessonCount: number;
}

export interface Task {
  id: string;
  lessonId: string;
  text: string;
  done: boolean;
}

export interface Summary {
  id: string;
  lessonId: string;
  suggestedTitle: string;
  topics: string[];
  keyPoints: string[];
  studyTips: string[];
  dates: string[];
  createdAt: string;
}

export interface Lesson {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  durationSec: number;
  transcript: string;
  createdAt: string;
  updatedAt: string;
  subject: Subject | null;
  summary: Summary | null;
  tasks: Task[];
}

export interface Assignment {
  id: string;
  userId: string;
  lessonId: string | null;
  text: string;
  dueDate: string | null;
  dueTime: string | null;
  done: boolean;
  source: AssignmentSource;
  createdAt: string;
  lesson?: { id: string; title: string; subjectId: string | null } | null;
}

export interface AiSummaryResult {
  suggestedTitle: string;
  tasks: string[];
  topics: string[];
  assignments: { text: string; dueDate: string | null; dueTime: string | null }[];
  keyPoints: string[];
  dates: string[];
  studyTips: string[];
}

export interface Stats {
  totalLessons: number;
  totalSubjects: number;
  hoursRecorded: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  lessonsBySubject: { subjectId: string | null; name: string; color: string; count: number }[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lessonCount: number;
  hoursRecorded: number;
  completionRate: number;
  lessons: {
    id: string;
    title: string;
    durationSec: number;
    createdAt: string;
    subject: { id: string; name: string; color: string } | null;
  }[];
}
