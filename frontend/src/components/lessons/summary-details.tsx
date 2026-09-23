import { Badge } from "@/components/ui/badge";
import { CalendarDays, Lightbulb, Sparkles } from "lucide-react";

export function SummaryDetails({
  topics,
  keyPoints,
  studyTips,
  dates,
}: {
  topics: string[];
  keyPoints: string[];
  studyTips: string[];
  dates: string[];
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {topics.length > 0 && (
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Topics</p>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t, i) => (
              <Badge key={i} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {keyPoints.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Sparkles className="size-3.5" /> Key points
          </p>
          <ul className="space-y-1.5 text-sm">
            {keyPoints.map((k, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                {k}
              </li>
            ))}
          </ul>
        </div>
      )}

      {studyTips.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="size-3.5" /> Study tips
          </p>
          <ul className="space-y-1.5 text-sm">
            {studyTips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dates.length > 0 && (
        <div className="sm:col-span-2">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="size-3.5" /> Other dates mentioned
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {dates.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
