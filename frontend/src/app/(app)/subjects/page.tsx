"use client";

import { useState } from "react";
import { Plus, Tags, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectFormDialog } from "@/components/subjects/subject-form-dialog";
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
import { useSubjects, useDeleteSubject } from "@/hooks/use-subjects";
import { toast } from "sonner";
import type { Subject } from "@/lib/types";

export default function SubjectsPage() {
  const { data: subjects, isLoading } = useSubjects();
  const deleteSubject = useDeleteSubject();
  const [editing, setEditing] = useState<Subject | null>(null);

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Organize your lessons by class."
        actions={
          <SubjectFormDialog
            trigger={
              <Button>
                <Plus /> New subject
              </Button>
            }
          />
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && subjects?.length === 0 && (
        <EmptyState
          icon={Tags}
          title="No subjects yet"
          description="Create a subject to start organizing your recorded lessons."
          action={
            <SubjectFormDialog
              trigger={
                <Button variant="outline">
                  <Plus /> New subject
                </Button>
              }
            />
          }
        />
      )}

      {!isLoading && subjects && subjects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="flex flex-row items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-4 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{subject.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {subject.lessonCount} {subject.lessonCount === 1 ? "lesson" : "lessons"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(subject)} aria-label="Edit subject">
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label="Delete subject" />}>
                    <Trash2 className="size-4 text-destructive" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete “{subject.name}”?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Lessons in this subject won&apos;t be deleted — they&apos;ll just lose their subject
                        tag. This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteSubject.mutate(subject.id, {
                            onSuccess: () => toast.success("Subject deleted"),
                          })
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <SubjectFormDialog subject={editing} open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} />
      )}
    </div>
  );
}
