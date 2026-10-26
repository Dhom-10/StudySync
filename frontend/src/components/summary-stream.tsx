"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface SummaryData {
  topics: string[];
  keyPoints: string[];
  assignments: { title: string; dueDate: string | null; dueLabel?: string }[];
  tasks: string[];
  studyTip: string;
}

export function formatDue(iso: string | null) {
  if (!iso) return "No due date";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `Due ${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
}

type Kind = "topic" | "point" | "assignment" | "due" | "task" | "tip";
interface Item {
  kind: Kind;
  text: string;
  index: number;
  start: number; // character offset in the stream where this item begins typing
}

// Small pause (in characters) between items so the "typing" has a natural rhythm.
const GAP = 6;

/** Flattens the summary into the order it is "typed" in. Everything else derives from this list. */
function buildItems(s: SummaryData): Item[] {
  const raw: Omit<Item, "start">[] = [];
  s.topics.forEach((text, index) => raw.push({ kind: "topic", text, index }));
  s.keyPoints.forEach((text, index) => raw.push({ kind: "point", text, index }));
  s.assignments.forEach((a, index) => {
    raw.push({ kind: "assignment", text: a.title, index });
    raw.push({ kind: "due", text: a.dueLabel ?? formatDue(a.dueDate), index });
  });
  s.tasks.forEach((text, index) => raw.push({ kind: "task", text, index }));
  if (s.studyTip.trim()) raw.push({ kind: "tip", text: s.studyTip, index: 0 });

  let cursor = 0;
  return raw.map((item) => {
    const withStart = { ...item, start: cursor };
    cursor += item.text.length + GAP;
    return withStart;
  });
}

/** Total length of the typing stream, for timing an animation. */
export function streamLength(s: SummaryData) {
  const items = buildItems(s);
  const last = items[items.length - 1];
  return last ? last.start + last.text.length + GAP : 0;
}

/** Drives a typing reveal: returns the number of characters shown so far (Infinity = everything). */
export function useTypewriter(total: number, active: boolean, charsPerSecond = 70) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) return;
    const startedAt = performance.now();
    const id = setInterval(() => {
      const next = ((performance.now() - startedAt) * charsPerSecond) / 1000;
      if (next >= total) {
        setProgress(Infinity);
        clearInterval(id);
      } else {
        setProgress(next);
      }
    }, 40);
    return () => clearInterval(id);
  }, [active, total, charsPerSecond]);
  return active ? progress : Infinity;
}

const SIZES = {
  md: { body: "text-base", heading: "gap-6", pill: "text-base" },
  lg: { body: "text-lg sm:text-xl", heading: "gap-7", pill: "text-base sm:text-lg" },
} as const;

function Caret() {
  return <span aria-hidden="true" className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-foreground" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="label-mono">{title}</h2>
      {children}
    </div>
  );
}

/**
 * The summary sections (topics, key points, assignments, tasks, study tip). Sections with nothing in
 * them are not rendered. `progress` reveals the text character by character, like a streamed reply.
 */
export function SummaryStream({
  summary,
  progress = Infinity,
  size = "md",
}: {
  summary: SummaryData;
  progress?: number;
  size?: keyof typeof SIZES;
}) {
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set());
  const items = buildItems(summary);
  const s = SIZES[size];

  const shown = (item: Item) => item.text.slice(0, Math.max(0, Math.floor(progress - item.start)));
  const typing = (item: Item) => Number.isFinite(progress) && progress >= item.start && progress < item.start + item.text.length + GAP;
  const ofKind = (kind: Kind) => items.filter((i) => i.kind === kind && shown(i).length > 0);

  const topics = ofKind("topic");
  const points = ofKind("point");
  const assignments = ofKind("assignment");
  const tasks = ofKind("task");
  const tip = ofKind("tip")[0];
  const dueFor = (index: number) => items.find((i) => i.kind === "due" && i.index === index);
  const hasAssignments = items.some((i) => i.kind === "assignment");
  const hasTasks = items.some((i) => i.kind === "task");

  function toggleTask(i: number) {
    setDoneTasks((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  }

  return (
    <div className={cn("flex flex-col", s.heading)}>
      {topics.length > 0 && (
        <Section title="Topics">
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <Badge key={t.index} variant="outline" className={cn("h-auto px-3.5 py-1", s.pill)}>
                {shown(t)}
                {typing(t) && <Caret />}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {points.length > 0 && (
        <Section title="Key points">
          <ul className="grid gap-2">
            {points.map((p) => (
              <li
                key={p.index}
                className={cn(
                  "relative pl-5 leading-snug before:absolute before:top-[0.6em] before:left-px before:size-1.5 before:bg-foreground",
                  s.body
                )}
              >
                {shown(p)}
                {typing(p) && <Caret />}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(assignments.length > 0 || tasks.length > 0) && (
        <div className={cn("grid gap-7", hasAssignments && hasTasks && "sm:grid-cols-2")}>
          {assignments.length > 0 && (
            <Section title="Assignments">
              <div className="grid gap-3">
                {assignments.map((a) => {
                  const due = dueFor(a.index);
                  return (
                    <div key={a.index} className="flex flex-col items-start gap-1.5">
                      <strong className={s.body}>
                        {shown(a)}
                        {typing(a) && <Caret />}
                      </strong>
                      {due && shown(due).length > 0 && (
                        <Badge variant="highlight" className="label-mono h-auto rounded-[6px] px-2.5 py-0.5 font-bold normal-case tracking-normal">
                          {shown(due)}
                          {typing(due) && <Caret />}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
          {tasks.length > 0 && (
            <Section title="Tasks">
              <div className="grid gap-2">
                {tasks.map((task) => (
                  <label key={task.index} className={cn("flex cursor-pointer items-start gap-2.5 leading-snug", s.body)}>
                    <Checkbox
                      checked={doneTasks.has(task.index)}
                      onCheckedChange={() => toggleTask(task.index)}
                      className="mt-1"
                    />
                    <span className={cn(doneTasks.has(task.index) && "text-muted-foreground line-through")}>
                      {shown(task)}
                      {typing(task) && <Caret />}
                    </span>
                  </label>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {tip && (
        <Section title="Study tip">
          <p className={cn("leading-snug", s.body)}>
            {shown(tip)}
            {typing(tip) && <Caret />}
          </p>
        </Section>
      )}
    </div>
  );
}

/** SummaryStream that animates itself once on mount (when `animate`), e.g. for a freshly written summary. */
export function AnimatedSummary({ summary, animate, size }: { summary: SummaryData; animate: boolean; size?: keyof typeof SIZES }) {
  const progress = useTypewriter(streamLength(summary), animate);
  return <SummaryStream summary={summary} progress={progress} size={size} />;
}
