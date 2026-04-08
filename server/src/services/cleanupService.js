import { DailySummary } from "../models/DailySummary.js";
import { Meal } from "../models/Meal.js";
import { getCutoffDateKey } from "../lib/date.js";

export async function cleanupExpiredHistory() {
  const cutoffDateKey = getCutoffDateKey(90);
  await Meal.deleteMany({ dateKey: { $lt: cutoffDateKey } });
  await DailySummary.deleteMany({ dateKey: { $lt: cutoffDateKey } });
}

export function startCleanupJob() {
  cleanupExpiredHistory().catch(() => {});

  const sixHours = 1000 * 60 * 60 * 6;
  setInterval(() => {
    cleanupExpiredHistory().catch(() => {});
  }, sixHours);
}
