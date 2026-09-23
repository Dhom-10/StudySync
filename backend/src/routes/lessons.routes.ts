import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";

export const lessonsRouter = Router();
lessonsRouter.use(requireAuth);

const lessonInclude = {
  subject: true,
  summary: true,
  tasks: true,
} as const;

const createLessonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subjectId: z.string().trim().min(1).optional().nullable(),
  durationSec: z.number().int().min(0).default(0),
  transcript: z.string().default(""),
  summary: z
    .object({
      suggestedTitle: z.string(),
      topics: z.array(z.string()).default([]),
      keyPoints: z.array(z.string()).default([]),
      studyTips: z.array(z.string()).default([]),
      dates: z.array(z.string()).default([]),
    })
    .optional(),
  tasks: z.array(z.string().trim().min(1)).default([]),
  assignments: z
    .array(
      z.object({
        text: z.string().trim().min(1),
        dueDate: z.string().trim().nullable().optional(),
        dueTime: z.string().trim().nullable().optional(),
      })
    )
    .default([]),
});

lessonsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;
    const lessons = await prisma.lesson.findMany({
      where: { userId: req.user!.id, ...(subjectId ? { subjectId } : {}) },
      orderBy: { createdAt: "desc" },
      include: lessonInclude,
    });
    res.json({ lessons });
  })
);

lessonsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: lessonInclude,
    });
    if (!lesson) throw new HttpError(404, "Lesson not found");
    res.json({ lesson });
  })
);

lessonsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createLessonSchema.parse(req.body);

    if (data.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: data.subjectId, userId: req.user!.id },
      });
      if (!subject) throw new HttpError(400, "Subject not found");
    }

    const lesson = await prisma.lesson.create({
      data: {
        userId: req.user!.id,
        title: data.title,
        subjectId: data.subjectId ?? null,
        durationSec: data.durationSec,
        transcript: data.transcript,
        tasks: { create: data.tasks.map((text) => ({ text })) },
        ...(data.summary
          ? {
              summary: {
                create: data.summary,
              },
            }
          : {}),
        assignments: {
          create: data.assignments.map((a) => ({
            userId: req.user!.id,
            text: a.text,
            dueDate: a.dueDate ?? null,
            dueTime: a.dueTime ?? null,
            source: "lesson" as const,
          })),
        },
      },
      include: lessonInclude,
    });

    res.status(201).json({ lesson });
  })
);

const updateLessonSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  subjectId: z.string().trim().min(1).nullable().optional(),
});

lessonsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateLessonSchema.parse(req.body);
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!lesson) throw new HttpError(404, "Lesson not found");

    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data,
      include: lessonInclude,
    });
    res.json({ lesson: updated });
  })
);

lessonsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!lesson) throw new HttpError(404, "Lesson not found");
    await prisma.lesson.delete({ where: { id: lesson.id } });
    res.status(204).end();
  })
);

const toggleTaskSchema = z.object({ done: z.boolean() });

lessonsRouter.patch(
  "/:id/tasks/:taskId",
  asyncHandler(async (req, res) => {
    const { done } = toggleTaskSchema.parse(req.body);
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!lesson) throw new HttpError(404, "Lesson not found");

    const task = await prisma.task.findFirst({
      where: { id: req.params.taskId, lessonId: lesson.id },
    });
    if (!task) throw new HttpError(404, "Task not found");

    const updated = await prisma.task.update({ where: { id: task.id }, data: { done } });
    res.json({ task: updated });
  })
);
