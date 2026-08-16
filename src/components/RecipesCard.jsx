import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { cardStyle, primaryBtn, iconBtn } from "../styles/theme";
import { ColorLegendBanner } from "./ColorLegendBanner";

export function RecipesCard({ recipes, open, onToggle, onLog, onDelete, importText, setImportText, importOpen, setImportOpen, onImport, busy, pantry }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div style={{ ...cardStyle, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={onToggle}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>My recipes{recipes.length ? ` (${recipes.length})` : ""}</span>
        {open ? <ChevronUp size={20} color="#c4c4c4" /> : <ChevronDown size={20} color="#c4c4c4" />}
      </div>
      {open && (
        <div style={{ marginTop: 14 }}>
          {recipes.length === 0 && (
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-soft)" }}>Save a logged meal as a recipe, or import one below, to see it here.</p>
          )}
          {recipes.map((r) => (
            <div key={r.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, cursor: (r.ingredients?.length || r.steps?.length) ? "pointer" : "default" }} onClick={() => (r.ingredients?.length || r.steps?.length) && setExpandedId(expandedId === r.id ? null : r.id)}>
                  <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 15, color: "#fff" }}>{r.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#c4c4c4" }}>{r.calories} cal · P{r.protein}g · C{r.carbs}g · F{r.fat}g</p>
                </div>
                <button
                  onClick={() => onLog(r)}
                  style={{ fontSize: 13, padding: "6px 10px", borderRadius: 999, border: "1.5px solid rgba(52,199,89,0.5)", background: "rgba(52,199,89,0.12)", color: "#34C759", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
                >
                  Log it
                </button>
                <button
                  onClick={() => onDelete(r.id)}
                  style={{ ...iconBtn, background: "rgba(255,59,48,0.15)", borderRadius: 999 }}
                  aria-label={`Delete recipe ${r.name}`}
                >
                  <Trash2 size={16} color="#FF3B30" />
                </button>
              </div>
              {expandedId === r.id && (
                <div style={{ marginTop: 10, paddingLeft: 4 }}>
                  {r.ingredients?.length > 0 && (
                    <>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Ingredients</p>
                      <ColorLegendBanner />
                      {r.ingredients.map((ing, i) => {
                        const lower = ing.toLowerCase();
                        const haveIt = (pantry || []).some((p) => lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower.replace(/^[\d.\/]+\s*(g|kg|ml|l|cup|cups|tsp|tbsp|oz|lb|slice|slices|clove|cloves)?\s*/i, "").trim()));
                        return <p key={i} style={{ margin: "0 0 2px", fontSize: 14, color: haveIt ? "#34C759" : "#FF6B5E" }}>• {ing}</p>;
                      })}
                    </>
                  )}
                  {r.steps?.length > 0 && (
                    <>
                      <p style={{ margin: "10px 0 4px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Method</p>
                      {r.steps.map((s, i) => (
                        <p key={i} style={{ margin: "0 0 4px", fontSize: 14, color: "#eeeeee", lineHeight: 1.4 }}>{i + 1}. {s}</p>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setImportOpen(!importOpen)}
              style={{ fontSize: 14, padding: "8px 12px", borderRadius: 10, border: "1.5px solid rgba(255,122,0,0.4)", background: "rgba(255,122,0,0.08)", color: "#FF7A00", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
            >
              {importOpen ? "Cancel import" : "Add recipe from text or link"}
            </button>
            {importOpen && (
              <div style={{ marginTop: 10 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#c4c4c4", lineHeight: 1.5 }}>
                  Paste a recipe link, or the caption/ingredient text copied from Instagram or a website. It'll pull out the ingredient list with quantities, the method steps, and an estimated calorie and macro breakdown.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste a recipe link, or paste the caption/ingredient text from Instagram or a website"
                  style={{ width: "100%", minHeight: 90, fontSize: 15, padding: 10, borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible", resize: "vertical" }}
                />
                <button
                  onClick={onImport}
                  disabled={busy === "import" || !importText.trim()}
                  style={{ ...primaryBtn, marginTop: 8, width: "100%", opacity: busy === "import" || !importText.trim() ? 0.6 : 1 }}
                >
                  {busy === "import" ? "Reading recipe..." : "Import recipe"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
