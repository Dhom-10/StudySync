"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import {
  SummaryStream,
  summaryRevealMs,
  type SummaryData,
} from "@/components/summary-stream";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WritingText } from "@/components/ui/writing-text";
import { ShimmeringText } from "@/components/ui/shimmering-text";

// A looping, fake lecture so visitors can see the whole flow without recording anything.

const SUMMARY: SummaryData = {
  topics: ["Photosynthesis", "Light reactions", "Calvin cycle"],
  keyPoints: [
    "Light reactions split water and make ATP and NADPH.",
    "The Calvin cycle uses both to build sugar.",
  ],
  assignments: [
    { title: "Lab report", dueDate: null, dueLabel: "Due Fri, Oct 16" },
  ],
  tasks: ["Review chapter 8 before the quiz"],
  studyTip:
    "Sketch the two stages side by side and label what goes in and what comes out.",
};

type Part = { text: string; mark?: boolean };
const LINES: Part[][] = [
  [
    {
      text: "So the light reactions happen in the thylakoid membrane. That is where water gets split.",
    },
  ],
  [{ text: "The Calvin cycle then uses that ATP and NADPH to build sugar." }],
  [
    { text: "Quick reminder: " },
    { text: "the lab report is due next Friday", mark: true },
    { text: ", and chapter 8 is on the quiz." },
  ],
];

// Each transcript line is split into words; `mark` words get the yellow highlight.
interface Token {
  word: string;
  mark: boolean;
}
const TOKENS: Token[][] = LINES.map((parts) => {
  const full = parts.map((p) => p.text).join("");
  const marked: [number, number][] = [];
  let at = 0;
  for (const part of parts) {
    if (part.mark) marked.push([at, at + part.text.length]);
    at += part.text.length;
  }
  return [...full.matchAll(/\S+/g)].map((m) => ({
    word: m[0],
    mark: marked.some(
      ([from, to]) => m.index < to && m.index + m[0].length > from,
    ),
  }));
});

// Timeline of one loop, in milliseconds.
const WORD_MS = 210; // roughly speaking pace
const LINE_GAP = 600;
const START_DELAY = 500;
const LINE_STARTS = TOKENS.reduce<number[]>((acc, tokens, i) => {
  acc.push(
    i === 0
      ? START_DELAY
      : acc[i - 1] + TOKENS[i - 1].length * WORD_MS + LINE_GAP,
  );
  return acc;
}, []);
const T_REC_END =
  LINE_STARTS[TOKENS.length - 1] +
  TOKENS[TOKENS.length - 1].length * WORD_MS +
  900;
const T_THINK_END = T_REC_END + 1800;
const T_SUMMARY_END = T_THINK_END + summaryRevealMs(SUMMARY) + 300;
const T_LOOP_END = T_SUMMARY_END + 5500;
const TICK_MS = 50;
const LECTURE_START_SECONDS = 24 * 60; // the clock reads like we're 24 minutes into the lecture

const BAR_COUNT = 44;

function clock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function subscribeReducedMotion(cb: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", cb);
  return () => query.removeEventListener("change", cb);
}

function Transcript({
  visibleWords,
  animate,
}: {
  visibleWords: (line: number) => number;
  animate: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 text-lg leading-snug sm:text-xl">
      {TOKENS.map((tokens, li) => {
        const shown = tokens.slice(0, visibleWords(li));
        if (shown.length === 0) return null;
        return (
          <div key={li} className="flex gap-4">
            <span className="pt-1 font-mono text-sm text-muted-foreground">
              {clock(
                LECTURE_START_SECONDS + Math.floor(LINE_STARTS[li] / 1000),
              )}
            </span>
            <span>
              {shown.map((tok, i) => {
                const word = (
                  <span
                    className={cn(
                      "inline-block",
                      animate && "writing-text-word",
                    )}
                    style={
                      {
                        "--writing-text-duration": "450ms",
                      } as React.CSSProperties
                    }
                  >
                    {tok.word}
                  </span>
                );
                const prev = shown[i - 1];
                return (
                  <span key={i}>
                    {/* the space between two highlighted words is highlighted too, so the marker reads as one band */}
                    {prev &&
                      (prev.mark && tok.mark ? (
                        <mark className="bg-highlight"> </mark>
                      ) : (
                        " "
                      ))}
                    {tok.mark ? (
                      <mark className="rounded-[3px] bg-highlight px-0.5 text-foreground">
                        {word}
                      </mark>
                    ) : (
                      word
                    )}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LiveDemoWindow() {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Only run while the window is actually visible, and start from the beginning the first time it is.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!onScreen || reduced) return;
    const id = setInterval(
      () => setElapsed((t) => (t + TICK_MS >= T_LOOP_END ? 0 : t + TICK_MS)),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [onScreen, reduced]);

  const t = reduced ? T_SUMMARY_END : elapsed;
  const phase =
    t < T_REC_END
      ? "recording"
      : t < T_THINK_END
        ? "thinking"
        : t < T_SUMMARY_END
          ? "summarizing"
          : "done";
  const recording = phase === "recording";
  const visibleWords = (line: number) => {
    if (phase !== "recording") return TOKENS[line].length;
    return t < LINE_STARTS[line]
      ? 0
      : Math.floor((t - LINE_STARTS[line]) / WORD_MS) + 1;
  };
  const stopSeconds =
    LECTURE_START_SECONDS + Math.floor(Math.min(t, T_REC_END) / 1000);

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-[22px] border border-foreground/10 bg-card shadow-[0_12px_0_var(--highlight)]"
    >
      <div className="flex items-center gap-5 border-b border-foreground/10 px-6 py-4">
        <div className="flex gap-2">
          <span className="size-5 rounded-full border-2 border-foreground" />
          <span className="size-5 rounded-full border-2 border-foreground" />
          <span className="size-5 rounded-full border-2 border-foreground" />
        </div>
        <span className="label-mono text-sm normal-case tracking-normal text-foreground">
          StudySync · Biology 201, Lecture 9
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col gap-5 border-b border-foreground/10 p-6 sm:p-9 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xl font-bold">
              <span
                className={cn(
                  "size-4 rounded-full",
                  recording
                    ? "animate-pulse bg-destructive"
                    : "bg-muted-foreground/40",
                )}
              />
              {recording ? (
                "Recording"
              ) : phase === "done" ? (
                "Done"
              ) : (
                <ShimmeringText text="Processing" />
              )}
            </div>
            <b className="font-mono text-xl font-medium">
              {clock(stopSeconds)}
            </b>
          </div>

          <div
            className={cn(
              "flex h-[72px] items-center gap-1 transition-opacity",
              !recording && "opacity-35",
            )}
            aria-hidden="true"
          >
            {Array.from({ length: BAR_COUNT }, (_, i) => {
              const wave = recording
                ? 0.35 +
                  0.65 *
                    Math.abs(Math.sin(t / 230 + i * 0.8)) *
                    Math.abs(Math.cos(t / 700 + i * 0.35))
                : 0.12;
              return (
                <span
                  key={i}
                  className="w-1 rounded-sm bg-foreground transition-[height] duration-100"
                  style={{ height: Math.round(6 + wave * 60) }}
                />
              );
            })}
          </div>

          <h3 className="label-mono">Live transcript</h3>
          {/* An invisible full copy reserves the height, so the window doesn't jump while the text types in. */}
          <div className="grid">
            <div
              className="invisible col-start-1 row-start-1"
              aria-hidden="true"
            >
              <Transcript
                visibleWords={(line) => TOKENS[line].length}
                animate={false}
              />
            </div>
            <div className="col-start-1 row-start-1">
              <Transcript visibleWords={visibleWords} animate />
            </div>
          </div>

          <div className="mt-auto flex min-h-12 flex-wrap items-center gap-3 pt-2">
            {recording ? (
              <>
                <Button
                  variant="outline"
                  className="h-12 gap-2.5 px-6 text-base"
                  onClick={() => setElapsed(T_REC_END)}
                >
                  <span className="size-3 bg-foreground" /> Stop
                </Button>
                <p role="status" className="text-lg font-medium">
                  <ShimmeringText text="Transcribing…" />
                </p>
              </>
            ) : phase === "done" ? (
              <Button
                className="h-12 px-6 text-base"
                onClick={() => setElapsed(0)}
              >
                Record again
              </Button>
            ) : (
              <p role="status" className="text-lg font-medium">
                <ShimmeringText
                  text={phase === "thinking" ? "Thinking…" : "Summarizing…"}
                />
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6 sm:p-9">
          <div className="flex items-baseline justify-between">
            <b className="font-display text-4xl font-extrabold tracking-[-0.02em]">
              <WritingText text="Summary" />
            </b>
            <span
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-opacity",
                phase === "done" ? "opacity-100" : "opacity-0",
              )}
            >
              <Check className="size-4" /> Saved to your account
            </span>
          </div>
          <div className="grid">
            <div
              className="invisible col-start-1 row-start-1"
              aria-hidden="true"
            >
              <SummaryStream summary={SUMMARY} size="lg" />
            </div>
            <div className="col-start-1 row-start-1">
              {phase === "summarizing" || phase === "done" ? (
                <SummaryStream summary={SUMMARY} animate size="lg" />
              ) : (
                <p className="text-lg text-muted-foreground">
                  Your summary appears here when you stop.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
