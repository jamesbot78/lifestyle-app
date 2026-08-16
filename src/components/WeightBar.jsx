export function WeightBar({ startWeight, currentWeight, goalWeight }) {
  const totalToLose = startWeight - goalWeight;
  const lostSoFar = startWeight - currentWeight;
  const pct = totalToLose > 0 ? Math.max(0, Math.min(100, Math.round((lostSoFar / totalToLose) * 100))) : 0;
  const remaining = Math.round(Math.max(0, currentWeight - goalWeight) * 10) / 10;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Goal progress</span>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {currentWeight}kg<span style={{ color: "#c4c4c4", fontWeight: 400 }}> / {goalWeight}kg goal</span>
        </span>
      </div>
      <div style={{ height: 16, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#FF7A00", boxShadow: "0 0 10px rgba(255,122,0,0.6)", borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 14, color: "#c4c4c4" }}>
        {remaining > 0 ? `${remaining}kg to go` : "Goal reached!"}
      </p>
    </div>
  );
}
