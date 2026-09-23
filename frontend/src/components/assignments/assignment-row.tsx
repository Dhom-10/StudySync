"use client";

import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AssignmentFormDialog } from "./assignment-form-dialog";
import { useDeleteAssignment, useUpdateAssignment } from "@/hooks/use-assignments";
import { formatDueDate, isOverdue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Assignment } from "@/lib/types";

export function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const overdue = isOverdue(assignment.dueDate, assignment.dueTime, assignment.done);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Checkbox
        checked={assignment.done}
        onCheckedChange={(checked) =>
          updateAssignment.mutate({ id: assignment.id, data: { done: Boolean(checked) } })
        }
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", assignment.done && "text-muted-foreground line-through")}>
          {assignment.text}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {assignment.dueDate && (
            <span className={cn("text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
              {overdue ? "Overdue — " : "Due "}
              {formatDueDate(assignment.dueDate, assignment.dueTime)}
            </span>
          )}
          {assignment.lesson && (
            <Badge variant="outline" className="text-[10px]">
              {assignment.lesson.title}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <AssignmentFormDialog
          assignment={assignment}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Edit assignment">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label="Delete assignment" />}>
            <Trash2 className="size-4 text-destructive" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
              <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteAssignment.mutate(assignment.id, { onSuccess: () => toast.success("Assignment deleted") })
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
