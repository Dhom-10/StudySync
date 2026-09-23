import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../middleware/errorHandler";

export const assignmentsRouter = Router();
assignmentsRouter.use(requireAuth);

const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
  .nullable()
  .optional();
const timeStr = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "dueTime must be HH:MM")
  .nullable()
  .optional();

const createSchema = z.object({
  text: z.string().trim().min(1).max(300),
  dueDate: dateStr,
  dueTime: timeStr,
  lessonId: z.string().trim().min(1).optional().nullable(),
});

const updateSchema = z.object({
  text: z.string().trim().min(1).max(300).optional(),
  dueDate: dateStr,
  dueTime: timeStr,
  done: z.boolean().optional(),
});

assignmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const assignments = await prisma.assignment.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ dueDate: "asc" }, { dueTime: "asc" }],
      include: { lesson: { select: { id: true, title: true, subjectId: true } } },
    });
    res.json({ assignments });
  })
);

assignmentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const assignment = await prisma.assignment.create({
      data: {
        userId: req.user!.id,
        text: data.text,
        dueDate: data.dueDate ?? null,
        dueTime: data.dueTime ?? null,
        lessonId: data.lessonId ?? null,
        source: "manual",
      },
    });
    res.status(201).json({ assignment });
  })
);

assignmentsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const assignment = await prisma.assignment.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!assignment) throw new HttpError(404, "Assignment not found");

    const updated = await prisma.assignment.update({
      where: { id: assignment.id },
      data,
    });
    res.json({ assignment: updated });
  })
);

assignmentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const assignment = await prisma.assignment.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!assignment) throw new HttpError(404, "Assignment not found");
    await prisma.assignment.delete({ where: { id: assignment.id } });
    res.status(204).end();
  })
);
