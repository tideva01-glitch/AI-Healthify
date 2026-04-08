import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./lib/asyncHandler.js";
import { serializeUser } from "./lib/profile.js";
import { authRoutes } from "./routes/authRoutes.js";
import { profileRoutes } from "./routes/profileRoutes.js";
import { mealRoutes } from "./routes/mealRoutes.js";
import { summaryRoutes } from "./routes/summaryRoutes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.get(
    "/api/me",
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json({ user: serializeUser(req.user) });
    }),
  );
  app.use("/api/profile", requireAuth, profileRoutes);
  app.use("/api/meals", requireAuth, mealRoutes);
  app.use("/api/summaries", requireAuth, summaryRoutes);

  app.use(errorHandler);
  return app;
}
