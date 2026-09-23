import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";

export const subjectsRouter = Router();
subjectsRouter.use(requireAuth);

const subjectSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "color must be a hex value like #2F8F5B")
    .default("#2F8F5B"),
});

subjectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const subjects = await prisma.subject.findMany({
      where: { userId: req.user!.id },
      orderBy: { name: "asc" },
      include: { _count: { select: { lessons: true } } },
    });

    res.json({
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        createdAt: s.createdAt,
        lessonCount: s._count.lessons,
      })),
    });
  })
);

subjectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = subjectSchema.parse(req.body);
    const existing = await prisma.subject.findUnique({
      where: { userId_name: { userId: req.user!.id, name: data.name } },
    });
    if (existing) {
      throw new HttpError(409, "A subject with that name already exists");
    }
    const subject = await prisma.subject.create({
      data: { ...data, userId: req.user!.id },
    });
    res.status(201).json({ subject: { ...subject, lessonCount: 0 } });
  })
);

subjectsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = subjectSchema.partial().parse(req.body);
    const subject = await prisma.subject.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!subject) {
      throw new HttpError(404, "Subject not found");
    }
    const updated = await prisma.subject.update({
      where: { id: subject.id },
      data,
    });
    res.json({ subject: updated });
  })
);

subjectsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const subject = await prisma.subject.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!subject) {
      throw new HttpError(404, "Subject not found");
    }
    await prisma.subject.delete({ where: { id: subject.id } });
    res.status(204).end();
  })
);
