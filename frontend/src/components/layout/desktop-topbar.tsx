"use client";

import { ReminderBell } from "./reminder-bell";
import { ThemeToggle } from "./theme-toggle";

export function DesktopTopBar() {
  return (
    <div className="hidden items-center justify-end gap-1 border-b border-border px-6 py-2.5 md:flex">
      <ReminderBell />
      <ThemeToggle />
    </div>
  );
}
