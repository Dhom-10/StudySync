export function parseDueDate(dueDate: string | null, dueTime: string | null): Date | null {
  if (!dueDate) return null;
  const iso = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T23:59:59`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isOverdue(dueDate: string | null, dueTime: string | null, done: boolean): boolean {
  if (done) return false;
  const d = parseDueDate(dueDate, dueTime);
  if (!d) return false;
  return d.getTime() < Date.now();
}

export function isDueSoon(
  dueDate: string | null,
  dueTime: string | null,
  done: boolean,
  withinHours = 72
): boolean {
  if (done) return false;
  const d = parseDueDate(dueDate, dueTime);
  if (!d) return false;
  const diffHours = (d.getTime() - Date.now()) / (1000 * 60 * 60);
  return diffHours >= -1 && diffHours <= withinHours;
}

export function formatDueDate(dueDate: string | null, dueTime: string | null): string {
  if (!dueDate) return "No due date";
  const d = parseDueDate(dueDate, dueTime);
  if (!d) return dueDate;
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!dueTime) return datePart;
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

export function formatDuration(durationSec: number): string {
  const totalMinutes = Math.round(durationSec / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
