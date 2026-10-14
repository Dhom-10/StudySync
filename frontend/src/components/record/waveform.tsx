"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 44;

export function Waveform({
  analyser,
  active,
  className,
}: {
  analyser: AnalyserNode | null;
  active: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const style = getComputedStyle(document.documentElement);
    const barColor = style.getPropertyValue("--foreground").trim() || "#111111";
    const idleColor = style.getPropertyValue("--border").trim() || "#111111";
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    function bar(x: number, h: number, barWidth: number, height: number) {
      const y = height - h;
      const r = Math.min(barWidth / 2, 2 * dpr);
      ctx!.beginPath();
      if (typeof ctx!.roundRect === "function") {
        ctx!.roundRect(x, y, barWidth, h, r);
      } else {
        ctx!.rect(x, y, barWidth, h);
      }
      ctx!.fill();
    }

    const draw = () => {
      const { width, height } = canvas;
      ctx!.clearRect(0, 0, width, height);
      const barWidth = Math.max(2 * dpr, (width / BAR_COUNT) * 0.5);
      const gap = BAR_COUNT > 1 ? (width - barWidth * BAR_COUNT) / (BAR_COUNT - 1) : 0;

      if (!active || !analyser || !data) {
        ctx!.fillStyle = idleColor;
        ctx!.globalAlpha = 0.3;
        for (let i = 0; i < BAR_COUNT; i++) {
          bar(i * (barWidth + gap), 4 * dpr, barWidth, height);
        }
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      analyser.getByteTimeDomainData(data);
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = barColor;
      const samplesPerBar = Math.max(1, Math.floor(data.length / BAR_COUNT));
      for (let i = 0; i < BAR_COUNT; i++) {
        let peak = 0;
        for (let j = 0; j < samplesPerBar; j++) {
          const v = Math.abs(data[i * samplesPerBar + j] / 128 - 1);
          if (v > peak) peak = v;
        }
        const h = Math.max(4 * dpr, peak * height * 0.95);
        bar(i * (barWidth + gap), h, barWidth, height);
      }
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, active]);

  return <canvas ref={canvasRef} className={className} />;
}
