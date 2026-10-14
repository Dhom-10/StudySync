"use client";

import { useCallback, useRef, useState } from "react";
import type { SpeechRecognitionLike } from "@/lib/speech-recognition-types";

export function useSpeechRecognition() {
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const supported =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          setFinalTranscript((prev) => `${prev} ${text}`.trim());
        } else {
          interim += text;
        }
      }
      setInterimTranscript(interim);
    };
    recognition.onerror = (event) => {
      const err = (event as Event & { error?: string }).error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setError("Microphone access was blocked, so live transcription is off.");
      } else if (err !== "no-speech" && err !== "aborted") {
        setError("Live transcription hit a snag. You can keep recording and fix the transcript after.");
      }
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setInterimTranscript("");
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return { supported, listening, finalTranscript, interimTranscript, error, start, stop, reset };
}
