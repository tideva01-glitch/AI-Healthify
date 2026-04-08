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

export function serializeUser(user) {
  const plain = user.toObject ? user.toObject() : user;

  return {
    id: String(plain._id || plain.id),
    googleId: plain.googleId,
    email: plain.email,
    name: plain.name,
    picture: plain.picture,
    place: plain.place,
    country: plain.country,
    gender: plain.gender,
    age: plain.age,
    heightCm: plain.heightCm,
    weightKg: plain.weightKg,
    activityLevel: plain.activityLevel,
    timezone: plain.timezone,
    dailyTargets: plain.dailyTargets,
    profileComplete: isProfileComplete(plain),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}
