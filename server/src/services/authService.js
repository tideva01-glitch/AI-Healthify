import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export async function verifyGoogleCredential(credential) {
  if (!credential) {
    throw new AppError("Google credential is required.", 400);
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );

  if (!response.ok) {
    throw new AppError("Unable to verify Google sign-in.", 401);
  }

  const payload = await response.json();

  if (env.googleClientId && payload.aud !== env.googleClientId) {
    throw new AppError("Google sign-in token was issued for a different client.", 401);
  }

  if (payload.email_verified !== "true") {
    throw new AppError("Google account email is not verified.", 401);
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

export function issueAuthToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}
