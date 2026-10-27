"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const FADE_PX = 28;

/**
 * A scrollable area whose top and bottom edges fade out, but only on the sides that actually have more
 * content to scroll to (so nothing is faded when there is nothing hidden). With `follow`, it keeps the
 * newest content in view as it grows, unless the user has scrolled up to read earlier content.
 */
export function ScrollFade({
  children,
  className,
  follow = false,
  watch,
}: {
  children: React.ReactNode;
  className?: string;
  follow?: boolean;
  /** Anything that changes when the content changes; triggers following and re-measuring. */
  watch?: unknown;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = fromBottom < 120;
    const top = el.scrollTop > 4;
    const bottom = fromBottom > 4;
    setEdges((prev) =>
      prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
    );
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (follow && nearBottomRef.current)
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [watch, follow, measure]);

  const stops = [
    edges.top ? `transparent 0, black ${FADE_PX}px` : "black 0",
    edges.bottom
      ? `black calc(100% - ${FADE_PX}px), transparent 100%`
      : "black 100%",
  ].join(", ");
  const mask = `linear-gradient(to bottom, ${stops})`;

  return (
    <div
      ref={scrollRef}
      onScroll={measure}
      className={cn("overflow-y-auto", className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
