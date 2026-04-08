import mongoose from "mongoose";

const foodMatchCacheSchema = new mongoose.Schema(
  {
    queryNormalized: { type: String, required: true, unique: true, index: true },
    matchedFoodId: { type: String, required: true },
    matchedLabel: { type: String, required: true },
    confidence: { type: Number, default: 0.5 },
  },
  {
    timestamps: true,
  },
);

export const FoodMatchCache = mongoose.model("FoodMatchCache", foodMatchCacheSchema);
