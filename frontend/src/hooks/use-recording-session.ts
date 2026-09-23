"use client";

import { useCallback, useMemo, useState } from "react";
import { useAudioRecorder } from "./use-audio-recorder";
import { useSpeechRecognition } from "./use-speech-recognition";
import { useWakeLock } from "./use-wake-lock";

export type SessionPhase = "idle" | "recording" | "paused" | "stopped";

export function useRecordingSession() {
  const audio = useAudioRecorder();
  const speech = useSpeechRecognition();
  const [manualTranscript, setManualTranscript] = useState("");

  const phase: SessionPhase =
    audio.status === "recording"
      ? "recording"
      : audio.status === "paused"
        ? "paused"
        : audio.status === "stopped" || audio.status === "error"
          ? "stopped"
          : "idle";

  useWakeLock(phase === "recording");

  const start = useCallback(async () => {
    setManualTranscript("");
    speech.reset();
    await audio.start();
    if (speech.supported) speech.start();
  }, [audio, speech]);

  const pause = useCallback(() => {
    audio.pause();
    if (speech.listening) speech.stop();
  }, [audio, speech]);

  const resume = useCallback(() => {
    audio.resume();
    if (speech.supported) speech.start();
  }, [audio, speech]);

  const stop = useCallback(() => {
    audio.stop();
    speech.stop();
    setManualTranscript(speech.finalTranscript.trim());
  }, [audio, speech]);

  const reset = useCallback(() => {
    audio.reset();
    speech.reset();
    setManualTranscript("");
  }, [audio, speech]);

  const liveTranscript = useMemo(
    () => `${speech.finalTranscript}${speech.interimTranscript}`.trim(),
    [speech.finalTranscript, speech.interimTranscript]
  );

  // Once stopped, fall back to a manually-editable transcript seeded from what was captured.
  const transcript = phase === "stopped" ? manualTranscript : liveTranscript;

  return {
    phase,
    durationSec: audio.durationSec,
    analyser: audio.analyser,
    audioError: audio.error,
    speechSupported: speech.supported,
    speechError: speech.error,
    liveTranscript,
    transcript,
    manualTranscript,
    setManualTranscript,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
