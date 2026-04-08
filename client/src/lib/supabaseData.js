import { buildFeedbackTips, buildTargetComparison, calculateMealTotals, pickMissingNutrients } from "./nutritionMath.js";
import { isProfileComplete, serializeUser } from "./profile.js";
import { buildDailyTargets } from "./targets.js";
import { resolveMealItems } from "./foodMatcher.js";
import { supabase } from "./supabase.js";

const HISTORY_DAYS = 90;

function ensureClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
}

function toDateKey(dateInput) {
  return new Date(dateInput).toISOString().slice(0, 10);
}

function getHistoryRange() {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - HISTORY_DAYS);
  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

function normalizeMealRow(row) {
  return {
    id: row.id,
    mealType: row.meal_type,
    loggedAt: row.logged_at,
    dateKey: row.date_key,
    inputText: row.input_text,
    photoPath: row.photo_path,
    photoUrl: row.photo_url,
    aiProvider: row.ai_provider,
    aiExtractedItems: row.ai_extracted_items || [],
    finalItems: row.final_items || [],
    totals: row.totals || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeSummaryRow(row) {
  return {
    id: row.id,
    dateKey: row.date_key,
    totals: row.totals || {},
    targetComparison: row.target_comparison || {},
    missingNutrients: row.missing_nutrients || [],
    feedbackTips: row.feedback_tips || [],
    mealIds: row.meal_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function signInWithGoogle() {
  ensureClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  ensureClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCurrentSession() {
  ensureClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export function subscribeToAuthChanges(callback) {
  ensureClient();
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}

export async function loadCurrentUser() {
  ensureClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }

  const authUser = authData.user;
  if (!authUser) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return serializeUser(authUser, profile);
}

export async function saveProfile(profileInput) {
  ensureClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }

  const authUser = authData.user;
  if (!authUser) {
    throw new Error("You must be signed in.");
  }

  const dailyTargets = buildDailyTargets(profileInput);
  const row = {
    id: authUser.id,
    email: authUser.email || "",
    name: profileInput.name,
    picture: authUser.user_metadata?.avatar_url || "",
    place: profileInput.place,
    country: profileInput.country,
    gender: profileInput.gender,
    age: Number(profileInput.age),
    height_cm: Number(profileInput.heightCm),
    weight_kg: Number(profileInput.weightKg),
    activity_level: profileInput.activityLevel,
    timezone: profileInput.timezone,
    daily_targets: dailyTargets,
  };

  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  if (error) {
    throw error;
  }

  return serializeUser(authUser, row);
}

async function uploadMealPhoto(userId, photoFile) {
  if (!photoFile) {
    return { photoPath: "", photoUrl: "" };
  }

  const extension = photoFile.name.includes(".") ? photoFile.name.split(".").pop() : "jpg";
  const filePath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("meal-photos")
    .upload(filePath, photoFile, { upsert: false, contentType: photoFile.type });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("meal-photos").getPublicUrl(filePath);
  return {
    photoPath: filePath,
    photoUrl: data.publicUrl,
  };
}

export async function analyzeMeal({ inputText, photoData }) {
  ensureClient();
  const { data, error } = await supabase.functions.invoke("analyze-meal", {
    body: { inputText, photoData },
  });

  if (error) {
    throw error;
  }

  const items = resolveMealItems(data?.items || [], "ai");
  return {
    provider: data?.provider || "gemini",
    items,
    totals: calculateMealTotals(items),
  };
}

async function recomputeDailySummary(dateKey, dailyTargets) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const { data: meals, error } = await supabase
    .from("meal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date_key", dateKey)
    .order("logged_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!meals?.length) {
    await supabase.from("daily_summaries").delete().eq("user_id", userId).eq("date_key", dateKey);
    return null;
  }

  const normalizedMeals = meals.map(normalizeMealRow);
  const totals = calculateMealTotals(normalizedMeals.map((meal) => ({ nutrients: meal.totals })));
  const targetComparison = buildTargetComparison(totals, dailyTargets || {});
  const missingNutrients = pickMissingNutrients(totals, dailyTargets || {});
  const feedbackTips = buildFeedbackTips(missingNutrients);

  const row = {
    user_id: userId,
    date_key: dateKey,
    totals,
    target_comparison: targetComparison,
    missing_nutrients: missingNutrients,
    feedback_tips: feedbackTips,
    meal_ids: normalizedMeals.map((meal) => meal.id),
  };

  const { data: summary, error: summaryError } = await supabase
    .from("daily_summaries")
    .upsert(row, { onConflict: "user_id,date_key" })
    .select("*")
    .single();

  if (summaryError) {
    throw summaryError;
  }

  return normalizeSummaryRow(summary);
}

async function enforceHistoryRetention() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  await supabase.from("meal_entries").delete().lt("date_key", cutoffDate);
  await supabase.from("daily_summaries").delete().lt("date_key", cutoffDate);
}

export async function saveMealEntry({ mealType, loggedAt, inputText, photoFile, aiExtractedItems, finalItems, dailyTargets }) {
  ensureClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const resolvedAiItems = resolveMealItems(aiExtractedItems, "ai");
  const resolvedFinalItems = resolveMealItems(finalItems.length ? finalItems : aiExtractedItems, "manual");
  const { photoPath, photoUrl } = await uploadMealPhoto(userId, photoFile);
  const dateKey = toDateKey(loggedAt);

  const { data, error } = await supabase
    .from("meal_entries")
    .insert({
      user_id: userId,
      meal_type: mealType,
      logged_at: new Date(loggedAt).toISOString(),
      date_key: dateKey,
      input_text: inputText,
      photo_path: photoPath,
      photo_url: photoUrl,
      ai_provider: "gemini",
      ai_extracted_items: resolvedAiItems,
      final_items: resolvedFinalItems,
      totals: calculateMealTotals(resolvedFinalItems),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await recomputeDailySummary(dateKey, dailyTargets);
  await enforceHistoryRetention();

  return normalizeMealRow(data);
}

export async function deleteMealEntry(mealId, dateKey, dailyTargets) {
  ensureClient();
  const { error } = await supabase.from("meal_entries").delete().eq("id", mealId);
  if (error) {
    throw error;
  }

  await recomputeDailySummary(dateKey, dailyTargets);
}

export async function loadDashboardData() {
  ensureClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw authError;
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const { from, to } = getHistoryRange();

  const [{ data: summaries, error: summariesError }, { data: meals, error: mealsError }] = await Promise.all([
    supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", userId)
      .gte("date_key", from)
      .lte("date_key", to)
      .order("date_key", { ascending: false }),
    supabase
      .from("meal_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("date_key", from)
      .lte("date_key", to)
      .order("logged_at", { ascending: false }),
  ]);

  if (summariesError) {
    throw summariesError;
  }

  if (mealsError) {
    throw mealsError;
  }

  const historySummaries = (summaries || []).map(normalizeSummaryRow);
  const mealsList = (meals || []).map(normalizeMealRow);
  const todayDateKey = new Date().toISOString().slice(0, 10);
  const todaySummary = historySummaries.find((summary) => summary.dateKey === todayDateKey) || {
    id: `local-${todayDateKey}`,
    dateKey: todayDateKey,
    totals: {},
    targetComparison: {},
    missingNutrients: [],
    feedbackTips: [],
    mealIds: [],
  };

  return {
    todaySummary,
    historySummaries,
    meals: mealsList,
  };
}

export function canUseDashboard(user) {
  return isProfileComplete(user);
}
