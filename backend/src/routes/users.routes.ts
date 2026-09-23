import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { encryptSecret } from "../lib/crypto";

export const usersRouter = Router();
usersRouter.use(requireAuth);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  notifyEnabled: z.boolean().optional(),
});

usersRouter.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        notifyEnabled: user.notifyEnabled,
        createdAt: user.createdAt,
        hasApiKey: Boolean(user.apiKeyEncrypted),
      },
    });
  })
);

const apiKeySchema = z.object({
  apiKey: z.string().trim().min(10, "That doesn't look like a valid API key"),
});

usersRouter.put(
  "/me/api-key",
  asyncHandler(async (req, res) => {
    const { apiKey } = apiKeySchema.parse(req.body);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { apiKeyEncrypted: encryptSecret(apiKey) },
    });
    res.json({ hasApiKey: true });
  })
);

usersRouter.delete(
  "/me/api-key",
  asyncHandler(async (req, res) => {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { apiKeyEncrypted: null },
    });
    res.json({ hasApiKey: false });
  })
);

const resetSchema = z.object({
  confirm: z.literal("RESET"),
});

usersRouter.delete(
  "/me/data",
  asyncHandler(async (req, res) => {
    const { confirm } = resetSchema.parse(req.body);
    if (confirm !== "RESET") {
      throw new HttpError(400, 'Type "RESET" to confirm');
    }
    const userId = req.user!.id;
    await prisma.$transaction([
      prisma.assignment.deleteMany({ where: { userId } }),
      prisma.lesson.deleteMany({ where: { userId } }),
      prisma.subject.deleteMany({ where: { userId } }),
    ]);
    res.status(204).end();
  })
);
