import { z } from "zod";

export const summarySchema = z.object({
  topics: z.array(z.string()),
  keyPoints: z.array(z.string()),
  assignments: z.array(z.object({ title: z.string(), dueDate: z.string().nullable() })),
  tasks: z.array(z.string()),
  studyTip: z.string(),
});

export type Summary = z.infer<typeof summarySchema>;

// Keeps a long lecture inside the 3B model's context window (roughly 6k tokens).
const MAX_TRANSCRIPT_CHARS = 24_000;

// Small models are unreliable at date math, so hand them a weekday-labelled list to copy from.
function upcomingDays() {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" });
  return Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return `${weekday.format(d)} ${iso}`;
  });
}

async function callOllama(transcript: string): Promise<unknown> {
  const calendar = upcomingDays();
  const res = await fetch(`${process.env.OLLAMA_URL ?? "http://localhost:11434"}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL ?? "llama3.2:3b",
      stream: false,
      format: z.toJSONSchema(summarySchema),
      options: { temperature: 0.2 },
      messages: [
        {
          role: "system",
          content:
            `You summarize a student's spoken transcript in plain language. Today is ${calendar[0]}. Dates for the next two weeks: ${calendar.join(", ")}. ` +
            "The transcript may be very short, even a single sentence. " +
            "Always return at least one topic (a short name) and at least one keyPoint (one sentence; a plain " +
            "restatement of what was said is fine). " +
            "Also return assignments the speaker mentioned (dueDate as YYYY-MM-DD copied from the date list above, or null " +
            "if unclear) and tasks the student should do, but only if the transcript actually mentions them; " +
            "otherwise use an empty array. Give a studyTip only if it follows naturally from the content, " +
            "otherwise an empty string. Do not invent things that are not in the transcript.",
        },
        { role: "user", content: transcript.slice(0, MAX_TRANSCRIPT_CHARS) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as { message?: { content?: string } };
  return JSON.parse(body.message?.content ?? "");
}

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export async function summarize(transcript: string): Promise<Summary> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const summary = summarySchema.parse(await callOllama(transcript));
      // A real sentence should always yield something; an all-empty answer is the model giving up, so retry.
      if (wordCount(transcript) >= 3 && !summary.topics.length && !summary.keyPoints.length) {
        throw new Error("The model returned no topics or key points");
      }
      return summary;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Could not get a valid summary from Ollama: ${lastError instanceof Error ? lastError.message : lastError}`);
}
