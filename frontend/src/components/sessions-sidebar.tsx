"use client";

import { useState } from "react";
import {
  ChevronLeft,
  HardDrive,
  Mic,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import type { Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today", "Yesterday", or a short date: the heading sessions are grouped under. */
function dayLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const daysAgo = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY_MS);
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function Meta({ session }: { session: Lesson }) {
  const topics = session.summary?.topics.length ?? 0;
  return (
    <span className="label-mono block truncate text-[11px] normal-case tracking-normal">
      {timeLabel(session.createdAt)}
      {session.status === "done" &&
        topics > 0 &&
        ` · ${topics} ${topics === 1 ? "topic" : "topics"}`}
    </span>
  );
}

/** The session's name, or a shimmering placeholder while it is still being recorded or generated. */
function SessionTitle({ session }: { session: Lesson }) {
  if (session.status === "recording" || session.status === "processing") {
    return (
      <ShimmeringText
        text={
          session.status === "recording" ? "Recording…" : "Generating title…"
        }
        baseColor="var(--muted-foreground)"
        shimmerColor="var(--foreground)"
      />
    );
  }
  return <>{session.title}</>;
}

/** Sessions grouped by day, in the order they were given (newest first). */
function groupByDay(sessions: Lesson[]) {
  const groups: { label: string; sessions: Lesson[] }[] = [];
  for (const session of sessions) {
    const label = dayLabel(session.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.sessions.push(session);
    else groups.push({ label, sessions: [session] });
  }
  return groups;
}

export function SessionsSidebar({
  sessions,
  activeId,
  locked,
  deleting,
  onNew,
  onSelect,
  onDelete,
  onClearAll,
  clearing,
  onClose,
}: {
  sessions: Lesson[];
  activeId: number | null;
  /** True while recording: switching or deleting sessions is disabled. */
  locked: boolean;
  deleting: boolean;
  onNew: () => void;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
  clearing: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const working = sessions.some(
    (s) => s.status === "recording" || s.status === "processing",
  );

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(needle) ||
          s.summary?.topics.some((t) => t.toLowerCase().includes(needle)),
      )
    : sessions;
  const groups = groupByDay(shown);

  return (
    <aside className="flex shrink-0 flex-col gap-4 border-foreground/10 bg-card px-4 pt-8 pb-4 max-lg:border-b lg:min-h-0 lg:w-72 lg:border-r">
      <div className="flex h-10 items-center justify-between gap-2 pl-1">
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em]">
          Sessions
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close sessions"
          title="Close sessions"
          onClick={onClose}
        >
          <ChevronLeft />
        </Button>
      </div>

      <Button
        size="lg"
        className="w-full gap-2"
        disabled={locked}
        onClick={onNew}
      >
        <Plus /> New session
      </Button>

      {sessions.length > 3 && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions"
            aria-label="Search sessions"
            className="pl-9"
          />
        </div>
      )}

      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 max-lg:max-h-72">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-foreground/20 px-4 py-8 text-center">
            <Mic className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No sessions yet</p>
            <p className="text-xs text-muted-foreground">
              Start recording and it will show up here.
            </p>
          </div>
        ) : groups.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            Nothing matches “{query}”.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-1">
              <h3 className="label-mono px-1 pb-1">{group.label}</h3>
              <ul className="flex flex-col">
                {group.sessions.map((s, index) => {
                  const active = s.id === activeId;
                  return (
                    <li key={s.id}>
                      {index > 0 && (
                        <Separator className="my-1 bg-foreground/10" />
                      )}
                      <div className="group relative">
                        <Button
                          variant="ghost"
                          disabled={locked}
                          onClick={() => onSelect(s.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "h-auto w-full items-start justify-start gap-3 rounded-lg px-3 py-2.5 pr-10 text-left font-normal whitespace-normal shadow-none",
                            active && "bg-foreground/10 hover:bg-foreground/10",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm leading-snug font-normal">
                              <SessionTitle session={s} />
                            </span>
                            <span className="text-muted-foreground">
                              <Meta session={s} />
                            </span>
                          </span>
                        </Button>

                        <Popover
                          open={confirmId === s.id}
                          onOpenChange={(open) =>
                            setConfirmId(open ? s.id : null)
                          }
                        >
                          <PopoverTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Delete ${s.title}`}
                                title={
                                  s.status === "processing"
                                    ? "Wait for this session to finish"
                                    : "Delete session"
                                }
                                disabled={
                                  locked ||
                                  deleting ||
                                  s.status === "processing"
                                }
                                className={cn(
                                  "absolute top-2 right-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0 max-lg:opacity-100 max-lg:disabled:opacity-30",
                                  confirmId === s.id && "opacity-100",
                                )}
                              />
                            }
                          >
                            <Trash2 />
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-60">
                            <PopoverHeader>
                              <PopoverTitle>Delete this session?</PopoverTitle>
                              <PopoverDescription>
                                Its transcript and summary will be removed.
                              </PopoverDescription>
                            </PopoverHeader>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setConfirmId(null);
                                  onDelete(s.id);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-foreground/10 pt-3 pl-1">
        <p className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
          <HardDrive className="size-3.5" /> Saved on this computer
        </p>
        {sessions.length > 0 && (
          <Popover open={clearOpen} onOpenChange={setClearOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={locked || clearing || working}
                  title={
                    working
                      ? "Wait for the current session to finish"
                      : "Delete every session"
                  }
                  className="text-destructive hover:text-destructive"
                />
              }
            >
              Clear all
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-64">
              <PopoverHeader>
                <PopoverTitle>Delete all sessions?</PopoverTitle>
                <PopoverDescription>
                  All {sessions.length}{" "}
                  {sessions.length === 1 ? "session" : "sessions"} will be
                  removed with their transcripts and summaries. This can&apos;t
                  be undone.
                </PopoverDescription>
              </PopoverHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClearOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setClearOpen(false);
                    onClearAll();
                  }}
                >
                  Delete all
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </aside>
  );
}
