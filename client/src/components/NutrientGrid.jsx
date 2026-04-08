const nutrientOrder = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "calcium",
  "iron",
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "vitaminB12",
  "folate",
  "potassium",
  "magnesium",
  "zinc",
];

export function NutrientGrid({ summary }) {
  const comparison = summary?.targetComparison || {};

  return (
    <div className="nutrient-grid">
      {nutrientOrder.map((key) => {
        const item = comparison[key];
        if (!item) {
          return null;
        }

        return (
          <article key={key} className="metric-card">
            <div className="metric-topline">
              <span>{item.label}</span>
              <strong>{Math.round(item.percent)}%</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(item.percent, 100)}%` }} />
            </div>
            <p className="metric-copy">
              {item.consumed} / {item.target}
            </p>
          </article>
        );
      })}
    </div>
  );
}
