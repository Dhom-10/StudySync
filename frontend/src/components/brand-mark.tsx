import { cn } from "@/lib/utils";

function LogoMark() {
  return (
    <div className="flex size-[30px] shrink-0 items-center justify-center gap-[3px] rounded-full bg-foreground sm:size-[38px]">
      <span className="h-2 w-[3px] rounded-[2px] bg-highlight sm:h-[10px]" />
      <span className="h-3.5 w-[3px] rounded-[2px] bg-highlight sm:h-[18px]" />
      <span className="h-2.5 w-[3px] rounded-[2px] bg-highlight sm:h-[12px]" />
    </div>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 sm:gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-[-0.03em] sm:text-[26px]">
        StudySync
      </span>
    </span>
  );
}
