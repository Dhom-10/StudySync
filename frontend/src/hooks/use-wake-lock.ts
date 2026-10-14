"use client";

import { useEffect, useRef } from "react";

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let cancelled = false;

    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (cancelled) {
          lock.release().catch(() => {});
        } else {
          lockRef.current = lock;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
