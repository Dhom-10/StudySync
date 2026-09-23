"use client";

import { useEffect, useRef } from "react";

/** Requests a screen wake lock while `active` is true. Silently no-ops where unsupported. */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let cancelled = false;

    async function requestLock() {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        lockRef.current = lock;
      } catch {
        // Permission denied, not visible tab, etc. — recording continues regardless.
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible" && active && !lockRef.current) {
        requestLock();
      }
    }

    requestLock();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
