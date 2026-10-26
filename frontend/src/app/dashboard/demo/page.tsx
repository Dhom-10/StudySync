"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, PanelLeft, Plus, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import {
  useAddChunk,
  useCreateLesson,
  useDeleteLesson,
  useFinishLesson,
  useLesson,
  useLessons,
} from "@/hooks/use-lessons";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const STAGE_LABEL = {
  transcribing: "Finishing the transcript…",
  summarizing: "Writing the summary…",
} as const;

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDue(iso: string | null) {
  if (!iso) return "No due date";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `Due ${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
}

// createdAt is an ISO timestamp (UTC); show it in the viewer's local time.
function formatSessionDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function errorMessage(err: unknown) {
  return err instanceof ApiError
    ? err.message
    : "Couldn't reach the backend. Is it running on port 4000?";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="label-mono mb-2">{title}</h2>
      {children}
    </div>
  );
}

export default function DemoPage() {
  const router = useRouter();
  const { status, logout } = useLocalAuth();
  const createLesson = useCreateLesson();
  const addChunk = useAddChunk();
  const finishLesson = useFinishLesson();
  const deleteLesson = useDeleteLesson();

  const [lessonId, setLessonId] = useState<number | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set());
  // Resolves to the new lesson's id (or null if it couldn't be created); chunks wait on it.
  const lessonPromiseRef = useRef<Promise<number | null>>(
    Promise.resolve(null),
  );

  const recorder = useAudioRecorder(async (audio, seq, start) => {
    const id = await lessonPromiseRef.current;
    if (id === null) return;
    // One retry, so a brief hiccup doesn't leave a hole in the transcript.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await addChunk.mutateAsync({ id, audio, seq, start });
        return;
      } catch (err) {
        if (attempt === 1) setRequestError(errorMessage(err));
      }
    }
  });
  const lesson = useLesson(lessonId).data;
  const sessions = useLessons().data ?? [];
  const [sidebarOpen, setSidebarOpen] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(min-width: 1024px)").matches,
  );

  // Which session's "Delete?" dropdown is open (null = none); closes on outside click or Escape.
  const [confirmId, setConfirmId] = useState<number | null>(null);
  useEffect(() => {
    if (confirmId === null) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-delete-confirm]")) setConfirmId(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirmId(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [confirmId]);

  useEffect(() => {
    if (status === "out") router.replace("/login");
  }, [status, router]);

  if (status !== "in") return null;

  const processing = finishLesson.isPending || lesson?.status === "processing";
  const summary = lesson?.summary;
  const segments = lesson?.segments ?? [];
  const shownError =
    recorder.error ??
    requestError ??
    (lesson?.status === "recording" ? lesson.error : null);

  async function handleStart() {
    setLessonId(null);
    setRequestError(null);
    setDoneTasks(new Set());
    finishLesson.reset();
    if (!(await recorder.start())) return;

    const created = createLesson.mutateAsync();
    created.then(
      ({ id }) => setLessonId(id),
      (err) => setRequestError(errorMessage(err)),
    );
    lessonPromiseRef.current = created.then(
      ({ id }) => id,
      () => null,
    );
  }

  async function handleStop() {
    await recorder.stop();
    const id = await lessonPromiseRef.current;
    if (id === null) return;
    finishLesson.mutate(id, {
      onError: (err) => setRequestError(errorMessage(err)),
    });
  }

  // Switch what the page shows: a past session, or (null) a fresh empty one.
  function openSession(id: number | null) {
    setLessonId(id);
    setRequestError(null);
    setDoneTasks(new Set());
    finishLesson.reset();
  }

  function handleDelete(id: number) {
    setConfirmId(null);
    deleteLesson.mutate(id, {
      onSuccess: () => id === lessonId && openSession(null),
      onError: (err) => setRequestError(errorMessage(err)),
    });
  }

  function toggleTask(i: number) {
    setDoneTasks((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  }

  const hasAssignments = !!summary?.assignments.length;
  const hasTasks = !!summary?.tasks.length;
  const summaryEmpty =
    !!summary &&
    !summary.topics.length &&
    !summary.keyPoints.length &&
    !hasAssignments &&
    !hasTasks &&
    !summary.studyTip.trim();

  return (
    <div className="flex min-h-screen justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-[1280px] flex-col overflow-hidden border border-foreground/10 bg-card">
        <SiteHeader>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-highlight"
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-highlight"
            >
              Log out
            </button>
          </div>
        </SiteHeader>

        <div className="flex h-12 items-center gap-4 border-b border-foreground/10 px-6 sm:px-14">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Close sessions" : "Open sessions"}
            aria-expanded={sidebarOpen}
            className="-ml-1.5 rounded-md p-1.5 transition-colors hover:bg-foreground/5"
          >
            <PanelLeft className="size-5" />
          </button>
          <span className="label-mono normal-case tracking-normal">
            StudySync · Live demo
          </span>
        </div>

        <div className="flex flex-1 max-lg:flex-col">
          {sidebarOpen && (
            <aside className="flex shrink-0 flex-col gap-4 border-foreground/10 bg-card p-4 lg:w-64 lg:border-r max-lg:border-b">
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={recorder.recording}
                onClick={() => openSession(null)}
              >
                <Plus className="size-4" /> New session
              </Button>
              <h2 className="label-mono px-2">Sessions</h2>
              {sessions.length === 0 ? (
                <p className="px-2 text-sm text-muted-foreground">
                  No sessions yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-1 max-lg:max-h-60 max-lg:overflow-y-auto">
                  {sessions.map((s) => (
                    <li key={s.id} className="group relative">
                      <button
                        type="button"
                        disabled={recorder.recording}
                        onClick={() => openSession(s.id)}
                        className={cn(
                          "w-full rounded-md py-2 pr-9 pl-2 text-left transition-colors disabled:opacity-60",
                          s.id === lessonId
                            ? "bg-foreground text-card"
                            : "hover:bg-foreground/5",
                        )}
                      >
                        <span className="block truncate text-sm font-medium">
                          {s.title}
                        </span>
                        <span className="label-mono block text-[11px] normal-case tracking-normal opacity-70">
                          {formatSessionDate(s.createdAt)}
                          {s.status === "recording" && " · Recording"}
                          {s.status === "processing" && " · Processing"}
                          {s.status === "error" && " · Failed"}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${s.title}`}
                        title={
                          s.status === "processing"
                            ? "Wait for this session to finish"
                            : "Delete session"
                        }
                        disabled={
                          recorder.recording ||
                          deleteLesson.isPending ||
                          s.status === "processing"
                        }
                        data-delete-confirm
                        aria-expanded={confirmId === s.id}
                        onClick={() => setConfirmId(confirmId === s.id ? null : s.id)}
                        className={cn(
                          "absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-foreground/10 focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0 max-lg:opacity-100 max-lg:disabled:opacity-30",
                          confirmId === s.id && "opacity-100",
                        )}
                      >
                        <Trash2 className="size-4" />
                      </button>
                      {confirmId === s.id && (
                        <div
                          data-delete-confirm
                          role="alertdialog"
                          aria-label="Confirm delete"
                          className="absolute top-full right-0 z-20 mt-1 w-56 rounded-md border border-foreground/10 bg-card p-3 text-foreground shadow-md"
                        >
                          <p className="text-sm font-medium">Delete this session?</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Its transcript and summary will be removed.
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setConfirmId(null)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" size="sm" autoFocus onClick={() => handleDelete(s.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}

          <div className="grid min-w-0 flex-1 grid-cols-1 lg:grid-cols-2">
            <section className="min-w-0 px-6 py-8 sm:px-14 lg:border-r lg:border-foreground/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-lg">
                  <span
                    className={cn(
                      "size-3.5 rounded-full",
                      recorder.recording
                        ? "bg-destructive"
                        : "bg-muted-foreground/50",
                    )}
                  />
                  <strong>
                    {recorder.recording
                      ? "Recording"
                      : processing
                        ? "Processing"
                        : "Ready"}
                  </strong>
                </div>
                <span className="label-mono text-base text-foreground">
                  {formatTime(recorder.elapsed)}
                </span>
              </div>

              <div
                aria-label="Audio waveform"
                className={cn(
                  "my-4 flex h-[72px] items-center gap-1 overflow-hidden",
                  !recorder.recording && "opacity-40",
                )}
              >
                {recorder.levels.map((level, i) => (
                  <i
                    key={i}
                    className="w-1 shrink-0 rounded-full bg-foreground"
                    style={{ height: 6 + level * 46 }}
                  />
                ))}
                <span className="mx-[3px] h-[53px] w-[5px] shrink-0 rounded-full bg-destructive" />
                {Array.from({ length: 10 }).map((_, i) => (
                  <b
                    key={i}
                    className="size-[5px] shrink-0 rounded-full bg-foreground/20"
                  />
                ))}
              </div>

              <h2 className="label-mono mb-2">Live transcript</h2>
              {segments.length > 0 ? (
                <div className="grid gap-3">
                  {segments.map((seg, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[58px_1fr] gap-2.5 leading-snug"
                    >
                      <time className="label-mono pt-0.5 normal-case tracking-normal">
                        {formatTime(seg.start)}
                      </time>
                      <p>{seg.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {recorder.recording
                    ? "Listening… the first lines appear after a few seconds."
                    : "Press Start and speak. The transcript shows up here as you talk."}
                </p>
              )}

              {shownError && (
                <p className="mt-4 text-sm text-destructive">{shownError}</p>
              )}

              <div className="mt-6 flex gap-3">
                {recorder.recording ? (
                  <Button
                    variant="outline"
                    className="h-auto gap-2.5 px-5 py-3"
                    onClick={handleStop}
                  >
                    <span className="size-2.5 rounded-[2px] bg-current" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    className="h-auto px-5 py-3"
                    onClick={handleStart}
                    disabled={processing}
                  >
                    {lessonId === null ? "Start recording" : "Record another"}
                  </Button>
                )}
              </div>
            </section>

            <section className="min-w-0 border-t border-foreground/10 px-6 py-8 sm:px-14 lg:border-t-0">
              <div className="mb-5 flex items-start justify-between gap-5">
                <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em]">
                  Summary
                </h1>
                {summary && !summaryEmpty && (
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Check className="size-4" /> Saved
                  </p>
                )}
              </div>

              {processing && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {STAGE_LABEL[lesson?.stage ?? "transcribing"]}
                </p>
              )}

              {lesson?.status === "error" && (
                <p className="text-sm text-destructive">
                  Something went wrong: {lesson.error}
                </p>
              )}

              {!processing && !summary && lesson?.status !== "error" && (
                <p className="text-muted-foreground">
                  {recorder.recording
                    ? "The summary is written when you stop recording."
                    : "Your summary will show up here once the recording is processed."}
                </p>
              )}

              {summaryEmpty && (
                <p className="text-muted-foreground">
                  There wasn&apos;t enough said to put together a summary.
                </p>
              )}

              {summary && !summaryEmpty && (
                <div className="flex flex-col gap-6">
                  {summary.topics.length > 0 && (
                    <Section title="Topics">
                      <div className="flex flex-wrap gap-2">
                        {summary.topics.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border-2 border-foreground px-3.5 py-0.5 text-sm font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  {summary.keyPoints.length > 0 && (
                    <Section title="Key points">
                      <ul className="grid gap-1.5">
                        {summary.keyPoints.map((p) => (
                          <li
                            key={p}
                            className="relative pl-5 leading-snug before:absolute before:top-[0.55em] before:left-px before:size-1.5 before:bg-foreground"
                          >
                            {p}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {(hasAssignments || hasTasks) && (
                    <div
                      className={cn(
                        "grid gap-8",
                        hasAssignments && hasTasks && "sm:grid-cols-2",
                      )}
                    >
                      {hasAssignments && (
                        <Section title="Assignments">
                          <div className="grid gap-3">
                            {summary.assignments.map((a) => (
                              <div key={a.title}>
                                <strong className="mb-1.5 block">
                                  {a.title}
                                </strong>
                                <span className="label-mono inline-block rounded-[6px] border-2 border-foreground bg-highlight px-2.5 py-0.5 font-bold text-foreground normal-case tracking-normal">
                                  {formatDue(a.dueDate)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </Section>
                      )}
                      {hasTasks && (
                        <Section title="Tasks">
                          <div className="grid gap-2">
                            {summary.tasks.map((task, i) => (
                              <label
                                key={task}
                                className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug"
                              >
                                <input
                                  type="checkbox"
                                  checked={doneTasks.has(i)}
                                  onChange={() => toggleTask(i)}
                                  className="mt-px size-[18px] shrink-0 accent-foreground"
                                />
                                <span
                                  className={cn(
                                    doneTasks.has(i) &&
                                      "text-muted-foreground line-through",
                                  )}
                                >
                                  {task}
                                </span>
                              </label>
                            ))}
                          </div>
                        </Section>
                      )}
                    </div>
                  )}

                  {summary.studyTip.trim() && (
                    <Section title="Study tip">
                      <p className="text-sm leading-snug">{summary.studyTip}</p>
                    </Section>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
