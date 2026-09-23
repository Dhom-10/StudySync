"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export type RecorderStatus = "idle" | "starting" | "recording" | "paused" | "stopped" | "error";

export interface UseAudioRecorderResult {
  status: RecorderStatus;
  error: string | null;
  durationSec: number;
  audioBlob: Blob | null;
  analyser: AnalyserNode | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

/** Captures microphone audio locally (MediaRecorder) and exposes an AnalyserNode for a waveform. */
export function useAudioRecorder(): UseAudioRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setAnalyser(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus("starting");
    setDurationSec(0);
    setAudioBlob(null);
    chunksRef.current = [];

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser doesn't support microphone recording.");
      setStatus("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      stream.getAudioTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          setError("Microphone disconnected. Recording stopped.");
          setStatus((prev) => (prev === "recording" || prev === "paused" ? "error" : prev));
        });
      });

      const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        source.connect(analyserNode);
        audioCtxRef.current = ctx;
        setAnalyser(analyserNode);
      }

      const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find(
        (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      };
      recorderRef.current = recorder;
      recorder.start(1000);

      timerRef.current = setInterval(() => setDurationSec((d) => d + 1), 1000);
      setStatus("recording");
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was denied. Allow it in your browser settings and try again."
          : "Couldn't access the microphone.";
      setError(message);
      setStatus("error");
      cleanup();
    }
  }, [cleanup]);

  const pause = useCallback(() => {
    if (recorderRef.current?.state !== "recording") return;
    recorderRef.current.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state !== "paused") return;
    recorderRef.current.resume();
    timerRef.current = setInterval(() => setDurationSec((d) => d + 1), 1000);
    setStatus("recording");
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setStatus((prev) => (prev === "error" ? prev : "stopped"));
    cleanup();
  }, [cleanup]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setDurationSec(0);
    setAudioBlob(null);
    chunksRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { status, error, durationSec, audioBlob, analyser, start, pause, resume, stop, reset };
}
