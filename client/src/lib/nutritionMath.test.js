import { describe, expect, it } from "vitest";
import { calculateItemNutrients, buildTargetComparison, pickMissingNutrients } from "./nutritionMath.js";
import { FOOD_BY_ID } from "./foodCatalog.js";

describe("nutrition math", () => {
  it("scales nutrients for known foods", () => {
    const milk = FOOD_BY_ID.get("milk");
    const nutrients = calculateItemNutrients(milk, 250);

    expect(nutrients.calories).toBeCloseTo(152.5, 1);
    expect(nutrients.protein).toBeCloseTo(8, 1);
  });

  it("builds target comparisons and missing nutrients", () => {
    const comparison = buildTargetComparison({ protein: 32, fiber: 10 }, { protein: 60, fiber: 25 });
    const missing = pickMissingNutrients({ protein: 32, fiber: 10 }, { protein: 60, fiber: 25 });

    expect(comparison.protein.percent).toBeCloseTo(53.3, 1);
    expect(missing[0].label).toBeTruthy();
  });
});
