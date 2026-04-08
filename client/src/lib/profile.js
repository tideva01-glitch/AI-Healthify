const REQUIRED_PROFILE_FIELDS = [
  "name",
  "place",
  "country",
  "gender",
  "age",
  "heightCm",
  "weightKg",
  "activityLevel",
];

export function isProfileComplete(user) {
  return REQUIRED_PROFILE_FIELDS.every((field) => {
    const value = user?.[field];
    return value !== null && value !== undefined && value !== "";
  });
}

export function serializeUser(authUser, profile) {
  if (!authUser) {
    return null;
  }

  const metadata = authUser.user_metadata || {};
  const merged = {
    id: authUser.id,
    email: authUser.email || profile?.email || "",
    name: profile?.name || metadata.full_name || metadata.name || "",
    picture: profile?.picture || metadata.avatar_url || "",
    place: profile?.place || "",
    country: profile?.country || "India",
    gender: profile?.gender || "",
    age: profile?.age ?? "",
    heightCm: profile?.height_cm ?? profile?.heightCm ?? "",
    weightKg: profile?.weight_kg ?? profile?.weightKg ?? "",
    activityLevel: profile?.activity_level ?? profile?.activityLevel ?? "",
    timezone: profile?.timezone || "Asia/Kolkata",
    dailyTargets: profile?.daily_targets ?? profile?.dailyTargets ?? {},
    createdAt: profile?.created_at || authUser.created_at,
    updatedAt: profile?.updated_at || authUser.updated_at,
  };

  return {
    ...merged,
    profileComplete: isProfileComplete(merged),
  };
}
