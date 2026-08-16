export function WaterTracker({ cups, goalCups }) {
  const pct = Math.min(1, (cups || 0) / (goalCups || 1));
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Fluids</span>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {cups}<span style={{ color: "#c4c4c4", fontWeight: 400 }}> / {goalCups} cups</span>
        </span>
      </div>
      <div style={{ height: 16, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: "#4A9CD6", boxShadow: "0 0 10px rgba(74,156,214,0.6)", borderRadius: 999, transition: "width 0.4s ease" }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>Logged automatically from your meal and drink photos.</p>
    </div>
  );
}
