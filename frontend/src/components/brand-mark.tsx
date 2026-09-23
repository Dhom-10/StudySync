import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </span>
      {!iconOnly && <span className="text-lg font-semibold tracking-tight">StudySync</span>}
    </div>
  );
}
