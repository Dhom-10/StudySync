import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

export const teamRouter = Router();
teamRouter.use(requireAuth, requireRole("admin"));

teamRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { role: "student" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lessons: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            durationSec: true,
            createdAt: true,
            subject: { select: { id: true, name: true, color: true } },
            tasks: { select: { done: true } },
          },
        },
      },
    });

    const team = users.map((u) => {
      const totalSeconds = u.lessons.reduce((sum, l) => sum + l.durationSec, 0);
      const allTasks = u.lessons.flatMap((l) => l.tasks);
      const doneTasks = allTasks.filter((t) => t.done).length;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        lessonCount: u.lessons.length,
        hoursRecorded: Math.round((totalSeconds / 3600) * 10) / 10,
        completionRate: allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0,
        lessons: u.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          durationSec: l.durationSec,
          createdAt: l.createdAt,
          subject: l.subject,
        })),
      };
    });

    res.json({ team });
  })
);
