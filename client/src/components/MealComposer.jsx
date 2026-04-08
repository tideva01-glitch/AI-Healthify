import { useMemo, useState } from "react";
import { analyzeMeal, saveMealEntry } from "../lib/supabaseData.js";
import { toDateTimeLocalValue } from "../lib/date.js";
import { resolveMealItems } from "../lib/foodMatcher.js";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

export function MealComposer({ user, onClose, onSaved }) {
  const [mealType, setMealType] = useState("breakfast");
  const [loggedAt, setLoggedAt] = useState(toDateTimeLocalValue());
  const [inputText, setInputText] = useState("");
  const [photoData, setPhotoData] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoName, setPhotoName] = useState("");
  const [provider, setProvider] = useState("");
  const [items, setItems] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const reviewedItems = useMemo(() => resolveMealItems(items, "manual"), [items]);
  const totalCalories = useMemo(
    () => reviewedItems.reduce((sum, item) => sum + Number(item.nutrients?.calories || 0), 0),
    [reviewedItems],
  );

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoData("");
      setPhotoFile(null);
      setPhotoName("");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setPhotoData(dataUrl);
    setPhotoFile(file);
    setPhotoName(file.name);
  }

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: field === "label" || field === "unit" ? value : Number(value) } : item,
      ),
    );
  }

  async function handleAnalyze() {
    setError("");
    setIsAnalyzing(true);

    try {
      const payload = await analyzeMeal({ inputText, photoData });

      setProvider(payload.provider);
      setItems(payload.items);
    } catch (analysisError) {
      setError(analysisError.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSave() {
    setError("");
    setIsSaving(true);

    try {
      await saveMealEntry({
        mealType,
        loggedAt,
        inputText,
        photoFile,
        aiExtractedItems: items,
        finalItems: reviewedItems,
        dailyTargets: user.dailyTargets,
      });
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function addManualItem() {
    setItems((current) => [
      ...current,
      { label: "", quantity: 1, unit: "serving", grams: 100, confidence: 0.5, nutrients: { calories: 0 } },
    ]);
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Meal capture</p>
            <h3>Analyze today&apos;s meal</h3>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="form-grid">
          <label>
            <span>Meal type</span>
            <select value={mealType} onChange={(event) => setMealType(event.target.value)}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </label>
          <label>
            <span>Logged at</span>
            <input type="datetime-local" value={loggedAt} onChange={(event) => setLoggedAt(event.target.value)} />
          </label>
        </div>

        <label className="stacked-field">
          <span>Describe the meal</span>
          <textarea
            rows="4"
            placeholder="Example: 2 roti, dal, sabzi, curd and one glass of milk"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
          />
        </label>

        <label className="upload-field">
          <span>Optional meal photo</span>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {photoName ? <small>{photoName}</small> : null}
        </label>

        <div className="action-row">
          <button className="primary-button" type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? "Analyzing..." : "Analyze meal"}
          </button>
          <button className="secondary-button" type="button" onClick={addManualItem}>
            Add item manually
          </button>
          {provider ? <span className="provider-pill">Provider: {provider}</span> : null}
        </div>

        {items.length ? (
          <div className="review-panel">
            <div className="panel-headline">
              <div>
                <p className="eyebrow">Review before save</p>
                <h4>{Math.round(totalCalories)} kcal estimated</h4>
              </div>
              <span className="hint-text">Edit labels, quantities, or grams to correct AI guesses.</span>
            </div>
            <div className="review-list">
              {items.map((item, index) => (
                <div key={`${item.label}-${index}`} className="review-row">
                  <input value={item.label} onChange={(event) => updateItem(index, "label", event.target.value)} placeholder="Food name" />
                  <input type="number" min="0" step="0.1" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
                  <input value={item.unit} onChange={(event) => updateItem(index, "unit", event.target.value)} placeholder="Unit" />
                  <input type="number" min="0" step="1" value={item.grams} onChange={(event) => updateItem(index, "grams", event.target.value)} />
                  <button className="ghost-button danger-button" type="button" onClick={() => removeItem(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button className="primary-button" type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save meal"}
            </button>
          </div>
        ) : null}

        {error ? <div className="error-box">{error}</div> : null}
      </div>
    </div>
  );
}
