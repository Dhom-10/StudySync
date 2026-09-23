import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./lib/env";
import { authRouter } from "./routes/auth.routes";
import { subjectsRouter } from "./routes/subjects.routes";
import { lessonsRouter } from "./routes/lessons.routes";
import { assignmentsRouter } from "./routes/assignments.routes";
import { summarizeRouter } from "./routes/summarize.routes";
import { usersRouter } from "./routes/users.routes";
import { statsRouter } from "./routes/stats.routes";
import { teamRouter } from "./routes/team.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const summarizeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/subjects", subjectsRouter);
  app.use("/api/lessons", lessonsRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/summarize", summarizeLimiter, summarizeRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/stats", statsRouter);
  app.use("/api/team", teamRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
