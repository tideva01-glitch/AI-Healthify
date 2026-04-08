import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-nutrients-checker",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  nutritionTimeZone: process.env.NUTRITION_TIMEZONE || "Asia/Kolkata",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
};
