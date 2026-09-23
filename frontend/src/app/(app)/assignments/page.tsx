"use client";

import { useMemo } from "react";
import { ListChecks, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentFormDialog } from "@/components/assignments/assignment-form-dialog";
import { AssignmentRow } from "@/components/assignments/assignment-row";
import { useAssignments } from "@/hooks/use-assignments";
import { isOverdue } from "@/lib/dates";
import type { Assignment } from "@/lib/types";

function Section({ title, items }: { title: string; items: Assignment[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <Card className="divide-y overflow-hidden py-0">
        {items.map((a) => (
          <AssignmentRow key={a.id} assignment={a} />
        ))}
      </Card>
    </div>
  );
}

export default function AssignmentsPage() {
  const { data: assignments, isLoading } = useAssignments();

  const groups = useMemo(() => {
    const list = assignments ?? [];
    const pending = list.filter((a) => !a.done);
    const done = list.filter((a) => a.done);
    const overdue = pending.filter((a) => isOverdue(a.dueDate, a.dueTime, a.done));
    const withDate = pending.filter((a) => a.dueDate && !isOverdue(a.dueDate, a.dueTime, a.done));
    const noDate = pending.filter((a) => !a.dueDate);
    return { overdue, upcoming: withDate, noDate, done };
  }, [assignments]);

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Aggregated from your lessons, plus anything you add manually."
        actions={
          <AssignmentFormDialog
            trigger={
              <Button>
                <Plus /> Add assignment
              </Button>
            }
          />
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && assignments?.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="No assignments yet"
          description="Assignments detected in your lessons will show up here automatically, or add one yourself."
          action={
            <AssignmentFormDialog
              trigger={
                <Button variant="outline">
                  <Plus /> Add assignment
                </Button>
              }
            />
          }
        />
      )}

      {!isLoading && assignments && assignments.length > 0 && (
        <div className="space-y-6">
          <Section title="Overdue" items={groups.overdue} />
          <Section title="Upcoming" items={groups.upcoming} />
          <Section title="No due date" items={groups.noDate} />
          <Section title="Completed" items={groups.done} />
        </div>
      )}
    </div>
  );
}
