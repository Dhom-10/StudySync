import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { decryptSecret } from "../lib/crypto";
import { summarizeTranscript } from "../lib/anthropic";
import { env } from "../lib/env";

export const summarizeRouter = Router();
summarizeRouter.use(requireAuth);

const summarizeSchema = z.object({
  transcript: z.string().trim().min(1, "Transcript is empty"),
  subjectId: z.string().trim().min(1).optional().nullable(),
});

summarizeRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { transcript, subjectId } = summarizeSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(401, "User no longer exists");

    const apiKey = user.apiKeyEncrypted ? decryptSecret(user.apiKeyEncrypted) : env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new HttpError(
        400,
        "No Anthropic API key configured. Add one in Settings before generating a summary."
      );
    }

    let subjectName: string | null = null;
    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId: req.user!.id },
      });
      subjectName = subject?.name ?? null;
    }

    try {
      const summary = await summarizeTranscript(transcript, { apiKey, subjectName });
      res.json({ summary });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to summarize transcript";
      throw new HttpError(502, message);
    }
  })
);
