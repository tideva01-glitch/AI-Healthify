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

const targetSchema = new mongoose.Schema(
  {
    label: String,
    consumed: Number,
    target: Number,
    percent: Number,
  },
  { _id: false },
);

const missingSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    percentComplete: Number,
    target: Number,
    consumed: Number,
  },
  { _id: false },
);

const summarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    totals: {
      type: nutrientSchema,
      default: () => createZeroNutrients(),
    },
    targetComparison: {
      type: Map,
      of: targetSchema,
      default: {},
    },
    missingNutrients: {
      type: [missingSchema],
      default: [],
    },
    feedbackTips: {
      type: [String],
      default: [],
    },
    mealIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

summarySchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const DailySummary = mongoose.model("DailySummary", summarySchema);
