import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [lessons, tasks, subjects] = await Promise.all([
      prisma.lesson.findMany({
        where: { userId },
        select: { id: true, durationSec: true, subjectId: true, subject: { select: { name: true, color: true } } },
      }),
      prisma.task.findMany({
        where: { lesson: { userId } },
        select: { done: true },
      }),
      prisma.subject.findMany({ where: { userId }, select: { id: true, name: true, color: true } }),
    ]);

    const totalLessons = lessons.length;
    const totalSeconds = lessons.reduce((sum, l) => sum + l.durationSec, 0);
    const hoursRecorded = Math.round((totalSeconds / 3600) * 10) / 10;
    const doneTasks = tasks.filter((t) => t.done).length;
    const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

    const bySubjectMap = new Map<string, { subjectId: string | null; name: string; color: string; count: number }>();
    for (const lesson of lessons) {
      const key = lesson.subjectId ?? "none";
      const name = lesson.subject?.name ?? "No subject";
      const color = lesson.subject?.color ?? "#94a3b8";
      const existing = bySubjectMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        bySubjectMap.set(key, { subjectId: lesson.subjectId, name, color, count: 1 });
      }
    }

    res.json({
      totalLessons,
      totalSubjects: subjects.length,
      hoursRecorded,
      totalTasks: tasks.length,
      completedTasks: doneTasks,
      completionRate,
      lessonsBySubject: Array.from(bySubjectMap.values()).sort((a, b) => b.count - a.count),
    });
  })
);
