"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BAR_COUNT = 33;
// Whisper only reads finished audio files, so the recording is cut into short, self-contained
// pieces that are handed to `onChunk` as they complete. Shorter = more "live", longer = fewer cut words.
const SEGMENT_MS = 8000;
const MIN_SEGMENT_MS = 700;

type OnChunk = (audio: Blob, seq: number, startSec: number) => Promise<void>;

/** Audio-only recorder with an elapsed timer and a rolling mic-level history for the waveform. */
export function useAudioRecorder(onChunk: OnChunk) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));
  const [error, setError] = useState<string | null>(null);

  const onChunkRef = useRef(onChunk);
  useEffect(() => {
    onChunkRef.current = onChunk;
  });

  const currentRef = useRef<MediaRecorder | null>(null);
  const segmentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Promise<void>[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  /** Returns true if the microphone started. */
  const start = useCallback(async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Couldn't access the microphone. Check the browser's permission and try again.");
      return false;
    }

    const startedAt = Date.now();
    let seq = 0;
    pendingRef.current = [];

    function beginSegment() {
      const recorder = new MediaRecorder(stream);
      const parts: Blob[] = [];
      const segmentStart = Date.now() - startedAt;
      recorder.ondataavailable = (e) => e.data.size > 0 && parts.push(e.data);
      recorder.onstop = () => {
        const duration = Date.now() - startedAt - segmentStart;
        if (duration < MIN_SEGMENT_MS || parts.length === 0) return;
        const audio = new Blob(parts, { type: recorder.mimeType });
        pendingRef.current.push(onChunkRef.current(audio, seq++, Math.floor(segmentStart / 1000)));
      };
      recorder.start();
      currentRef.current = recorder;
      segmentTimerRef.current = setTimeout(() => {
        recorder.stop();
        beginSegment();
      }, SEGMENT_MS);
    }

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    setElapsed(0);
    setLevels(Array(BAR_COUNT).fill(0));
    const tick = setInterval(() => {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
      setLevels((prev) => [...prev.slice(1), Math.min(1, (peak / 128) * 2.5)]);
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 100);

    cleanupRef.current = () => {
      clearInterval(tick);
      if (segmentTimerRef.current) clearTimeout(segmentTimerRef.current);
      stream.getTracks().forEach((t) => t.stop());
      void audioCtx.close();
    };

    beginSegment();
    setRecording(true);
    return true;
  }, []);

  /** Stops recording and resolves once the last chunk (and every earlier one) has been handed off. */
  const stop = useCallback(async () => {
    const recorder = currentRef.current;
    if (!recorder) return;
    currentRef.current = null;
    if (segmentTimerRef.current) clearTimeout(segmentTimerRef.current);
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    await Promise.all(pendingRef.current);
    pendingRef.current = [];
    cleanupRef.current?.();
    cleanupRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => () => cleanupRef.current?.(), []);

  return { recording, elapsed, levels, error, start, stop };
}
