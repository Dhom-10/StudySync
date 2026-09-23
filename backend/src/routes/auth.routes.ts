import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, signToken, verifyPassword, COOKIE_OPTIONS } from "../lib/auth";
import { env } from "../lib/env";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  notifyEnabled: boolean;
  createdAt: Date;
  apiKeyEncrypted: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    notifyEnabled: user.notifyEnabled,
    createdAt: user.createdAt,
    hasApiKey: Boolean(user.apiKeyEncrypted),
  };
}

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { name, email, password } = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, "An account with that email already exists");
    }

    const passwordHash = await hashPassword(password);
    const isFirstUser = (await prisma.user.count()) === 0;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: isFirstUser ? "admin" : "student",
      },
    });

    const token = signToken({ sub: user.id, role: user.role });
    res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
    res.status(201).json({ user: publicUser(user) });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = signToken({ sub: user.id, role: user.role });
    res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
    res.json({ user: publicUser(user) });
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: undefined });
  res.status(204).end();
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      throw new HttpError(401, "User no longer exists");
    }
    res.json({ user: publicUser(user) });
  })
);
