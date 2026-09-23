"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckSquare,
  ListChecks,
  Loader2,
  Mic,
  Pause,
  Play,
  Sparkles,
  Square,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SubjectSelect } from "@/components/subjects/subject-select";
import { SummaryDetails } from "@/components/lessons/summary-details";
import { Waveform } from "@/components/record/waveform";
import { useRecordingSession } from "@/hooks/use-recording-session";
import { summarizeApi, ApiError } from "@/lib/api";
import { useCreateLesson } from "@/hooks/use-lessons";
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
  const session = useRecordingSession();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiSummaryResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const createLesson = useCreateLesson();

  async function handleSummarize() {
    if (!session.manualTranscript.trim()) return;
    setSummarizing(true);
    setAiError(null);
    try {
      const { summary } = await summarizeApi.run({
        transcript: session.manualTranscript,
        subjectId,
      });
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
        subjectId,
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
          setSubjectId(null);
          setAiResult(null);
          router.push("/lessons");
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Couldn't save this lesson.");
        },
      }
    );
  }

  const isRecording = session.phase === "recording";
  const isPaused = session.phase === "paused";
  const isStopped = session.phase === "stopped";

  return (
    <div className="pb-16">
      <PageHeader title="Record" description="Capture a class, transcribe it live, and turn it into a study guide." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-6 py-8">
              <Waveform
                analyser={session.analyser}
                active={isRecording}
                className="h-20 w-full max-w-md"
              />

              <div className="text-center">
                <p className="font-mono text-4xl font-semibold tabular-nums">
                  {formatClock(session.durationSec)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.phase === "idle" && "Ready to record"}
                  {isRecording && "Recording…"}
                  {isPaused && "Paused"}
                  {isStopped && "Recording finished"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {session.phase === "idle" && (
                  <Button size="lg" className="gap-2 rounded-full px-8" onClick={() => session.start()}>
                    <Mic className="size-5" /> Start recording
                  </Button>
                )}
                {isRecording && (
                  <>
                    <Button size="lg" variant="outline" className="gap-2 rounded-full" onClick={session.pause}>
                      <Pause className="size-4" /> Pause
                    </Button>
                    <Button size="lg" className="gap-2 rounded-full px-8" onClick={session.stop}>
                      <Square className="size-4" /> Stop
                    </Button>
                  </>
                )}
                {isPaused && (
                  <>
                    <Button size="lg" variant="outline" className="gap-2 rounded-full" onClick={session.resume}>
                      <Play className="size-4" /> Resume
                    </Button>
                    <Button size="lg" className="gap-2 rounded-full px-8" onClick={session.stop}>
                      <Square className="size-4" /> Stop
                    </Button>
                  </>
                )}
                {isStopped && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 rounded-full"
                    onClick={() => {
                      session.reset();
                      setAiResult(null);
                      setAiError(null);
                    }}
                  >
                    <Mic className="size-4" /> Record again
                  </Button>
                )}
              </div>

              {session.audioError && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" /> {session.audioError}
                </p>
              )}
              {!session.speechSupported && session.phase !== "idle" && (
                <p className="flex items-center gap-2 text-center text-sm text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="size-4 shrink-0" /> Live transcription isn&apos;t supported in this
                  browser. Audio is still being recorded — type or paste the transcript below once you stop.
                </p>
              )}
              {session.speechError && (
                <p className="flex items-center gap-2 text-center text-sm text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="size-4 shrink-0" /> {session.speechError}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isStopped ? "Review transcript" : "Live transcript"}</CardTitle>
            </CardHeader>
            <CardContent>
              {isStopped ? (
                <Textarea
                  value={session.manualTranscript}
                  onChange={(e) => session.setManualTranscript(e.target.value)}
                  placeholder="No speech was captured — type or paste the transcript here."
                  className="min-h-40 resize-y"
                />
              ) : (
                <div
                  className={cn(
                    "min-h-32 rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed",
                    !session.liveTranscript && "text-muted-foreground"
                  )}
                >
                  {session.liveTranscript || "Your words will appear here as you speak…"}
                </div>
              )}
            </CardContent>
          </Card>

          {isStopped && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" /> AI Summary
                </CardTitle>
                <Button
                  size="sm"
                  onClick={handleSummarize}
                  disabled={summarizing || !session.manualTranscript.trim()}
                >
                  {summarizing && <Loader2 className="size-4 animate-spin" />}
                  {aiResult ? "Regenerate" : "Generate summary"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    Generate a summary to get suggested tasks, topics, assignments, and study tips.
                  </p>
                )}

                {aiResult && (
                  <>
                    <SummaryDetails
                      topics={aiResult.topics}
                      keyPoints={aiResult.keyPoints}
                      studyTips={aiResult.studyTips}
                      dates={aiResult.dates}
                    />

                    {aiResult.tasks.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <ListChecks className="size-3.5" /> Tasks to add
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {aiResult.tasks.map((t, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckSquare className="size-3.5 text-muted-foreground" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResult.assignments.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Assignments detected
                        </p>
                        <ul className="space-y-2">
                          {aiResult.assignments.map((a, i) => (
                            <li key={i} className="flex items-center justify-between gap-3 text-sm">
                              <span>{a.text}</span>
                              {a.dueDate && (
                                <Badge variant="outline" className="shrink-0">
                                  Due {a.dueDate}
                                  {a.dueTime ? ` ${a.dueTime}` : ""}
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lesson details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="lesson-title">Title</Label>
                <Input
                  id="lesson-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={aiResult?.suggestedTitle || "e.g. Cell Membranes & Transport"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Subject</Label>
                <SubjectSelect value={subjectId} onChange={setSubjectId} />
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>Duration: {formatDuration(session.durationSec)}</span>
              </div>
              <Button
                className="mt-2 w-full"
                disabled={!isStopped || !session.manualTranscript.trim() || createLesson.isPending}
                onClick={handleSave}
              >
                {createLesson.isPending && <Loader2 className="size-4 animate-spin" />}
                Save lesson
              </Button>
              {isStopped && !aiResult && (
                <p className="text-center text-xs text-muted-foreground">
                  Tip: generate a summary first to auto-fill tasks and assignments.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
