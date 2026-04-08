import { describe, expect, it, vi } from "vitest";
import { FoodMatchCache } from "../src/models/FoodMatchCache.js";
import { findBestFoodMatch, resolveMealItems } from "../src/services/foodMatcherService.js";

vi.spyOn(FoodMatchCache, "findOne").mockResolvedValue(null);
vi.spyOn(FoodMatchCache, "findOneAndUpdate").mockResolvedValue(null);

describe("food matcher service", () => {
  it("finds direct alias matches for Indian foods", async () => {
    const match = await findBestFoodMatch("chapati");

    expect(match.food.id).toBe("roti");
    expect(match.confidence).toBeGreaterThan(0.9);
  });

  it("resolves meal items into nutrient-aware rows", async () => {
    const items = await resolveMealItems([
      {
        label: "dal",
        quantity: 1,
        unit: "bowl",
      },
      {
        label: "banana",
        quantity: 1,
        unit: "piece",
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0].matchedFoodId).toBe("dal");
    expect(items[1].nutrients.potassium).toBeGreaterThan(300);
  });
});
