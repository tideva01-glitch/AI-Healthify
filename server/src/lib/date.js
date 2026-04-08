import { env } from "../config/env.js";

export function getDateKey(dateInput = new Date(), timeZone = env.nutritionTimeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date(dateInput));
}

export function getTimeZoneForUser(user) {
  if (user?.timezone) {
    return user.timezone;
  }

  if ((user?.country || "").toLowerCase() === "india") {
    return "Asia/Kolkata";
  }

  return env.nutritionTimeZone;
}

export function getTodayDateKeyForUser(user) {
  return getDateKey(new Date(), getTimeZoneForUser(user));
}

export function getCutoffDateKey(days = 90, timeZone = env.nutritionTimeZone) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return getDateKey(cutoff, timeZone);
}

export function getDefaultHistoryRange(user) {
  const today = getTodayDateKeyForUser(user);
  const from = getCutoffDateKey(90, getTimeZoneForUser(user));
  return { from, to: today };
}
