import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getDefaultHistoryRange, getTodayDateKeyForUser } from "../lib/date.js";
import { DailySummary } from "../models/DailySummary.js";
import { recomputeDailySummary } from "../services/dailySummaryService.js";

const router = Router();

router.get(
  "/today",
  asyncHandler(async (req, res) => {
    const dateKey = getTodayDateKeyForUser(req.user);
    let summary = await DailySummary.findOne({ userId: req.user._id, dateKey });

    if (!summary) {
      summary = await recomputeDailySummary({ user: req.user, dateKey });
    }

    res.json({ summary });
  }),
);

router.get(
  "/history",
  asyncHandler(async (req, res) => {
    const { from: defaultFrom, to: defaultTo } = getDefaultHistoryRange(req.user);
    const from = req.query.from || defaultFrom;
    const to = req.query.to || defaultTo;

    const summaries = await DailySummary.find({
      userId: req.user._id,
      dateKey: { $gte: from, $lte: to },
    }).sort({ dateKey: -1 });

    res.json({ summaries });
  }),
);

export { router as summaryRoutes };
