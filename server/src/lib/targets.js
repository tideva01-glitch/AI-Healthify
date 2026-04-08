import { roundNutrients, roundValue } from "./nutritionMath.js";

const activityMultipliers = {
  sedentary: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
};

export function buildDailyTargets(profile) {
  const weightKg = Number(profile.weightKg || 0);
  const heightCm = Number(profile.heightCm || 0);
  const age = Number(profile.age || 0);
  const gender = (profile.gender || "other").toLowerCase();
  const activityLevel = profile.activityLevel || "moderatelyActive";
  const activityMultiplier = activityMultipliers[activityLevel] || activityMultipliers.moderatelyActive;

  const baseBmr =
    10 * weightKg +
    6.25 * heightCm -
    5 * age +
    (gender === "male" ? 5 : gender === "female" ? -161 : -78);
  const calories = Math.max(1400, roundValue(baseBmr * activityMultiplier));

  const protein = Math.max(45, roundValue(weightKg * (activityLevel === "veryActive" ? 1.1 : 0.9)));
  const fat = roundValue((calories * 0.28) / 9);
  const carbs = roundValue((calories * 0.5) / 4);
  const fiber = gender === "male" ? 38 : 25;

  return roundNutrients({
    calories,
    protein,
    carbs,
    fat,
    fiber,
    calcium: 1000,
    iron: gender === "female" ? 18 : 8,
    vitaminA: gender === "male" ? 900 : 700,
    vitaminC: 75,
    vitaminD: 15,
    vitaminB12: 2.4,
    folate: 400,
    potassium: 3500,
    magnesium: gender === "male" ? 420 : 320,
    zinc: gender === "male" ? 11 : 8,
  });
}
