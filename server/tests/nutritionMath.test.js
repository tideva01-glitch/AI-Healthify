import { describe, expect, it } from "vitest";
import {
  buildFeedbackTips,
  buildTargetComparison,
  calculateItemNutrients,
  pickMissingNutrients,
} from "../src/lib/nutritionMath.js";
import { FOOD_BY_ID } from "../src/data/foodCatalog.js";

describe("nutrition math", () => {
  it("scales nutrients for a matched food item", () => {
    const milk = FOOD_BY_ID.get("milk");
    const nutrients = calculateItemNutrients(milk, 250);

    expect(nutrients.calories).toBeCloseTo(152.5, 1);
    expect(nutrients.protein).toBeCloseTo(8, 1);
    expect(nutrients.calcium).toBeGreaterThan(250);
  });

  it("builds comparison and missing nutrients", () => {
    const totals = {
      calories: 1200,
      protein: 35,
      carbs: 180,
      fat: 30,
      fiber: 10,
      calcium: 500,
      iron: 4,
      vitaminA: 400,
      vitaminC: 20,
      vitaminD: 3,
      vitaminB12: 0.8,
      folate: 160,
      potassium: 1800,
      magnesium: 150,
      zinc: 4,
    };
    const targets = {
      calories: 2000,
      protein: 60,
      carbs: 250,
      fat: 65,
      fiber: 25,
      calcium: 1000,
      iron: 18,
      vitaminA: 700,
      vitaminC: 75,
      vitaminD: 15,
      vitaminB12: 2.4,
      folate: 400,
      potassium: 3500,
      magnesium: 320,
      zinc: 8,
    };

    const comparison = buildTargetComparison(totals, targets);
    const missing = pickMissingNutrients(totals, targets);
    const tips = buildFeedbackTips(missing);

    expect(comparison.protein.percent).toBeCloseTo(58.3, 1);
    expect(missing.length).toBeGreaterThan(0);
    expect(tips[0]).toContain("Low");
  });
});
