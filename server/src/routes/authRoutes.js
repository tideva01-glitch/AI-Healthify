import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { serializeUser } from "../lib/profile.js";
import { User } from "../models/User.js";
import { issueAuthToken, verifyGoogleCredential } from "../services/authService.js";

const router = Router();

router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const googleProfile = await verifyGoogleCredential(req.body.credential);

    let user = await User.findOne({ googleId: googleProfile.googleId });
    if (!user) {
      user = await User.create({
        ...googleProfile,
        country: "India",
        timezone: "Asia/Kolkata",
      });
    } else {
      user.name = googleProfile.name;
      user.email = googleProfile.email;
      user.picture = googleProfile.picture;
      await user.save();
    }

    res.json({
      token: issueAuthToken(user),
      user: serializeUser(user),
    });
  }),
);

export { router as authRoutes };
