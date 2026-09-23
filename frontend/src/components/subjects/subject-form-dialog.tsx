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
import { SUBJECT_COLORS } from "@/lib/colors";
import { useCreateSubject, useUpdateSubject } from "@/hooks/use-subjects";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Subject } from "@/lib/types";
import { ApiError } from "@/lib/api";

// Mounted only while the dialog is open, so its form state always starts fresh —
// no effect needed to re-sync fields when switching between "create" and "edit".
function SubjectFormBody({ subject, onDone }: { subject?: Subject; onDone: () => void }) {
  const [name, setName] = useState(subject?.name ?? "");
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const isPending = createSubject.isPending || updateSubject.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return;

    const onError = (err: unknown) =>
      setError(err instanceof ApiError ? err.message : "Something went wrong.");

    if (subject) {
      updateSubject.mutate(
        { id: subject.id, data: { name: trimmed, color } },
        { onSuccess: () => { toast.success("Subject updated"); onDone(); }, onError }
      );
    } else {
      createSubject.mutate(
        { name: trimmed, color },
        { onSuccess: () => { toast.success("Subject created"); onDone(); }, onError }
      );
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{subject ? "Edit subject" : "New subject"}</DialogTitle>
        <DialogDescription>
          {subject ? "Rename or recolor this subject." : "Subjects help you organize lessons and filter your library."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="subject-name">Name</Label>
          <Input
            id="subject-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Organic Chemistry"
            autoFocus
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Choose color ${c}`}
                onClick={() => setColor(c)}
                className={cn(
                  "size-8 rounded-full border-2 transition-transform",
                  color === c ? "scale-110 border-foreground" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {subject ? "Save changes" : "Create subject"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SubjectFormDialog({
  subject,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  subject?: Subject;
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
        {open && <SubjectFormBody subject={subject} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
