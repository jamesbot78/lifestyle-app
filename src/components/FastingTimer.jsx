import { useState, useEffect } from "react";
import { cardStyle } from "../styles/theme";
import { lerpColor } from "../lib/nutrition";

export function FastingTimer({ lastMealAt, fastGoalHours = 16 }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!lastMealAt) {
    return (
      <div style={{ ...cardStyle, marginTop: 12 }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Fasting timer</span>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-soft)" }}>Log a meal to start tracking your fasting window.</p>
      </div>
    );
  }

  const hoursSince = (now - lastMealAt) / 3600000;
  const pct = Math.min(1, hoursSince / fastGoalHours);
  const hrs = Math.floor(hoursSince);
  const mins = Math.round((hoursSince - hrs) * 60);

  return (
    <div style={{ ...cardStyle, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Fasting timer</span>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {hrs}h {mins}m<span style={{ color: "#c4c4c4", fontWeight: 400 }}> / {fastGoalHours}h goal</span>
        </span>
      </div>
      <div style={{ height: 16, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: lerpColor(pct), borderRadius: 999, transition: "width 0.4s ease" }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>
        {hoursSince >= fastGoalHours ? "Fasting goal reached, nice work." : `Since your last logged meal or drink.`}
      </p>
    </div>
  );
}
