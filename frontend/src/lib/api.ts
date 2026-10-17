import type { User } from "./types";

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

const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });

export const authApi = {
  login: (data: { email: string; password: string }) => post<{ user: User }>("/auth/login", data),
};
