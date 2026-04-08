import { DailySummary } from "../models/DailySummary.js";
import { Meal } from "../models/Meal.js";
import {
  buildFeedbackTips,
  buildTargetComparison,
  calculateMealTotals,
  pickMissingNutrients,
} from "../lib/nutritionMath.js";

export async function recomputeDailySummary({ user, dateKey }) {
  const meals = await Meal.find({
    userId: user._id,
    dateKey,
  })
    .sort({ loggedAt: 1 })
    .lean();

  const totals = calculateMealTotals(meals.map((meal) => ({ nutrients: meal.totals })));
  const targetComparison = buildTargetComparison(totals, user.dailyTargets || {});
  const missingNutrients = pickMissingNutrients(totals, user.dailyTargets || {});
  const feedbackTips = buildFeedbackTips(missingNutrients);

  return DailySummary.findOneAndUpdate(
    { userId: user._id, dateKey },
    {
      userId: user._id,
      dateKey,
      totals,
      targetComparison,
      missingNutrients,
      feedbackTips,
      mealIds: meals.map((meal) => meal._id),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function deleteSummaryIfEmpty({ userId, dateKey }) {
  const remainingMeals = await Meal.countDocuments({ userId, dateKey });
  if (!remainingMeals) {
    await DailySummary.deleteOne({ userId, dateKey });
  }
  return remainingMeals > 0;
}
