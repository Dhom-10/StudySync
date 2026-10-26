import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "*",
  cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000", credentials: true })
);

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
