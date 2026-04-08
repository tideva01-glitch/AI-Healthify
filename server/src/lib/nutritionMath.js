import { NUTRIENT_KEYS } from "../data/foodCatalog.js";

export const nutrientLabels = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  fiber: "Fiber",
  calcium: "Calcium",
  iron: "Iron",
  vitaminA: "Vitamin A",
  vitaminC: "Vitamin C",
  vitaminD: "Vitamin D",
  vitaminB12: "Vitamin B12",
  folate: "Folate",
  potassium: "Potassium",
  magnesium: "Magnesium",
  zinc: "Zinc",
};

export const nutrientSuggestionMap = {
  protein: ["dal", "paneer", "eggs", "chicken curry"],
  fiber: ["salad", "poha", "apple", "chana"],
  calcium: ["milk", "curd", "paneer", "almonds"],
  iron: ["spinach", "dal", "rajma", "eggs"],
  vitaminA: ["spinach", "mixed vegetable sabzi", "salad"],
  vitaminC: ["salad", "banana", "apple", "sabzi"],
  vitaminD: ["milk", "eggs", "fish curry"],
  vitaminB12: ["milk", "curd", "eggs", "fish curry"],
  folate: ["dal", "spinach", "chana", "rajma"],
  potassium: ["banana", "dal", "spinach", "curd"],
  magnesium: ["almonds", "spinach", "roti", "dal"],
  zinc: ["paneer", "eggs", "chana", "almonds"],
};

export function createZeroNutrients() {
  return NUTRIENT_KEYS.reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {});
}

export function roundValue(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function roundNutrients(nutrients) {
  return NUTRIENT_KEYS.reduce((rounded, key) => {
    rounded[key] = roundValue(nutrients?.[key] || 0);
    return rounded;
  }, {});
}

export function scaleNutrients(nutrientsPer100g, grams) {
  const scale = grams / 100;
  return NUTRIENT_KEYS.reduce((scaled, key) => {
    scaled[key] = roundValue((nutrientsPer100g?.[key] || 0) * scale);
    return scaled;
  }, {});
}

export function sumNutrients(entries = []) {
  return roundNutrients(
    entries.reduce((totals, entry) => {
      for (const key of NUTRIENT_KEYS) {
        totals[key] += Number(entry?.[key] || 0);
      }
      return totals;
    }, createZeroNutrients()),
  );
}

export function calculateItemNutrients(food, grams) {
  if (!food || !grams) {
    return createZeroNutrients();
  }

  return scaleNutrients(food.nutrientsPer100g, grams);
}

export function calculateMealTotals(items = []) {
  return sumNutrients(items.map((item) => item.nutrients || createZeroNutrients()));
}

export function buildTargetComparison(consumed = {}, targets = {}) {
  return NUTRIENT_KEYS.reduce((comparison, key) => {
    const target = Number(targets[key] || 0);
    const total = Number(consumed[key] || 0);
    comparison[key] = {
      label: nutrientLabels[key],
      consumed: roundValue(total),
      target: roundValue(target),
      percent: target > 0 ? roundValue((total / target) * 100) : 0,
    };
    return comparison;
  }, {});
}

export function pickMissingNutrients(consumed = {}, targets = {}, maxCount = 5) {
  return NUTRIENT_KEYS.filter((key) => key !== "calories")
    .map((key) => {
      const target = Number(targets[key] || 0);
      const total = Number(consumed[key] || 0);
      const percent = target > 0 ? (total / target) * 100 : 100;

      return {
        key,
        label: nutrientLabels[key],
        percentComplete: roundValue(percent),
        target: roundValue(target),
        consumed: roundValue(total),
      };
    })
    .filter((item) => item.percentComplete < 80)
    .sort((left, right) => left.percentComplete - right.percentComplete)
    .slice(0, maxCount);
}

export function buildFeedbackTips(missingNutrients = []) {
  return missingNutrients.map((item) => {
    const suggestions = nutrientSuggestionMap[item.key] || ["dal", "vegetables"];
    return `Low ${item.label.toLowerCase()} today. Try adding ${suggestions.slice(0, 3).join(", ")} tomorrow.`;
  });
}
