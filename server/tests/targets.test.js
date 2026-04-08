import { describe, expect, it } from "vitest";
import { buildDailyTargets } from "../src/lib/targets.js";

describe("daily targets", () => {
  it("builds personalized calorie and protein targets", () => {
    const targets = buildDailyTargets({
      gender: "female",
      age: 29,
      heightCm: 162,
      weightKg: 59,
      activityLevel: "moderatelyActive",
    });

    expect(targets.calories).toBeGreaterThan(1700);
    expect(targets.protein).toBeGreaterThan(50);
    expect(targets.iron).toBe(18);
  });
});
