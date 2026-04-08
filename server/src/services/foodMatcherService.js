import { FOOD_ALIAS_LOOKUP, FOOD_BY_ID, FOOD_CATALOG } from "../data/foodCatalog.js";
import { calculateItemNutrients, roundValue } from "../lib/nutritionMath.js";
import { FoodMatchCache } from "../models/FoodMatchCache.js";

export function normalizeFoodLabel(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreTokens(query, candidate) {
  if (!query || !candidate) {
    return 0;
  }

  if (query === candidate) {
    return 1;
  }

  if (candidate.includes(query) || query.includes(candidate)) {
    return 0.86;
  }

  const queryTokens = new Set(query.split(" "));
  const candidateTokens = new Set(candidate.split(" "));
  const overlap = [...queryTokens].filter((token) => candidateTokens.has(token)).length;

  return overlap / Math.max(queryTokens.size, candidateTokens.size, 1);
}

export async function findBestFoodMatch(label = "") {
  const normalized = normalizeFoodLabel(label);

  if (!normalized) {
    return null;
  }

  const cacheResult = FoodMatchCache.findOne({ queryNormalized: normalized });
  const cached =
    typeof cacheResult?.lean === "function" ? await cacheResult.lean() : await cacheResult;
  if (cached?.matchedFoodId) {
    return {
      food: FOOD_BY_ID.get(cached.matchedFoodId) || null,
      confidence: cached.confidence,
    };
  }

  if (FOOD_ALIAS_LOOKUP.has(normalized)) {
    const exactFood = FOOD_ALIAS_LOOKUP.get(normalized);
    await FoodMatchCache.findOneAndUpdate(
      { queryNormalized: normalized },
      {
        queryNormalized: normalized,
        matchedFoodId: exactFood.id,
        matchedLabel: exactFood.label,
        confidence: 0.98,
      },
      { new: true, upsert: true },
    );
    return { food: exactFood, confidence: 0.98 };
  }

  let bestFood = null;
  let bestScore = 0;

  for (const food of FOOD_CATALOG) {
    const aliases = [food.label, ...food.aliases].map(normalizeFoodLabel);
    const score = Math.max(...aliases.map((alias) => scoreTokens(normalized, alias)));

    if (score > bestScore) {
      bestFood = food;
      bestScore = score;
    }
  }

  if (!bestFood) {
    return null;
  }

  await FoodMatchCache.findOneAndUpdate(
    { queryNormalized: normalized },
    {
      queryNormalized: normalized,
      matchedFoodId: bestFood.id,
      matchedLabel: bestFood.label,
      confidence: roundValue(bestScore),
    },
    { new: true, upsert: true },
  );

  return { food: bestFood, confidence: roundValue(bestScore) };
}

function inferGrams({ food, quantity, grams }) {
  if (Number(grams) > 0) {
    return roundValue(Number(grams));
  }

  const fallbackQuantity = Number(quantity || 1);
  if (!food) {
    return roundValue(fallbackQuantity * 100);
  }

  return roundValue((food.gramsPerUnit || 100) * fallbackQuantity);
}

export async function resolveMealItems(rawItems = [], source = "ai") {
  const resolved = [];

  for (const rawItem of rawItems) {
    const match = await findBestFoodMatch(rawItem.label);
    const food = match?.food || null;
    const grams = inferGrams({
      food,
      quantity: rawItem.quantity,
      grams: rawItem.grams,
    });

    resolved.push({
      label: rawItem.label,
      quantity: Number(rawItem.quantity || 1),
      unit: rawItem.unit || food?.defaultUnit || "serving",
      grams,
      matchedFoodId: food?.id || "",
      source: rawItem.source || source,
      confidence: Number(rawItem.confidence ?? match?.confidence ?? 0.35),
      nutrients: calculateItemNutrients(food, grams),
    });
  }

  return resolved;
}
