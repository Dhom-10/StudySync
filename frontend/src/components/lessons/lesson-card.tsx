"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Clock, FileText, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SummaryDetails } from "@/components/lessons/summary-details";
import { useDeleteLesson, useToggleTask } from "@/hooks/use-lessons";
import { formatDuration } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/types";

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const [expanded, setExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const toggleTask = useToggleTask();
  const deleteLesson = useDeleteLesson();

  const doneCount = lesson.tasks.filter((t) => t.done).length;
  const createdAt = new Date(lesson.createdAt);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{lesson.title}</p>
            {lesson.subject && (
              <Badge
                variant="outline"
                className="gap-1.5 border-transparent"
                style={{ backgroundColor: `${lesson.subject.color}1a`, color: lesson.subject.color }}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: lesson.subject.color }} />
                {lesson.subject.name}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              {createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {formatDuration(lesson.durationSec)}
            </span>
            {lesson.tasks.length > 0 && (
              <span>
                {doneCount}/{lesson.tasks.length} tasks done
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <CardContent className="space-y-6 border-t pt-5">
          {lesson.summary && (
            <SummaryDetails
              topics={lesson.summary.topics}
              keyPoints={lesson.summary.keyPoints}
              studyTips={lesson.summary.studyTips}
              dates={lesson.summary.dates}
            />
          )}

          {lesson.tasks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tasks</p>
              <ul className="space-y-2">
                {lesson.tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2.5">
                    <Checkbox
                      checked={task.done}
                      onCheckedChange={(checked) =>
                        toggleTask.mutate({ lessonId: lesson.id, taskId: task.id, done: Boolean(checked) })
                      }
                    />
                    <span className={cn("text-sm", task.done && "text-muted-foreground line-through")}>
                      {task.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowTranscript((v) => !v)}>
              <FileText className="size-3.5" /> {showTranscript ? "Hide transcript" : "View transcript"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" />}
              >
                <Trash2 className="size-3.5" /> Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete “{lesson.title}”?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This deletes the transcript, summary, tasks, and any assignments generated from this
                    lesson. This can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deleteLesson.mutate(lesson.id, { onSuccess: () => toast.success("Lesson deleted") })
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {showTranscript && (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {lesson.transcript || "No transcript recorded."}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
