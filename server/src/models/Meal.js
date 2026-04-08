import mongoose from "mongoose";
import { createZeroNutrients } from "../lib/nutritionMath.js";

const nutrientSchema = new mongoose.Schema(
  {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    calcium: Number,
    iron: Number,
    vitaminA: Number,
    vitaminC: Number,
    vitaminD: Number,
    vitaminB12: Number,
    folate: Number,
    potassium: Number,
    magnesium: Number,
    zinc: Number,
  },
  { _id: false },
);

const mealItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: "serving" },
    grams: { type: Number, default: 0 },
    matchedFoodId: { type: String, default: "" },
    source: { type: String, enum: ["ai", "manual", "database"], default: "ai" },
    confidence: { type: Number, default: 0.5 },
    nutrients: {
      type: nutrientSchema,
      default: () => createZeroNutrients(),
    },
  },
  { _id: false },
);

const mealSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    loggedAt: { type: Date, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    inputText: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    aiExtractedItems: { type: [mealItemSchema], default: [] },
    finalItems: { type: [mealItemSchema], default: [] },
    totals: {
      type: nutrientSchema,
      default: () => createZeroNutrients(),
    },
  },
  {
    timestamps: true,
  },
);

mealSchema.index({ userId: 1, dateKey: 1, loggedAt: -1 });

export const Meal = mongoose.model("Meal", mealSchema);
