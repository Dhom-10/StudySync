"use client";

import { useEffect, useMemo } from "react";
import { useAssignments } from "./use-assignments";
import { useCurrentUser } from "./use-auth";
import { isDueSoon, isOverdue } from "@/lib/dates";
import { useUiStore } from "@/store/ui-store";

export function useDueSoonAssignments() {
  const { data: assignments = [] } = useAssignments();
  return useMemo(
    () =>
      assignments
        .filter((a) => isDueSoon(a.dueDate, a.dueTime, a.done) || isOverdue(a.dueDate, a.dueTime, a.done))
        .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")),
    [assignments]
  );
}

/** Fires a browser Notification for newly due-soon assignments, once per assignment per session. */
export function useReminderNotifications() {
  const { data: user } = useCurrentUser();
  const dueSoon = useDueSoonAssignments();
  const notifiedIds = useUiStore((s) => s.notifiedAssignmentIds);
  const markNotified = useUiStore((s) => s.markNotified);

  useEffect(() => {
    if (!user?.notifyEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    for (const assignment of dueSoon) {
      if (notifiedIds.has(assignment.id)) continue;
      new Notification("StudySync — assignment due soon", {
        body: assignment.text,
        tag: assignment.id,
      });
      markNotified(assignment.id);
    }
  }, [dueSoon, user?.notifyEnabled, notifiedIds, markNotified]);
}
