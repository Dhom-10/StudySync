import type {
  AiSummaryResult,
  Assignment,
  AssignmentSource,
  Lesson,
  Stats,
  Subject,
  TeamMember,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (body && typeof body === "object" && "error" in body && String(body.error)) || res.statusText;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });
const patch = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined });
const put = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined });
const del = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "DELETE", body: data !== undefined ? JSON.stringify(data) : undefined });

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    post<{ user: User }>("/auth/signup", data),
  login: (data: { email: string; password: string }) => post<{ user: User }>("/auth/login", data),
  logout: () => post<void>("/auth/logout"),
  me: () => get<{ user: User }>("/auth/me"),
};

export const subjectsApi = {
  list: () => get<{ subjects: Subject[] }>("/subjects"),
  create: (data: { name: string; color: string }) => post<{ subject: Subject }>("/subjects", data),
  update: (id: string, data: Partial<{ name: string; color: string }>) =>
    patch<{ subject: Subject }>(`/subjects/${id}`, data),
  remove: (id: string) => del<void>(`/subjects/${id}`),
};

export interface CreateLessonInput {
  title: string;
  subjectId?: string | null;
  durationSec: number;
  transcript: string;
  summary?: {
    suggestedTitle: string;
    topics: string[];
    keyPoints: string[];
    studyTips: string[];
    dates: string[];
  };
  tasks?: string[];
  assignments?: { text: string; dueDate: string | null; dueTime: string | null }[];
}

export const lessonsApi = {
  list: (subjectId?: string) =>
    get<{ lessons: Lesson[] }>(`/lessons${subjectId ? `?subjectId=${subjectId}` : ""}`),
  get: (id: string) => get<{ lesson: Lesson }>(`/lessons/${id}`),
  create: (data: CreateLessonInput) => post<{ lesson: Lesson }>("/lessons", data),
  update: (id: string, data: Partial<{ title: string; subjectId: string | null }>) =>
    patch<{ lesson: Lesson }>(`/lessons/${id}`, data),
  remove: (id: string) => del<void>(`/lessons/${id}`),
  toggleTask: (lessonId: string, taskId: string, done: boolean) =>
    patch<{ task: Lesson["tasks"][number] }>(`/lessons/${lessonId}/tasks/${taskId}`, { done }),
};

export const assignmentsApi = {
  list: () => get<{ assignments: Assignment[] }>("/assignments"),
  create: (data: { text: string; dueDate?: string | null; dueTime?: string | null; lessonId?: string | null }) =>
    post<{ assignment: Assignment }>("/assignments", data),
  update: (
    id: string,
    data: Partial<{ text: string; dueDate: string | null; dueTime: string | null; done: boolean }>
  ) => patch<{ assignment: Assignment }>(`/assignments/${id}`, data),
  remove: (id: string) => del<void>(`/assignments/${id}`),
};

export const summarizeApi = {
  run: (data: { transcript: string; subjectId?: string | null }) =>
    post<{ summary: AiSummaryResult }>("/summarize", data),
};

export const usersApi = {
  updateProfile: (data: Partial<{ name: string; notifyEnabled: boolean }>) =>
    patch<{ user: User }>("/users/me", data),
  setApiKey: (apiKey: string) => put<{ hasApiKey: boolean }>("/users/me/api-key", { apiKey }),
  clearApiKey: () => del<{ hasApiKey: boolean }>("/users/me/api-key"),
  resetData: () => del<void>("/users/me/data", { confirm: "RESET" }),
};

export const statsApi = {
  get: () => get<Stats>("/stats"),
};

export const teamApi = {
  list: () => get<{ team: TeamMember[] }>("/team"),
};

export type { AssignmentSource };
