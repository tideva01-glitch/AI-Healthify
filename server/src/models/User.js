import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    picture: { type: String },
    place: { type: String, default: "" },
    country: { type: String, default: "India" },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    age: { type: Number },
    heightCm: { type: Number },
    weightKg: { type: Number },
    activityLevel: {
      type: String,
      enum: ["sedentary", "lightlyActive", "moderatelyActive", "veryActive", ""],
      default: "",
    },
    timezone: { type: String, default: "Asia/Kolkata" },
    dailyTargets: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
