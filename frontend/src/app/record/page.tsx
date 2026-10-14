"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, CheckSquare, ListChecks, Loader2, Mic, Pause, Play, Square } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/record/waveform";
import { useRecordingSession } from "@/hooks/use-recording-session";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCreateLesson } from "@/hooks/use-lessons";
import { summarizeApi, ApiError } from "@/lib/api";
import { formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { AiSummaryResult } from "@/lib/types";

function formatClock(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function RecordPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const session = useRecordingSession();
  const [title, setTitle] = useState("");
  const [aiResult, setAiResult] = useState<AiSummaryResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const createLesson = useCreateLesson();

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [userLoading, user, router]);

  async function handleSummarize() {
    if (!session.manualTranscript.trim()) return;
    setSummarizing(true);
    setAiError(null);
    try {
      const { summary } = await summarizeApi.run({ transcript: session.manualTranscript });
      setAiResult(summary);
      if (!title.trim()) setTitle(summary.suggestedTitle);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : "Couldn't generate a summary. Try again.");
    } finally {
      setSummarizing(false);
    }
  }

  function handleSave() {
    const finalTitle = title.trim() || aiResult?.suggestedTitle || "Untitled Lesson";
    createLesson.mutate(
      {
        title: finalTitle,
        durationSec: session.durationSec,
        transcript: session.manualTranscript,
        summary: aiResult
          ? {
              suggestedTitle: aiResult.suggestedTitle,
              topics: aiResult.topics,
              keyPoints: aiResult.keyPoints,
              studyTips: aiResult.studyTips,
              dates: aiResult.dates,
            }
          : undefined,
        tasks: aiResult?.tasks ?? [],
        assignments: aiResult?.assignments ?? [],
      },
      {
        onSuccess: () => {
          toast.success("Lesson saved to your library");
          session.reset();
          setTitle("");
          setAiResult(null);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Couldn't save this lesson.");
        },
      }
    );
  }

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isRecording = session.phase === "recording";
  const isPaused = session.phase === "paused";
  const isStopped = session.phase === "stopped";

  return (
    <div className="flex min-h-screen justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-[1280px] overflow-hidden border border-foreground/10 bg-card">
        <DashboardSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-foreground/10 px-6 py-4 sm:gap-4">
            <div className="flex shrink-0 gap-[7px]">
              <span className="size-[18px] rounded-full border-2 border-foreground" />
              <span className="size-[18px] rounded-full border-2 border-foreground" />
              <span className="size-[18px] rounded-full border-2 border-foreground" />
            </div>
            <span className="label-mono shrink-0 normal-case tracking-normal text-foreground">StudySync ·</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={aiResult?.suggestedTitle || "Untitled lecture"}
              aria-label="Lecture title"
              className="min-w-[120px] flex-1 bg-transparent font-mono text-[15px] outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col gap-[18px] border-b border-foreground/10 p-6 sm:p-8 lg:border-r lg:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-lg font-bold">
                  <span
                    className={cn(
                      "size-3.5 rounded-full",
                      isRecording ? "bg-destructive" : "bg-muted-foreground/40"
                    )}
                  />
                  {session.phase === "idle" && "Ready"}
                  {isRecording && "Recording"}
                  {isPaused && "Paused"}
                  {isStopped && "Recording finished"}
                </div>
                <b className="font-mono text-[17px] font-medium tabular-nums">{formatClock(session.durationSec)}</b>
              </div>

              <Waveform analyser={session.analyser} active={isRecording} className="h-16 w-full" />

              <div className="label-mono">{isStopped ? "Review transcript" : "Live transcript"}</div>

              {isStopped ? (
                <textarea
                  value={session.manualTranscript}
                  onChange={(e) => session.setManualTranscript(e.target.value)}
                  placeholder="No speech was captured — type or paste the transcript here."
                  className="min-h-40 w-full flex-1 resize-none bg-transparent font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
                />
              ) : (
                <div
                  className={cn(
                    "min-h-32 flex-1 font-mono text-sm leading-relaxed",
                    !session.liveTranscript && "text-muted-foreground"
                  )}
                >
                  {session.liveTranscript || "Your words will appear here as you speak…"}
                </div>
              )}

              {session.audioError && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" /> {session.audioError}
                </p>
              )}
              {!session.speechSupported && session.phase !== "idle" && (
                <p className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertTriangle className="size-4 shrink-0" /> Live transcription isn&apos;t supported in this
                  browser. Audio is still being recorded — type or paste the transcript once you stop.
                </p>
              )}
              {session.speechError && (
                <p className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertTriangle className="size-4 shrink-0" /> {session.speechError}
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-3 pt-1">
                {session.phase === "idle" && (
                  <Button className="h-auto gap-2 px-6 py-3" onClick={() => session.start()}>
                    <Mic className="size-4" /> Start recording
                  </Button>
                )}
                {isRecording && (
                  <>
                    <Button variant="outline" className="h-auto gap-2 px-5 py-3" onClick={session.pause}>
                      <Pause className="size-4" /> Pause
                    </Button>
                    <Button className="h-auto gap-2 px-5 py-3" onClick={session.stop}>
                      <Square className="size-4" /> Stop
                    </Button>
                  </>
                )}
                {isPaused && (
                  <>
                    <Button variant="outline" className="h-auto gap-2 px-5 py-3" onClick={session.resume}>
                      <Play className="size-4" /> Resume
                    </Button>
                    <Button className="h-auto gap-2 px-5 py-3" onClick={session.stop}>
                      <Square className="size-4" /> Stop
                    </Button>
                  </>
                )}
                {isStopped && (
                  <>
                    <Button
                      variant="outline"
                      className="h-auto gap-2 px-5 py-3"
                      onClick={() => {
                        session.reset();
                        setAiResult(null);
                        setAiError(null);
                      }}
                    >
                      <Mic className="size-4" /> Record again
                    </Button>
                    <Button
                      className="h-auto gap-2 px-5 py-3"
                      onClick={handleSummarize}
                      disabled={summarizing || !session.manualTranscript.trim()}
                    >
                      {summarizing && <Loader2 className="size-4 animate-spin" />}
                      {aiResult ? "Regenerate summary" : "Summarize"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex items-baseline justify-between gap-3">
                <b className="text-[26px] tracking-[-0.01em]">Summary</b>
                {aiResult && <span className="text-[13px] font-medium text-muted-foreground">Ready to save</span>}
              </div>

              {aiError && (
                <p className="text-sm text-destructive">
                  {aiError}{" "}
                  {aiError.toLowerCase().includes("api key") && (
                    <Link href="/settings" className="underline underline-offset-4">
                      Add one in Settings
                    </Link>
                  )}
                </p>
              )}

              {!aiResult && !aiError && !summarizing && (
                <p className="text-sm text-muted-foreground">
                  {isStopped
                    ? "Hit Summarize to get topics, key points, assignments and a study tip."
                    : "Record a lecture, then summarize it to see topics, key points, due dates and a study tip here."}
                </p>
              )}

              {summarizing && !aiResult && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Generating summary…
                </p>
              )}

              {aiResult && (
                <>
                  {aiResult.topics.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="label-mono">Topics</div>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.topics.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border-2 border-foreground px-3.5 py-1 text-sm font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResult.keyPoints.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="label-mono">Key points</div>
                      {aiResult.keyPoints.map((k, i) => (
                        <div key={i} className="flex gap-2.5 text-[15px]">
                          <span className="mt-2 size-[7px] shrink-0 bg-foreground" />
                          {k}
                        </div>
                      ))}
                    </div>
                  )}

                  {aiResult.tasks.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="label-mono flex items-center gap-1.5">
                        <ListChecks className="size-3.5" /> Tasks to add
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        {aiResult.tasks.map((t, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckSquare className="size-3.5 text-foreground" /> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.assignments.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="label-mono">Assignments detected</p>
                      <ul className="space-y-2">
                        {aiResult.assignments.map((a, i) => (
                          <li key={i} className="flex items-center justify-between gap-3 text-sm">
                            <span>{a.text}</span>
                            {a.dueDate && (
                              <span className="label-mono shrink-0 rounded-[6px] border-2 border-foreground bg-highlight px-2.5 py-1 tracking-[0.04em] text-foreground">
                                Due {a.dueDate}
                                {a.dueTime ? ` ${a.dueTime}` : ""}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.studyTips.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="label-mono">Study tip</div>
                      <span className="text-[15px] leading-snug">{aiResult.studyTips[0]}</span>
                    </div>
                  )}
                </>
              )}

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
                <span className="font-mono text-xs text-muted-foreground">
                  Duration: {formatDuration(session.durationSec)}
                </span>
                <Button
                  className="h-auto px-5 py-2.5"
                  disabled={!isStopped || !session.manualTranscript.trim() || createLesson.isPending}
                  onClick={handleSave}
                >
                  {createLesson.isPending && <Loader2 className="size-4 animate-spin" />}
                  Save lesson
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
