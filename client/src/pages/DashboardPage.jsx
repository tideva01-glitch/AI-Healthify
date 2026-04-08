import { useEffect, useMemo, useState } from "react";
import { HistoryTable } from "../components/HistoryTable.jsx";
import { MealComposer } from "../components/MealComposer.jsx";
import { NutrientGrid } from "../components/NutrientGrid.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDateLabel, formatDateTimeLabel } from "../lib/date.js";
import { buildSevenDayTrend, getTopMissing } from "../lib/feedback.js";
import { deleteMealEntry, loadDashboardData } from "../lib/supabaseData.js";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [todaySummary, setTodaySummary] = useState(null);
  const [historySummaries, setHistorySummaries] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const dashboard = await loadDashboardData();
      setTodaySummary(dashboard.todaySummary);
      setHistorySummaries(dashboard.historySummaries || []);
      setMeals(dashboard.meals || []);
    } catch (dashboardError) {
      setError(dashboardError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const topMissing = useMemo(() => getTopMissing(todaySummary), [todaySummary]);
  const trend = useMemo(() => buildSevenDayTrend(historySummaries), [historySummaries]);
  const todayMeals = useMemo(
    () => meals.filter((meal) => meal.dateKey === todaySummary?.dateKey),
    [meals, todaySummary],
  );

  async function handleDeleteMeal(mealId) {
    const meal = meals.find((entry) => entry.id === mealId);
    if (!meal?.dateKey) {
      return;
    }
    await deleteMealEntry(mealId, meal?.dateKey, user.dailyTargets);
    await loadDashboard();
  }

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Daily nutrition workspace</p>
          <h1>{user?.name}&apos;s meal intelligence dashboard</h1>
        </div>
        <div className="topbar-actions">
          <button className="secondary-button" type="button" onClick={() => setComposerOpen(true)}>
            Log a meal
          </button>
          <button className="ghost-button" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      {loading ? (
        <div className="loading-card">
          <p className="eyebrow">Crunching today&apos;s data</p>
          <h2>Refreshing meals, nutrients, and gaps</h2>
        </div>
      ) : (
        <>
          <section className="overview-grid">
            <article className="spotlight-card">
              <p className="eyebrow">Today</p>
              <h2>{formatDateLabel(todaySummary?.dateKey)}</h2>
              <div className="spotlight-stats">
                <div>
                  <span>Calories</span>
                  <strong>{Math.round(todaySummary?.totals?.calories || 0)}</strong>
                </div>
                <div>
                  <span>Protein</span>
                  <strong>{Math.round(todaySummary?.totals?.protein || 0)} g</strong>
                </div>
                <div>
                  <span>Fiber</span>
                  <strong>{Math.round(todaySummary?.totals?.fiber || 0)} g</strong>
                </div>
              </div>
              <p className="hint-text">
                {todaySummary?.feedbackTips?.[0] || "Log your first meal to unlock daily feedback."}
              </p>
            </article>

            <article className="card-stack">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Missing nutrients</p>
                  <h3>Focus for tomorrow</h3>
                </div>
              </div>
              {topMissing.length ? (
                topMissing.map((item) => (
                  <div key={item.key} className="gap-row">
                    <span>{item.label}</span>
                    <strong>{Math.round(item.percentComplete)}%</strong>
                  </div>
                ))
              ) : (
                <p className="hint-text">No major gaps flagged yet for today.</p>
              )}
            </article>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Targets vs intake</p>
                <h3>Daily nutrient coverage</h3>
              </div>
            </div>
            <NutrientGrid summary={todaySummary} />
          </section>

          <section className="two-column">
            <div className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Meal timeline</p>
                  <h3>Today&apos;s logged meals</h3>
                </div>
              </div>
              <div className="meal-list">
                {todayMeals.length ? (
                  todayMeals.map((meal) => (
                    <article key={meal.id} className="meal-card">
                      <div className="meal-card-topline">
                        <div>
                          <h4>{meal.mealType}</h4>
                          <p>{formatDateTimeLabel(meal.loggedAt)}</p>
                        </div>
                        <button className="ghost-button danger-button" type="button" onClick={() => handleDeleteMeal(meal.id)}>
                          Delete
                        </button>
                      </div>
                      <p className="meal-copy">{meal.inputText || "Meal saved from review editor."}</p>
                      <div className="pill-row">
                        {meal.finalItems?.map((item, index) => (
                          <span key={`${item.label}-${index}`} className="food-pill">
                            {item.quantity} {item.unit} {item.label}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="hint-text">No meals logged for today yet.</p>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">7-day snapshot</p>
                  <h3>Consistency trend</h3>
                </div>
              </div>
              <div className="trend-list">
                {trend.length ? (
                  trend.map((entry) => (
                    <div key={entry.dateKey} className="trend-row">
                      <span>{formatDateLabel(entry.dateKey)}</span>
                      <strong>{Math.round(entry.calories)} kcal</strong>
                      <small>{Math.round(entry.protein)} g protein</small>
                    </div>
                  ))
                ) : (
                  <p className="hint-text">A week trend appears after you log a few days of meals.</p>
                )}
              </div>
            </div>
          </section>

          <HistoryTable summaries={historySummaries} />
          <p className="disclaimer panel-inline">
            Wellness guidance only. This tool estimates nutrients and is not medical advice.
          </p>
        </>
      )}

      {composerOpen ? (
        <MealComposer
          user={user}
          onClose={() => setComposerOpen(false)}
          onSaved={loadDashboard}
        />
      ) : null}
    </div>
  );
}
