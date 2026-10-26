"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders one line of text scaled so it spans exactly the width of its container.
 * (Text width depends on the font, so the size is measured instead of guessed from the viewport.)
 */
export function FitText({ children, className }: { children: string; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    // Text width scales linearly with font size, so one measurement gives the exact size.
    const fit = () => {
      const current = parseFloat(getComputedStyle(text).fontSize);
      const width = text.getBoundingClientRect().width;
      if (!width || !box.clientWidth) return;
      setFontSize(Math.round(((current * box.clientWidth) / width) * 10) / 10);
    };

    const frame = requestAnimationFrame(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    void document.fonts?.ready.then(fit); // re-measure once the real font has loaded
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [children]);

  return (
    <div ref={boxRef} className="w-full">
      <span ref={textRef} className={cn("inline-block whitespace-nowrap", className)} style={{ fontSize }}>
        {children}
      </span>
    </div>
  );
}
