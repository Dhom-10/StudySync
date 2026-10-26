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

async function callOllama(transcript: string): Promise<unknown> {
  const today = new Date().toISOString().slice(0, 10);
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
            `You summarize a student's lecture transcript in plain language. Today is ${today}. ` +
            "Return topics (short names), keyPoints (one sentence each), assignments the teacher mentioned " +
            "(dueDate as YYYY-MM-DD resolved from today's date, or null if unclear), tasks the student should do, " +
            "and one studyTip. Use empty arrays when nothing applies. Do not invent things not in the transcript.",
        },
        { role: "user", content: transcript.slice(0, MAX_TRANSCRIPT_CHARS) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as { message?: { content?: string } };
  return JSON.parse(body.message?.content ?? "");
}

export async function summarize(transcript: string): Promise<Summary> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return summarySchema.parse(await callOllama(transcript));
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Could not get a valid summary from Ollama: ${lastError instanceof Error ? lastError.message : lastError}`);
}
