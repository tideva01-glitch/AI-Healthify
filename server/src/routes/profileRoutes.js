import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { serializeUser } from "../lib/profile.js";
import { buildDailyTargets } from "../lib/targets.js";

const router = Router();

async function saveProfile(req, res) {
  const allowedFields = [
    "name",
    "place",
    "country",
    "gender",
    "age",
    "heightCm",
    "weightKg",
    "activityLevel",
    "timezone",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  }

  req.user.dailyTargets = buildDailyTargets(req.user);
  await req.user.save();

  res.json({ user: serializeUser(req.user) });
}

router.post("/", asyncHandler(saveProfile));
router.patch("/", asyncHandler(saveProfile));

export { router as profileRoutes };
