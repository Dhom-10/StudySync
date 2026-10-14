"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioStatus = "idle" | "recording" | "paused" | "stopped" | "error";

export function useAudioRecorder() {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [durationSec, setDurationSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    setAnalyser(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setDurationSec(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      source.connect(node);
      setAnalyser(node);
      setStatus("recording");
      clearTimer();
      intervalRef.current = setInterval(() => setDurationSec((d) => d + 1), 1000);
    } catch {
      setError("Couldn't access your microphone. Check your browser permissions and try again.");
      setStatus("error");
    }
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus("paused");
  }, [clearTimer]);

  const resume = useCallback(() => {
    setStatus("recording");
    clearTimer();
    intervalRef.current = setInterval(() => setDurationSec((d) => d + 1), 1000);
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    cleanupStream();
    setStatus("stopped");
  }, [clearTimer, cleanupStream]);

  const reset = useCallback(() => {
    clearTimer();
    cleanupStream();
    setDurationSec(0);
    setError(null);
    setStatus("idle");
  }, [clearTimer, cleanupStream]);

  useEffect(() => {
    return () => {
      clearTimer();
      cleanupStream();
    };
  }, [clearTimer, cleanupStream]);

  return { status, durationSec, analyser, error, start, pause, resume, stop, reset };
}
