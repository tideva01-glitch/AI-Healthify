import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getDateKey, getDefaultHistoryRange, getTimeZoneForUser } from "../lib/date.js";
import { AppError } from "../lib/errors.js";
import { isProfileComplete } from "../lib/profile.js";
import { calculateMealTotals } from "../lib/nutritionMath.js";
import { Meal } from "../models/Meal.js";
import { deleteSummaryIfEmpty, recomputeDailySummary } from "../services/dailySummaryService.js";
import { resolveMealItems } from "../services/foodMatcherService.js";
import { analyzeMeal } from "../services/mealAnalysisService.js";
import { uploadMealPhoto } from "../services/storageService.js";

const router = Router();

function ensureProfileComplete(user) {
  if (!isProfileComplete(user)) {
    throw new AppError("Complete your profile before logging meals.", 400);
  }
}

router.post(
  "/analyze",
  asyncHandler(async (req, res) => {
    ensureProfileComplete(req.user);

    const { inputText = "", photoData = "" } = req.body;
    if (!inputText.trim() && !photoData) {
      throw new AppError("Add a meal description or photo to analyze.", 400);
    }

    const analysis = await analyzeMeal({ inputText, photoData });
    const items = await resolveMealItems(analysis.items, "ai");

    res.json({
      provider: analysis.provider,
      items,
      totals: calculateMealTotals(items),
    });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    ensureProfileComplete(req.user);

    const {
      mealType,
      loggedAt,
      inputText = "",
      photoData = "",
      aiExtractedItems = [],
      finalItems = [],
    } = req.body;

    if (!mealType) {
      throw new AppError("Meal type is required.", 400);
    }

    if (!loggedAt) {
      throw new AppError("Meal date/time is required.", 400);
    }

    const resolvedAiItems = await resolveMealItems(aiExtractedItems, "ai");
    const resolvedFinalItems = await resolveMealItems(
      finalItems.length ? finalItems : aiExtractedItems,
      "manual",
    );

    if (!resolvedFinalItems.length) {
      throw new AppError("At least one meal item is required.", 400);
    }

    const photoUrl = await uploadMealPhoto(photoData);
    const dateKey = getDateKey(loggedAt, getTimeZoneForUser(req.user));

    const meal = await Meal.create({
      userId: req.user._id,
      mealType,
      loggedAt,
      dateKey,
      inputText,
      photoUrl,
      aiExtractedItems: resolvedAiItems,
      finalItems: resolvedFinalItems,
      totals: calculateMealTotals(resolvedFinalItems),
    });

    const summary = await recomputeDailySummary({ user: req.user, dateKey });
    res.status(201).json({ meal, summary });
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { from: defaultFrom, to: defaultTo } = getDefaultHistoryRange(req.user);
    const from = req.query.from || defaultFrom;
    const to = req.query.to || defaultTo;

    const meals = await Meal.find({
      userId: req.user._id,
      dateKey: { $gte: from, $lte: to },
    }).sort({ loggedAt: -1 });

    res.json({ meals });
  }),
);

router.patch(
  "/:mealId",
  asyncHandler(async (req, res) => {
    ensureProfileComplete(req.user);

    const meal = await Meal.findOne({ _id: req.params.mealId, userId: req.user._id });
    if (!meal) {
      throw new AppError("Meal not found.", 404);
    }

    const { mealType, loggedAt, inputText, photoData = "", aiExtractedItems, finalItems } = req.body;
    const previousDateKey = meal.dateKey;

    if (mealType !== undefined) meal.mealType = mealType;
    if (loggedAt !== undefined) {
      meal.loggedAt = loggedAt;
      meal.dateKey = getDateKey(loggedAt, getTimeZoneForUser(req.user));
    }
    if (inputText !== undefined) meal.inputText = inputText;
    if (photoData) {
      meal.photoUrl = await uploadMealPhoto(photoData);
    }
    if (Array.isArray(aiExtractedItems)) {
      meal.aiExtractedItems = await resolveMealItems(aiExtractedItems, "ai");
    }
    if (Array.isArray(finalItems)) {
      meal.finalItems = await resolveMealItems(finalItems, "manual");
      meal.totals = calculateMealTotals(meal.finalItems);
    }

    await meal.save();
    const summary = await recomputeDailySummary({ user: req.user, dateKey: meal.dateKey });

    if (previousDateKey !== meal.dateKey) {
      const shouldKeepOldSummary = await deleteSummaryIfEmpty({
        userId: req.user._id,
        dateKey: previousDateKey,
      });

      if (shouldKeepOldSummary) {
        await recomputeDailySummary({ user: req.user, dateKey: previousDateKey });
      }
    }

    res.json({ meal, summary });
  }),
);

router.delete(
  "/:mealId",
  asyncHandler(async (req, res) => {
    const meal = await Meal.findOne({ _id: req.params.mealId, userId: req.user._id });
    if (!meal) {
      throw new AppError("Meal not found.", 404);
    }

    const { dateKey } = meal;
    await meal.deleteOne();
    const shouldKeepSummary = await deleteSummaryIfEmpty({ userId: req.user._id, dateKey });
    const summary = shouldKeepSummary
      ? await recomputeDailySummary({ user: req.user, dateKey })
      : null;

    res.json({ success: true, summary });
  }),
);

export { router as mealRoutes };
