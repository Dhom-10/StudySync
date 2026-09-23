"use client";

import { useEffect, useRef } from "react";

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
    const primary = style.getPropertyValue("--primary").trim() || "#2F8F5B";
    const idleColor = style.getPropertyValue("--muted-foreground").trim() || "#6b7a70";
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      const { width, height } = canvas;
      ctx!.clearRect(0, 0, width, height);

      if (!active || !analyser || !data) {
        // idle flat line
        ctx!.strokeStyle = idleColor;
        ctx!.globalAlpha = 0.35;
        ctx!.lineWidth = 2 * dpr;
        ctx!.beginPath();
        ctx!.moveTo(0, height / 2);
        ctx!.lineTo(width, height / 2);
        ctx!.stroke();
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      analyser.getByteTimeDomainData(data);
      ctx!.globalAlpha = 1;
      ctx!.lineWidth = 2.5 * dpr;
      ctx!.strokeStyle = primary;
      ctx!.beginPath();
      const sliceWidth = width / data.length;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128 - 1;
        const y = height / 2 + v * (height / 2) * 0.85;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
        x += sliceWidth;
      }
      ctx!.stroke();
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
