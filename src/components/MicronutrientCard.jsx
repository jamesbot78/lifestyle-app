import { ChevronDown, ChevronUp } from "lucide-react";
import { cardStyle } from "../styles/theme";
import { MICRO_GOALS, lerpColor } from "../lib/nutrition";

export function MicronutrientCard({ totals, open, onToggle }) {
  return (
    <div style={{ ...cardStyle, marginTop: 12, cursor: "pointer" }} onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Micronutrients</span>
        {open ? <ChevronUp size={20} color="#c4c4c4" /> : <ChevronDown size={20} color="#c4c4c4" />}
      </div>
      {open && (
        <div style={{ marginTop: 14 }} onClick={(e) => e.stopPropagation()}>
          {Object.entries(MICRO_GOALS).map(([key, cfg]) => {
            const value = Math.round((totals[key] || 0) * 10) / 10;
            const pct = Math.min(1, value / cfg.goal);
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: "#e0e0e0" }}>{cfg.label}</span>
                  <span style={{ fontSize: 13, color: "#c4c4c4" }}>{value}{cfg.unit} / {cfg.goal}{cfg.unit}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct * 100}%`, background: lerpColor(pct), borderRadius: 999, transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>Estimated from your meal photos, rough guide only, not a substitute for lab testing.</p>
        </div>
      )}
    </div>
  );
}
