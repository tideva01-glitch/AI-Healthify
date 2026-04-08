import { describe, expect, it } from "vitest";
import { findBestFoodMatch, resolveMealItems } from "./foodMatcher.js";

describe("food matcher", () => {
  it("matches Indian food aliases", () => {
    const match = findBestFoodMatch("chapati");
    expect(match.food.id).toBe("roti");
    expect(match.confidence).toBeGreaterThan(0.9);
  });

  it("resolves nutrients for matched foods", () => {
    const items = resolveMealItems([
      { label: "dal", quantity: 1, unit: "bowl" },
      { label: "banana", quantity: 1, unit: "piece" },
    ]);

    expect(items[0].matchedFoodId).toBe("dal");
    expect(items[1].nutrients.potassium).toBeGreaterThan(300);
  });
});
