"use client";

import { useState } from "react";
import { WritingWord, writingDelays } from "@/components/ui/writing-text";

export const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

/**
 * Words revealed with the same effect as the page titles (see WritingText): each word rises into
 * place, and longer words and punctuation hold the next one back.
 *
 * For text that grows (a live transcript), words that already appeared keep their timing, so only
 * the newly added words animate, each paced from the moment it was added.
 */
export function Words({
  words,
  animate,
  speed = 20,
}: {
  words: string[];
  animate: boolean;
  speed?: number;
}) {
  const [delays, setDelays] = useState<number[]>(() =>
    writingDelays(words, speed),
  );
  if (words.length > delays.length) {
    // derived state: assign delays to the words that are new in this render
    setDelays([...delays, ...writingDelays(words.slice(delays.length), speed)]);
  }

  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && " "}
          {animate ? (
            <WritingWord delay={delays[i] ?? 0}>{word}</WritingWord>
          ) : (
            <span className="inline-block">{word}</span>
          )}
        </span>
      ))}
    </>
  );
}
