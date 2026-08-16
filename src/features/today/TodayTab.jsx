import { Camera, ChefHat, CalendarRange, Loader2, X, Trash2, AlertTriangle } from "lucide-react";
import { cardStyle, primaryBtn, secondaryBtn, iconBtn } from "../../styles/theme";
import { getDailyQuote, formatTime } from "../../lib/time";
import { getMealWarnings } from "../../lib/nutrition";
import { GaugeGrid } from "../../components/GaugeGrid";
import { WeightBar } from "../../components/WeightBar";
import { WeighInInput } from "../../components/WeighInInput";
import { WaterTracker } from "../../components/WaterTracker";
import { MicronutrientCard } from "../../components/MicronutrientCard";
import { FastingTimer } from "../../components/FastingTimer";
import { RecipesCard } from "../../components/RecipesCard";
import { ColorLegendBanner } from "../../components/ColorLegendBanner";

export function TodayTab({
  profile, totals, log, saveLog, error,
  microOpen, setMicroOpen, lastMealAt, adaptiveSuggestion, setAdaptiveSuggestion, saveProfile,
  mealInputRef, busy, handleSuggest, suggestion, setSuggestion, shopping, saveShopping, ingredientColor,
  handlePlanDay, dayPlan, setDayPlan,
  recipes, recipesOpen, setRecipesOpen, logRecipe, deleteRecipe,
  importText, setImportText, importOpen, setImportOpen, handleImportRecipe, pantry,
  logWeighIn, updateMealType, updateMealTime, updateMealRating, saveMealAsRecipe,
}) {
  return (
    <div style={{ padding: "24px 20px" }}>
      <h1 style={{ margin: "0 0 16px", fontFamily: "Quicksand", fontWeight: 800, fontSize: 24, color: "#fff" }}>Today</h1>
      <div style={{
        margin: "0 0 16px", padding: "14px 16px", borderRadius: 14,
        background: "radial-gradient(circle at 50% 30%, #1a1a1a 0%, #000000 70%)",
        border: "1px solid #2a2a2a", boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
      }}>
        <p style={{
          margin: 0, fontFamily: "Quicksand", fontWeight: 600, fontSize: 15,
          color: "#FFFFFF", textAlign: "center", fontStyle: "italic",
        }}>
          {getDailyQuote()}
        </p>
      </div>
      <div style={{ margin: "16px 0 24px" }}>
        <GaugeGrid
          calGoal={profile.calories} calUsed={totals.cal}
          protein={totals.protein} protGoal={profile.protein}
          carbs={totals.carbs} carbGoal={profile.carbs}
          fat={totals.fat} fatGoal={profile.fat}
          sodium={totals.sodium} sodiumGoal={profile.sodium || 2000}
          showSodium={(profile.conditions || []).some((c) => ["diabetes", "heart_bp", "kidney", "cholesterol"].includes(c))}
        />
        <div style={{ ...cardStyle, marginTop: 4 }}>
          <WeightBar startWeight={profile.startWeight ?? profile.weight} currentWeight={profile.weight} goalWeight={profile.goalWeight} />
          <WeighInInput onLog={logWeighIn} currentWeight={profile.weight} />
          <WaterTracker cups={Math.round((totals.fluidCups || 0) * 10) / 10} goalCups={profile.waterCups || 13} />
        </div>

        <MicronutrientCard totals={totals} open={microOpen} onToggle={() => setMicroOpen(!microOpen)} />

        <FastingTimer lastMealAt={lastMealAt} fastGoalHours={profile.fastGoalHours || 16} />
      </div>

      {adaptiveSuggestion && (
        <div style={{ ...cardStyle, position: "relative", paddingRight: 44, border: "1px solid rgba(255,122,0,0.35)" }}>
          <button
            style={{ ...iconBtn, position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}
            onClick={() => setAdaptiveSuggestion(null)}
            aria-label="Dismiss this suggestion"
          >
            <X size={18} color="#e0e0e0" />
          </button>
          <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 18, margin: "0 0 8px", color: "#FF7A00" }}>Target check-in</p>
          <p style={{ margin: "0 0 12px", color: "#e0e0e0", fontSize: 15, lineHeight: 1.5 }}>
            Your weight's been trending at {adaptiveSuggestion.actualWeeklyChangeKg} kilos a week, versus a planned {adaptiveSuggestion.expectedWeeklyChangeKg}. I'd suggest {adaptiveSuggestion.delta > 0 ? "raising" : "lowering"} your daily calories to {adaptiveSuggestion.newCalories} to keep things on track.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{ ...primaryBtn, flex: 1 }}
              onClick={() => {
                saveProfile({ ...profile, calories: adaptiveSuggestion.newCalories });
                setAdaptiveSuggestion(null);
              }}
            >
              Update my target
            </button>
            <button style={{ ...secondaryBtn, flex: 1 }} onClick={() => setAdaptiveSuggestion(null)}>
              Keep as is
            </button>
          </div>
        </div>
      )}

      <button style={{ ...primaryBtn, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={() => mealInputRef.current.click()} disabled={busy}>
        {busy === "meal" ? <Loader2 className="spin" size={22} /> : <Camera size={22} />}
        {busy === "meal" ? "Reading your photo…" : "Snap a meal or drink"}
      </button>

      <button style={{ ...secondaryBtn, width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={handleSuggest} disabled={busy}>
        {busy === "suggest" ? <Loader2 className="spin" size={22} /> : <ChefHat size={22} />}
        {busy === "suggest" ? "Thinking…" : "Suggest my next meal"}
      </button>

      {error && <p style={{ color: "var(--fat)", fontFamily: "Atkinson Hyperlegible", marginTop: 12, fontSize: 16 }}>{error}</p>}

      {suggestion && (
        <div style={{ ...cardStyle, position: "relative", paddingRight: 44 }}>
          <button
            style={{ ...iconBtn, position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}
            onClick={() => {
              if (suggestion.addedShoppingIds?.length) saveShopping(shopping.filter((s) => !suggestion.addedShoppingIds.includes(s.id)));
              setSuggestion(null);
            }}
            aria-label="Remove this suggestion"
          >
            <X size={18} color="#e0e0e0" />
          </button>
          <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 19, margin: "0 0 8px", color: "#FF7A00" }}>{suggestion.meal}</p>
          <p style={{ margin: "0 0 12px", color: "#e0e0e0", fontSize: 16, lineHeight: 1.5 }}>{suggestion.why}</p>
          {suggestion.ingredients?.length > 0 && (
            <div style={{ margin: "0 0 10px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#FF7A00" }}>Ingredients and amounts</p>
              <ColorLegendBanner />
              {suggestion.ingredients.map((ing, i) => (
                <p key={i} style={{ margin: "0 0 2px", fontSize: 15, color: ingredientColor(ing, suggestion.missing) }}>• {ing}</p>
              ))}
            </div>
          )}
          {suggestion.uses?.length > 0 && <p style={{ margin: "0 0 6px", fontSize: 15, lineHeight: 1.5, color: "#fff" }}><b>From your pantry:</b> {suggestion.uses.join(", ")}</p>}
          {suggestion.missing?.length > 0 && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#fff" }}><b>Added to shopping list:</b> {suggestion.missing.join(", ")}</p>}
        </div>
      )}

      <button style={{ ...secondaryBtn, width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={handlePlanDay} disabled={busy}>
        {busy === "planday" ? <Loader2 className="spin" size={22} /> : <CalendarRange size={22} />}
        {busy === "planday" ? "Planning…" : "Plan the rest of my day"}
      </button>

      {dayPlan && (
        <div style={{ ...cardStyle, position: "relative", paddingRight: 44 }}>
          <button
            style={{ ...iconBtn, position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}
            onClick={() => {
              if (dayPlan.addedShoppingIds?.length) saveShopping(shopping.filter((s) => !dayPlan.addedShoppingIds.includes(s.id)));
              setDayPlan(null);
            }}
            aria-label="Remove this plan"
          >
            <X size={18} color="#e0e0e0" />
          </button>
          <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 19, margin: "0 0 10px", color: "#FF7A00" }}>Rest of today</p>
          {(dayPlan.meals || []).map((m, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < dayPlan.meals.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <p style={{ margin: "0 0 4px", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>{m.name} <span style={{ color: "#c4c4c4", fontWeight: 400 }}>{m.calories ? `· ${m.calories} cal` : ""}</span></p>
              <p style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 15, lineHeight: 1.4 }}>{m.why}</p>
              {m.ingredients?.length > 0 && (
                <div style={{ margin: "4px 0 6px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Ingredients and amounts</p>
                  {i === 0 && <ColorLegendBanner />}
                  {m.ingredients.map((ing, j) => (
                    <p key={j} style={{ margin: "0 0 1px", fontSize: 14, color: ingredientColor(ing, m.missing) }}>• {ing}</p>
                  ))}
                </div>
              )}
              {m.uses?.length > 0 && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: "#fff" }}><b>Uses:</b> {m.uses.join(", ")}</p>}
              {m.missing?.length > 0 && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: "#fff" }}><b>Need to buy:</b> {m.missing.join(", ")}</p>}
            </div>
          ))}
        </div>
      )}

      <RecipesCard
        recipes={recipes}
        open={recipesOpen}
        onToggle={() => setRecipesOpen(!recipesOpen)}
        onLog={logRecipe}
        onDelete={deleteRecipe}
        importText={importText}
        setImportText={setImportText}
        importOpen={importOpen}
        setImportOpen={setImportOpen}
        onImport={handleImportRecipe}
        busy={busy}
        pantry={pantry}
      />

      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 19, marginTop: 32, marginBottom: 4, color: "var(--ink)" }}>Logged today</p>
      {log.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 16 }}>Nothing logged yet. Snap your first meal above.</p>}
      {["Breakfast", "Lunch", "Dinner"].map((section) => {
        const meals = log.filter((m) => (m.mealType || "Lunch") === section);
        const sectionCal = meals.reduce((s, m) => s + m.calories, 0);
        if (meals.length === 0) return null;
        return (
          <div key={section} style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, margin: 0, color: "var(--success)" }}>{section}</p>
              <p style={{ fontSize: 14, margin: 0, color: "var(--ink-soft)" }}>{sectionCal} cal</p>
            </div>
            {meals.map((m) => (
              <div key={m.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                {m.photo && (
                  <img
                    src={m.photo}
                    alt={m.name}
                    style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: "2px solid #FF7A00" }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 17, color: "#fff" }}>{m.name}</p>
                  <p style={{ margin: "4px 0 8px", fontSize: 15, color: "#FF7A00", fontWeight: 700, lineHeight: 1.5 }}>{formatTime(m.timeValue)} · {m.calories} cal</p>
                  <p style={{ margin: 0, fontSize: 14, color: "#e0e0e0" }}>
                    <span style={{ color: "#fff" }}>Protein {m.protein}g</span> · <span style={{ color: "#FF3B30" }}>Carbs {m.carbs}g</span> · <span style={{ color: "#FFD60A" }}>Fat {m.fat}g</span>
                  </p>
                  {getMealWarnings(m, profile).map((w, wi) => (
                    <p key={wi} style={{ margin: "6px 0 0", fontSize: 13, color: "#FF3B30", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={14} color="#FF3B30" /> {w}
                    </p>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <select
                      value={m.mealType || "Lunch"}
                      onChange={(e) => updateMealType(m.id, e.target.value)}
                      style={{ fontSize: 14, padding: "6px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible" }}
                    >
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                    </select>
                    <input
                      type="time"
                      value={m.timeValue || "12:00"}
                      onChange={(e) => updateMealTime(m.id, e.target.value)}
                      style={{ fontSize: 14, padding: "6px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {[
                      { key: "bad", label: "Bad", emoji: "😞" },
                      { key: "okay", label: "Okay", emoji: "😐" },
                      { key: "like", label: "Like it", emoji: "😊" },
                      { key: "love", label: "Love it", emoji: "😍" },
                    ].map((r) => (
                      <button
                        key={r.key}
                        onClick={() => updateMealRating(m.id, r.key)}
                        style={{
                          fontSize: 13,
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: m.rating === r.key ? "2px solid #34C759" : "1.5px solid rgba(255,255,255,0.25)",
                          background: m.rating === r.key ? "rgba(52,199,89,0.15)" : "#1a1a1a",
                          color: "#fff",
                          fontFamily: "Atkinson Hyperlegible",
                          fontWeight: m.rating === r.key ? 700 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {r.emoji} {r.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => saveMealAsRecipe(m)}
                    disabled={recipes.some((r) => r.name.toLowerCase() === m.name.toLowerCase())}
                    style={{
                      marginTop: 8, fontSize: 13, padding: "6px 10px", borderRadius: 999,
                      border: "1.5px solid rgba(255,122,0,0.5)", background: "rgba(255,122,0,0.1)",
                      color: "#FF7A00", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer",
                      opacity: recipes.some((r) => r.name.toLowerCase() === m.name.toLowerCase()) ? 0.5 : 1,
                    }}
                  >
                    {recipes.some((r) => r.name.toLowerCase() === m.name.toLowerCase()) ? "Saved as recipe" : "Save as recipe"}
                  </button>
                </div>
                <button
                  style={{ ...iconBtn, background: "rgba(255,59,48,0.15)", borderRadius: 999, marginLeft: 10 }}
                  onClick={() => saveLog(log.filter((x) => x.id !== m.id))}
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 size={20} color="#FF3B30" />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
