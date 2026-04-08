import { describe, expect, it } from "vitest";
import { buildSevenDayTrend, getTopMissing } from "./feedback.js";

describe("feedback helpers", () => {
  it("returns top missing nutrients", () => {
    const result = getTopMissing({
      missingNutrients: [
        { key: "iron" },
        { key: "calcium" },
        { key: "fiber" },
        { key: "vitaminD" },
      ],
    });

    expect(result).toHaveLength(3);
    expect(result[0].key).toBe("iron");
  });

  it("builds a seven day trend in ascending order", () => {
    const result = buildSevenDayTrend([
      { dateKey: "2026-04-08", totals: { calories: 2000, protein: 80 } },
      { dateKey: "2026-04-07", totals: { calories: 1800, protein: 72 } },
    ]);

    expect(result[0].dateKey).toBe("2026-04-07");
    expect(result[1].calories).toBe(2000);
  });
});
