"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useCreateAssignment, useUpdateAssignment } from "@/hooks/use-assignments";
import type { Assignment } from "@/lib/types";

// Mounted only while the dialog is open, so its form state always starts fresh —
// no effect needed to re-sync fields when switching between "create" and "edit".
function AssignmentFormBody({ assignment, onDone }: { assignment?: Assignment; onDone: () => void }) {
  const [text, setText] = useState(assignment?.text ?? "");
  const [dueDate, setDueDate] = useState(assignment?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(assignment?.dueTime ?? "");
  const [error, setError] = useState<string | null>(null);

  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const isPending = createAssignment.isPending || updateAssignment.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) return;

    const onError = (err: unknown) => setError(err instanceof ApiError ? err.message : "Something went wrong.");
    const payload = { text: trimmed, dueDate: dueDate || null, dueTime: dueTime || null };

    if (assignment) {
      updateAssignment.mutate(
        { id: assignment.id, data: payload },
        { onSuccess: () => { toast.success("Assignment updated"); onDone(); }, onError }
      );
    } else {
      createAssignment.mutate(payload, {
        onSuccess: () => { toast.success("Assignment added"); onDone(); },
        onError,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{assignment ? "Edit assignment" : "Add assignment"}</DialogTitle>
        <DialogDescription>
          {assignment ? "Update the details for this assignment." : "Manually track homework that wasn't caught from a lesson."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="assignment-text">What&apos;s due</Label>
          <Input
            id="assignment-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Problem set 4"
            autoFocus
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="assignment-date">Due date</Label>
            <Input
              id="assignment-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="assignment-time">Due time</Label>
            <Input
              id="assignment-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={!dueDate}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {assignment ? "Save changes" : "Add assignment"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AssignmentFormDialog({
  assignment,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  assignment?: Assignment;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        {open && <AssignmentFormBody assignment={assignment} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
