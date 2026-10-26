"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { SummaryStream, streamLength, type SummaryData } from "@/components/summary-stream";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";

// A looping, fake lecture so visitors can see the whole flow without recording anything.

const SUMMARY: SummaryData = {
  topics: ["Photosynthesis", "Light reactions", "Calvin cycle"],
  keyPoints: [
    "Light reactions split water and make ATP and NADPH.",
    "The Calvin cycle uses both to build sugar.",
  ],
  assignments: [{ title: "Lab report", dueDate: null, dueLabel: "Due Fri, Oct 16" }],
  tasks: ["Review chapter 8 before the quiz"],
  studyTip: "Sketch the two stages side by side and label what goes in and what comes out.",
};

type Part = { text: string; mark?: boolean };
const LINES: Part[][] = [
  [{ text: "So the light reactions happen in the thylakoid membrane. That is where water gets split." }],
  [{ text: "The Calvin cycle then uses that ATP and NADPH to build sugar." }],
  [
    { text: "Quick reminder: " },
    { text: "the lab report is due next Friday", mark: true },
    { text: ", and chapter 8 is on the quiz." },
  ],
];

// Timeline of one loop, in milliseconds.
const CHAR_MS = 30; // typing speed of the transcript
const LINE_GAP = 650;
const START_DELAY = 500;
const lineLength = (line: Part[]) => line.reduce((n, p) => n + p.text.length, 0);
const LINE_STARTS = LINES.reduce<number[]>((acc, line, i) => {
  acc.push(i === 0 ? START_DELAY : acc[i - 1] + lineLength(LINES[i - 1]) * CHAR_MS + LINE_GAP);
  return acc;
}, []);
const T_REC_END = LINE_STARTS[LINES.length - 1] + lineLength(LINES[LINES.length - 1]) * CHAR_MS + 900;
const T_THINK_END = T_REC_END + 1800;
const SUMMARY_CPS = 60;
const T_SUMMARY_END = T_THINK_END + (streamLength(SUMMARY) * 1000) / SUMMARY_CPS;
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

function Transcript({ visibleChars }: { visibleChars: (line: number) => number }) {
  return (
    <div className="flex flex-col gap-4 text-lg leading-snug sm:text-xl">
      {LINES.map((parts, li) => {
        let remaining = visibleChars(li);
        if (remaining <= 0) return null;
        const typing = remaining < lineLength(parts);
        return (
          <div key={li} className="flex gap-4">
            <span className="pt-1 font-mono text-sm text-muted-foreground">
              {clock(LECTURE_START_SECONDS + Math.floor(LINE_STARTS[li] / 1000))}
            </span>
            <span>
              {parts.map((part, pi) => {
                const text = part.text.slice(0, Math.max(0, remaining));
                remaining -= part.text.length;
                if (!text) return null;
                return part.mark ? (
                  <mark key={pi} className="rounded-[3px] bg-highlight px-1.5 text-foreground">
                    {text}
                  </mark>
                ) : (
                  <span key={pi}>{text}</span>
                );
              })}
              {typing && <span aria-hidden="true" className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-foreground" />}
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
    () => false
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Only run while the window is actually visible, and start from the beginning the first time it is.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!onScreen || reduced) return;
    const id = setInterval(() => setElapsed((t) => (t + TICK_MS >= T_LOOP_END ? 0 : t + TICK_MS)), TICK_MS);
    return () => clearInterval(id);
  }, [onScreen, reduced]);

  const t = reduced ? T_SUMMARY_END : elapsed;
  const phase = t < T_REC_END ? "recording" : t < T_THINK_END ? "thinking" : t < T_SUMMARY_END ? "summarizing" : "done";
  const recording = phase === "recording";
  const summaryProgress = phase === "done" ? Infinity : Math.max(0, ((t - T_THINK_END) * SUMMARY_CPS) / 1000);

  const visibleChars = (line: number) => {
    const typed = Math.floor((t - LINE_STARTS[line]) / CHAR_MS);
    return phase === "recording" ? typed : typed < 0 ? 0 : lineLength(LINES[line]);
  };
  const stopSeconds = LECTURE_START_SECONDS + Math.floor(Math.min(t, T_REC_END) / 1000);

  return (
    <div
      ref={rootRef}
      id="how-it-works"
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
              <span className={cn("size-4 rounded-full", recording ? "animate-pulse bg-destructive" : "bg-muted-foreground/40")} />
              {recording ? "Recording" : phase === "done" ? "Done" : "Processing"}
            </div>
            <b className="font-mono text-xl font-medium">{clock(stopSeconds)}</b>
          </div>

          <div className={cn("flex h-[72px] items-center gap-1 transition-opacity", !recording && "opacity-35")} aria-hidden="true">
            {Array.from({ length: BAR_COUNT }, (_, i) => {
              const wave = recording ? 0.35 + 0.65 * Math.abs(Math.sin(t / 230 + i * 0.8)) * Math.abs(Math.cos(t / 700 + i * 0.35)) : 0.12;
              return <span key={i} className="w-1 rounded-sm bg-foreground transition-[height] duration-100" style={{ height: 6 + wave * 60 }} />;
            })}
          </div>

          <h3 className="label-mono">Live transcript</h3>
          {/* An invisible full copy reserves the height, so the window doesn't jump while the text types in. */}
          <div className="grid">
            <div className="invisible col-start-1 row-start-1" aria-hidden="true">
              <Transcript visibleChars={(line) => lineLength(LINES[line])} />
            </div>
            <div className="col-start-1 row-start-1">
              <Transcript visibleChars={visibleChars} />
            </div>
          </div>

          <div className="mt-auto flex min-h-12 flex-wrap items-center gap-3 pt-2">
            {recording ? (
              <>
                <Button variant="outline" className="h-12 gap-2.5 px-6 text-base" onClick={() => setElapsed(T_REC_END)}>
                  <span className="size-3 bg-foreground" /> Stop
                </Button>
                <ShimmerButton shimmerColor="var(--highlight)" background="var(--foreground)" borderRadius="6px" className="pointer-events-none h-12 px-6 text-base font-semibold" tabIndex={-1}>
                  Transcribing…
                </ShimmerButton>
              </>
            ) : phase === "done" ? (
              <Button className="h-12 px-6 text-base" onClick={() => setElapsed(0)}>
                Record again
              </Button>
            ) : (
              <ShimmerButton shimmerColor="var(--highlight)" background="var(--foreground)" borderRadius="6px" className="pointer-events-none h-12 px-6 text-base font-semibold" tabIndex={-1}>
                {phase === "thinking" ? "Thinking…" : "Summarizing…"}
              </ShimmerButton>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6 sm:p-9">
          <div className="flex items-baseline justify-between">
            <b className="font-display text-4xl font-extrabold tracking-[-0.02em]">Summary</b>
            <span className={cn("flex items-center gap-1.5 text-sm font-medium transition-opacity", phase === "done" ? "opacity-100" : "opacity-0")}>
              <Check className="size-4" /> Saved to your account
            </span>
          </div>
          <div className="grid">
            <div className="invisible col-start-1 row-start-1" aria-hidden="true">
              <SummaryStream summary={SUMMARY} size="lg" />
            </div>
            <div className="col-start-1 row-start-1">
              {summaryProgress > 0 ? (
                <SummaryStream summary={SUMMARY} progress={summaryProgress} size="lg" />
              ) : (
                <p className="text-lg text-muted-foreground">Your summary appears here when you stop.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
