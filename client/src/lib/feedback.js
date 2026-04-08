export function getTopMissing(summary) {
  return summary?.missingNutrients?.slice(0, 3) || [];
}

export function buildSevenDayTrend(summaries = []) {
  return summaries
    .slice(0, 7)
    .reverse()
    .map((summary) => ({
      dateKey: summary.dateKey,
      calories: summary.totals?.calories || 0,
      protein: summary.totals?.protein || 0,
    }));
}
