import { env } from "../config/env.js";

export async function uploadMealPhoto(photoData) {
  if (!photoData) {
    return "";
  }

  if (!env.cloudinaryCloudName || !env.cloudinaryUploadPreset) {
    return "";
  }

  const formData = new FormData();
  formData.append("file", photoData);
  formData.append("upload_preset", env.cloudinaryUploadPreset);
  formData.append("folder", "ai-nutrients-checker/meals");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    return "";
  }

  const payload = await response.json();
  return payload.secure_url || "";
}
