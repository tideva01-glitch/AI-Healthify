import { useState } from "react";
import { getBrowserTimezone } from "../lib/date.js";

const defaultProfile = {
  name: "",
  place: "",
  country: "India",
  gender: "",
  age: "",
  heightCm: "",
  weightKg: "",
  activityLevel: "moderatelyActive",
};

export function ProfileForm({ initialValues = {}, onSubmit, submitting, submitLabel = "Save profile" }) {
  const [form, setForm] = useState({ ...defaultProfile, ...initialValues });
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await onSubmit({
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        timezone: getBrowserTimezone(),
      });
    } catch (submissionError) {
      setError(submissionError.message);
    }
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>Name</span>
          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        </label>
        <label>
          <span>Place</span>
          <input value={form.place} onChange={(event) => updateField("place", event.target.value)} required />
        </label>
        <label>
          <span>Country</span>
          <input value={form.country} onChange={(event) => updateField("country", event.target.value)} required />
        </label>
        <label>
          <span>Gender</span>
          <select value={form.gender} onChange={(event) => updateField("gender", event.target.value)} required>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          <span>Age</span>
          <input type="number" min="10" max="100" value={form.age} onChange={(event) => updateField("age", event.target.value)} required />
        </label>
        <label>
          <span>Height (cm)</span>
          <input type="number" min="80" max="250" value={form.heightCm} onChange={(event) => updateField("heightCm", event.target.value)} required />
        </label>
        <label>
          <span>Weight (kg)</span>
          <input type="number" min="20" max="300" value={form.weightKg} onChange={(event) => updateField("weightKg", event.target.value)} required />
        </label>
        <label>
          <span>Activity level</span>
          <select value={form.activityLevel} onChange={(event) => updateField("activityLevel", event.target.value)} required>
            <option value="sedentary">Sedentary</option>
            <option value="lightlyActive">Lightly active</option>
            <option value="moderatelyActive">Moderately active</option>
            <option value="veryActive">Very active</option>
          </select>
        </label>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
