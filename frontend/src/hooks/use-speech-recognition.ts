"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@/lib/speech-recognition-types";
import type { SpeechRecognitionLike } from "@/lib/speech-recognition-types";

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldRestartRef = useRef(false);

  // Feature detection has to run client-side (no `window` during SSR), so it
  // can't be computed during render — an effect is the only option here.
  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(Boolean(Ctor));
  }, []);

  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Live transcription isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    setError(null);
    shouldRestartRef.current = true;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += `${text} `;
        } else {
          interim += text;
        }
      }
      if (finalChunk) {
        setFinalTranscript((prev) => `${prev}${finalChunk}`);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was blocked. Allow it in your browser settings to transcribe live.");
        shouldRestartRef.current = false;
      } else if (event.error === "audio-capture") {
        setError("No microphone was found. Plug one in and try again.");
        shouldRestartRef.current = false;
      } else {
        setError(`Transcription error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setInterimTranscript("");
      // The API stops after pauses in speech; restart transparently while recording.
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          // already starting/started — ignore
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Couldn't start live transcription. Try again.");
    }
  }, []);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { supported, listening, finalTranscript, interimTranscript, error, start, stop, reset };
}
