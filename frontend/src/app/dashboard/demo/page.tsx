"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, PanelLeft, Plus, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AnimatedSummary } from "@/components/summary-stream";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Two Control taps closer together than this count as a double tap.
const HOTKEY_WINDOW_MS = 400;

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
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

export default function DemoPage() {
  const router = useRouter();
  const { status, logout } = useLocalAuth();
  const createLesson = useCreateLesson();
  const addChunk = useAddChunk();
  const finishLesson = useFinishLesson();
  const deleteLesson = useDeleteLesson();

  const [lessonId, setLessonId] = useState<number | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  // The session whose summary was just written here: it streams in; opening an old session shows it at once.
  const [streamingId, setStreamingId] = useState<number | null>(null);
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

  // Which session's delete popover is open (null = none).
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // Hotkey: tapping Control twice quickly starts or stops recording. The handler is kept in a ref so the
  // keydown listener (registered once) always calls the latest version.
  const [hotkeyArmed, setHotkeyArmed] = useState(false);
  const hotkeyRef = useRef<() => void>(() => {});
  useEffect(() => {
    hotkeyRef.current = () => {
      if (status !== "in") return;
      if (recorder.recording) void handleStop();
      else if (!finishLesson.isPending && lesson?.status !== "processing")
        void handleStart();
    };
  });
  useEffect(() => {
    let lastTap = 0;
    let disarm: ReturnType<typeof setTimeout> | undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Control") {
        lastTap = 0; // Ctrl+C and friends don't count
        clearTimeout(disarm);
        setHotkeyArmed(false);
        return;
      }
      if (e.repeat) return;
      const now = Date.now();
      if (now - lastTap < HOTKEY_WINDOW_MS) {
        lastTap = 0;
        clearTimeout(disarm);
        setHotkeyArmed(false);
        hotkeyRef.current();
      } else {
        lastTap = now;
        setHotkeyArmed(true); // first tap registered: light up the first keycap until the window closes
        clearTimeout(disarm);
        disarm = setTimeout(() => setHotkeyArmed(false), HOTKEY_WINDOW_MS);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(disarm);
    };
  }, []);

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
    setStreamingId(id);
    finishLesson.mutate(id, {
      onError: (err) => setRequestError(errorMessage(err)),
    });
  }

  // Switch what the page shows: a past session, or (null) a fresh empty one.
  function openSession(id: number | null) {
    setLessonId(id);
    setRequestError(null);
    setStreamingId(null);
    finishLesson.reset();
  }

  function handleDelete(id: number) {
    setConfirmId(null);
    deleteLesson.mutate(id, {
      onSuccess: () => id === lessonId && openSession(null),
      onError: (err) => setRequestError(errorMessage(err)),
    });
  }

  const summaryEmpty =
    !!summary &&
    !summary.topics.length &&
    !summary.keyPoints.length &&
    !summary.assignments.length &&
    !summary.tasks.length &&
    !summary.studyTip.trim();

  return (
    <div className="flex min-h-screen bg-background p-3 sm:p-4 lg:h-screen">
      <div className="flex w-full flex-col overflow-hidden rounded-[22px] border border-foreground/10 bg-card">
        <SiteHeader>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-highlight"
            >
              Back to dashboard
            </Link>
            <Button variant="link" onClick={logout}>
              Log out
            </Button>
          </div>
        </SiteHeader>

        <div className="flex h-12 shrink-0 items-center gap-4 border-b border-foreground/10 px-6 sm:px-14">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2"
                  aria-label={sidebarOpen ? "Close sessions" : "Open sessions"}
                  aria-expanded={sidebarOpen}
                  onClick={() => setSidebarOpen((o) => !o)}
                />
              }
            >
              <PanelLeft />
            </TooltipTrigger>
            <TooltipContent>
              {sidebarOpen ? "Close sessions" : "Open sessions"}
            </TooltipContent>
          </Tooltip>
          <span className="label-mono normal-case tracking-normal">
            StudySync · Live demo
          </span>
        </div>

        <div className="flex flex-1 max-lg:flex-col lg:min-h-0">
          {sidebarOpen && (
            <aside className="flex shrink-0 flex-col gap-4 border-foreground/10 bg-card p-4 lg:w-64 lg:overflow-y-auto lg:border-r max-lg:border-b">
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
                      <Button
                        variant={s.id === lessonId ? "default" : "ghost"}
                        disabled={recorder.recording}
                        onClick={() => openSession(s.id)}
                        className="h-auto w-full flex-col items-start gap-0 py-2 pr-9 pl-2 text-left font-normal"
                      >
                        <span className="block w-full truncate text-sm font-medium">
                          {s.title}
                        </span>
                        <span className="label-mono block text-[11px] normal-case tracking-normal opacity-70">
                          {formatSessionDate(s.createdAt)}
                          {s.status === "recording" && " · Recording"}
                          {s.status === "processing" && " · Processing"}
                          {s.status === "error" && " · Failed"}
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
                                recorder.recording ||
                                deleteLesson.isPending ||
                                s.status === "processing"
                              }
                              className={cn(
                                "absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0 max-lg:opacity-100 max-lg:disabled:opacity-30",
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
                              onClick={() => handleDelete(s.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}

          <div className="grid min-w-0 flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)]">
            <section className="min-w-0 px-6 py-8 sm:px-14 lg:overflow-y-auto lg:border-r lg:border-foreground/10">
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
                      className="grid grid-cols-[58px_1fr] gap-2.5 text-lg leading-snug"
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
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle />
                  <AlertDescription>{shownError}</AlertDescription>
                </Alert>
              )}

              <div className="mt-6 flex gap-3">
                {recorder.recording && (
                  <Button
                    variant="outline"
                    className="h-auto gap-2.5 px-5 py-3"
                    onClick={handleStop}
                  >
                    <span className="size-2.5 rounded-[2px] bg-current" />
                    Stop
                  </Button>
                )}
                {recorder.recording && (
                  <ShimmerButton
                    shimmerColor="var(--highlight)"
                    background="var(--foreground)"
                    borderRadius="6px"
                    className="pointer-events-none px-5 py-3 text-sm font-semibold"
                    tabIndex={-1}
                  >
                    Transcribing…
                  </ShimmerButton>
                )}
                {!recorder.recording && (
                  <Button
                    className="h-auto px-5 py-3"
                    onClick={handleStart}
                    disabled={processing}
                  >
                    {lessonId === null ? "Start recording" : "Record another"}
                  </Button>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Tap{" "}
                <Kbd
                  className={cn(
                    "h-auto border border-foreground/40 bg-transparent px-1.5 py-0.5 font-semibold text-foreground transition-colors duration-100",
                    hotkeyArmed && "border-foreground bg-highlight",
                  )}
                >
                  Control
                </Kbd>{" "}
                twice to {recorder.recording ? "stop" : "start"} recording
              </p>
            </section>

            <section className="min-w-0 border-t border-foreground/10 px-6 py-8 sm:px-14 lg:overflow-y-auto lg:border-t-0">
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
                <ShimmerButton
                  shimmerColor="var(--highlight)"
                  background="var(--foreground)"
                  borderRadius="6px"
                  className="pointer-events-none px-5 py-3 text-sm font-semibold"
                  tabIndex={-1}
                >
                  {lesson?.stage === "summarizing"
                    ? "Summarizing…"
                    : "Thinking…"}
                </ShimmerButton>
              )}

              {lesson?.status === "error" && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>
                    Something went wrong: {lesson.error}
                  </AlertDescription>
                </Alert>
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

              {summary && !summaryEmpty && lesson && (
                <AnimatedSummary
                  key={lesson.id}
                  summary={summary}
                  animate={lesson.id === streamingId}
                  size="lg"
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
