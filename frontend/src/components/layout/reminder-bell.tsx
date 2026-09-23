"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDueSoonAssignments } from "@/hooks/use-reminders";
import { formatDueDate } from "@/lib/dates";
import { isOverdue } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function ReminderBell() {
  const dueSoon = useDueSoonAssignments();

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative" aria-label="Reminders" />}>
        <Bell className="size-5" />
        {dueSoon.length > 0 && (
          <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
            {dueSoon.length}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">Due soon</p>
          <p className="text-xs text-muted-foreground">Assignments due within 3 days, or overdue.</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {dueSoon.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing due soon. Nice.</p>
          )}
          {dueSoon.map((a) => {
            const overdue = isOverdue(a.dueDate, a.dueTime, a.done);
            return (
              <div key={a.id} className="border-b px-4 py-3 last:border-b-0">
                <p className="text-sm font-medium leading-snug">{a.text}</p>
                <p className={cn("mt-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
                  {overdue ? "Overdue — " : "Due "}
                  {formatDueDate(a.dueDate, a.dueTime)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="border-t p-2">
          <Button
            render={<Link href="/assignments" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="w-full justify-center"
          >
            View all assignments
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
