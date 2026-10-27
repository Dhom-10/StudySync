import { cn } from "@/lib/utils";

// Share of one cycle spent travelling along the text; the rest is the pause before the next pass.
const TRAVEL_SHARE = 0.55;

/**
 * Text with a band of light that sweeps across it, character by character, then rests and repeats.
 * Use it for "something is being generated" states. Pair with `role="status"` on the parent so
 * screen readers announce it once.
 */
export function ShimmeringText({
  text,
  baseColor = "var(--muted-foreground)",
  shimmerColor = "var(--foreground)",
  duration = 2000,
  wave = false,
  className,
}: {
  text: string;
  baseColor?: string;
  shimmerColor?: string;
  /** Milliseconds for one pass plus the rest before the next. */
  duration?: number;
  /** Characters also lift slightly as the light passes. */
  wave?: boolean;
  className?: string;
}) {
  const chars = Array.from(text);
  const step = (duration * TRAVEL_SHARE) / Math.max(chars.length, 1);

  return (
    <span
      data-slot="shimmering-text"
      className={cn("whitespace-pre-wrap", className)}
      style={
        {
          "--shimmering-text-color": baseColor,
          "--shimmering-text-shimmer-color": shimmerColor,
          "--shimmering-text-duration": `${duration}ms`,
          ...(wave ? { "--shimmering-text-lift": "-0.12em" } : {}),
        } as React.CSSProperties
      }
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((char, i) =>
          char === "\n" ? (
            <br key={i} />
          ) : (
            <span
              key={i}
              className="shimmering-text-char inline-block whitespace-pre"
              style={{ "--shimmering-text-delay": `${Math.round(i * step)}ms` } as React.CSSProperties}
            >
              {char}
            </span>
          )
        )}
      </span>
    </span>
  );
}
