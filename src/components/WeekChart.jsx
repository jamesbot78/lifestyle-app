export function WeekChart({ dayHistory, calGoal }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleDateString([], { weekday: "short" }).slice(0, 3);
    const cal = dayHistory[key]?.cal ?? 0;
    days.push({ key, label, cal });
  }
  const maxVal = Math.max(calGoal, ...days.map((d) => d.cal), 1);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 160 }}>
      {days.map((d) => {
        const pct = Math.min(100, Math.round((d.cal / maxVal) * 100));
        const over = d.cal > calGoal;
        return (
          <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 34 }}>
            <div style={{ height: 110, width: 20, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
              <div style={{ width: "100%", height: `${pct}%`, background: over ? "#FF3B30" : "#FF7A00", boxShadow: over ? "0 0 8px rgba(255,59,48,0.6)" : "0 0 8px rgba(255,122,0,0.6)", borderRadius: 999, transition: "height 0.6s ease" }} />
            </div>
            <span style={{ fontSize: 11, color: "#c4c4c4", marginTop: 6 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
