import { formatDateLabel } from "../lib/date.js";

export function HistoryTable({ summaries = [] }) {
  return (
    <div className="history-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">History</p>
          <h3>Last 90 days</h3>
        </div>
      </div>
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Calories</th>
              <th>Protein</th>
              <th>Fiber</th>
              <th>Key gaps</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary._id || summary.dateKey}>
                <td>{formatDateLabel(summary.dateKey)}</td>
                <td>{Math.round(summary.totals?.calories || 0)}</td>
                <td>{Math.round(summary.totals?.protein || 0)} g</td>
                <td>{Math.round(summary.totals?.fiber || 0)} g</td>
                <td>{summary.missingNutrients?.slice(0, 2).map((item) => item.label).join(", ") || "On track"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
