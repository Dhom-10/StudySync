"use client";

import { useState } from "react";
import { Library, Mic } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SubjectSelect } from "@/components/subjects/subject-select";
import { LessonCard } from "@/components/lessons/lesson-card";
import { useLessons } from "@/hooks/use-lessons";

export default function LessonsPage() {
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const { data: lessons, isLoading } = useLessons(subjectId ?? undefined);

  return (
    <div>
      <PageHeader
        title="My Lessons"
        description="Every recorded class, transcribed and summarized."
        actions={
          <div className="w-48">
            <SubjectSelect value={subjectId} onChange={setSubjectId} placeholder="All subjects" />
          </div>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && lessons?.length === 0 && (
        <EmptyState
          icon={Library}
          title={subjectId ? "No lessons in this subject yet" : "No lessons yet"}
          description="Record a class to see it show up here with an AI-generated summary."
          action={
            <Button render={<Link href="/record" />} nativeButton={false}>
              <Mic /> Record a lesson
            </Button>
          }
        />
      )}

      {!isLoading && lessons && lessons.length > 0 && (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
