import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/", (c) => c.redirect("/health"));
healthRoutes.get("/health", (c) => c.json({ ok: true }));
healthRoutes.get("/api/health", (c) => c.json({ ok: true }));
