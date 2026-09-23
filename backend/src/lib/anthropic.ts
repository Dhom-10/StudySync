import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";

export interface LessonSummary {
  suggestedTitle: string;
  tasks: string[];
  topics: string[];
  assignments: { text: string; dueDate: string | null; dueTime: string | null }[];
  keyPoints: string[];
  dates: string[];
  studyTips: string[];
}

const SYSTEM_PROMPT = `You are StudySync's lesson summarizer. You turn a raw, often messy, speech-to-text
transcript of a recorded class into a structured study aid for the student who recorded it.

Rules:
- Respond with ONLY a single JSON object, no markdown fences, no commentary.
- Use this exact shape:
  {
    "suggestedTitle": string,             // short, specific title for the lesson (max ~8 words)
    "tasks": string[],                    // actionable to-dos implied by the lecture (e.g. "Review chapter 4")
    "topics": string[],                   // main topics/concepts covered, short phrases
    "assignments": [
      { "text": string, "dueDate": string | null, "dueTime": string | null }
    ],                                    // graded/homework items mentioned. dueDate as YYYY-MM-DD if a date is
                                           // stated or clearly inferable, else null. dueTime as HH:MM 24h, else null.
    "keyPoints": string[],                // the most important facts/ideas a student should remember
    "dates": string[],                    // any other notable dates mentioned (exams, events), as free text
    "studyTips": string[]                 // 2-5 concrete tips for studying this specific material
  }
- If the transcript is too short or empty to summarize meaningfully, still return valid JSON with best-effort
  or empty arrays, and suggestedTitle "Untitled Lesson".
- Never invent due dates that were not stated or strongly implied.
- Keep arrays concise: prefer 3-8 items over exhaustive lists.`;

function clientFor(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

export async function summarizeTranscript(
  transcript: string,
  opts: { apiKey: string; subjectName?: string | null }
): Promise<LessonSummary> {
  const anthropic = clientFor(opts.apiKey);

  const userContent = [
    opts.subjectName ? `Subject: ${opts.subjectName}` : null,
    "Transcript:",
    transcript,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic response contained no text content");
  }

  return parseSummaryJson(textBlock.text);
}

function parseSummaryJson(raw: string): LessonSummary {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse Claude's response as JSON");
  }

  const d = data as Record<string, unknown>;
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const assignments = Array.isArray(d.assignments)
    ? (d.assignments as unknown[])
        .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
        .map((a) => ({
          text: typeof a.text === "string" ? a.text : "",
          dueDate: typeof a.dueDate === "string" ? a.dueDate : null,
          dueTime: typeof a.dueTime === "string" ? a.dueTime : null,
        }))
        .filter((a) => a.text.length > 0)
    : [];

  return {
    suggestedTitle: typeof d.suggestedTitle === "string" ? d.suggestedTitle : "Untitled Lesson",
    tasks: asStringArray(d.tasks),
    topics: asStringArray(d.topics),
    assignments,
    keyPoints: asStringArray(d.keyPoints),
    dates: asStringArray(d.dates),
    studyTips: asStringArray(d.studyTips),
  };
}
