"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const COMMA_PAUSE_MS = 200;
const SENTENCE_PAUSE_MS = 380;

/**
 * When each word should start, in ms: a word holds the next one back by `speed` ms per character,
 * plus a short pause after commas and a longer one after full stops.
 */
export function writingDelays(words: string[], speed = 30, startDelay = 0) {
  const delays: number[] = [];
  let at = startDelay;
  for (const word of words) {
    delays.push(at);
    at += word.length * speed;
    if (/[.!?…]["')\]]?$/.test(word)) at += SENTENCE_PAUSE_MS;
    else if (/[,;:]["')\]]?$/.test(word)) at += COMMA_PAUSE_MS;
  }
  return delays;
}

/** One word (or any inline content) that rises into place after `delay` ms. */
export function WritingWord({
  delay,
  duration,
  className,
  children,
}: {
  delay: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn("writing-text-word inline-block", className)}
      style={
        {
          "--writing-text-delay": `${delay}ms`,
          ...(duration ? { "--writing-text-duration": `${duration}ms` } : {}),
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
}

/** Starts (and keeps running) once the element is visible; with "mount" it is always started. */
function useStarted<T extends HTMLElement>(trigger: "mount" | "view") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (trigger !== "view" || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [trigger]);
  return { ref, started: trigger === "mount" || seen };
}

/**
 * Wrapper for headings built from `WritingWord`s (e.g. a headline with a highlight or strike-through).
 * With the default "view" trigger the words wait until the heading scrolls into view.
 */
export function WritingGroup({
  trigger = "view",
  className,
  children,
}: {
  trigger?: "mount" | "view";
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, started } = useStarted<HTMLDivElement>(trigger);
  return (
    <div ref={ref} data-writing-paused={started ? undefined : ""} className={className}>
      {children}
    </div>
  );
}

/** Text revealed one word at a time, each word rising softly into place. Plays once. */
export function WritingText({
  text,
  duration = 1000,
  speed = 30,
  trigger = "view",
  onComplete,
  className,
}: {
  text: string;
  duration?: number;
  speed?: number;
  trigger?: "mount" | "view";
  onComplete?: () => void;
  className?: string;
}) {
  const lines = text.split("\n").map((line) => line.split(/\s+/).filter(Boolean));
  const delays = writingDelays(lines.flat(), speed);
  const { ref, started } = useStarted<HTMLSpanElement>(trigger);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  const totalMs = (delays[delays.length - 1] ?? 0) + duration;
  useEffect(() => {
    if (!started) return;
    const id = setTimeout(() => onCompleteRef.current?.(), totalMs);
    return () => clearTimeout(id);
  }, [started, totalMs]);

  let index = 0;
  return (
    <span
      ref={ref}
      aria-label={text}
      data-writing-paused={started ? undefined : ""}
      className={className}
      style={{ "--writing-text-duration": `${duration}ms` } as React.CSSProperties}
    >
      <span aria-hidden="true">
        {lines.map((words, li) => (
          <span key={li}>
            {li > 0 && <br />}
            {words.map((word, wi) => (
              <span key={wi}>
                {wi > 0 && " "}
                <WritingWord delay={delays[index++]}>{word}</WritingWord>
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
