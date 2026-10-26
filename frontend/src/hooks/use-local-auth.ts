"use client";

import { useCallback, useSyncExternalStore } from "react";

// Temporary stand-in for real auth: a flag in localStorage, until the backend has sessions.
const KEY = "studysync_logged_in";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function setLoggedIn(value: boolean) {
  if (value) localStorage.setItem(KEY, "1");
  else localStorage.removeItem(KEY);
  listeners.forEach((cb) => cb());
}

// "loading" on the server / first client render, so pages don't flash the wrong state.
export function useLocalAuth() {
  const status = useSyncExternalStore<"loading" | "in" | "out">(
    subscribe,
    () => (localStorage.getItem(KEY) ? "in" : "out"),
    () => "loading"
  );
  const login = useCallback(() => setLoggedIn(true), []);
  const logout = useCallback(() => setLoggedIn(false), []);
  return { status, login, logout };
}
