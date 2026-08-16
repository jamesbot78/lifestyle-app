export function WeightTrend({ weightLog, goalWeight }) {
  if (!weightLog || weightLog.length === 0) {
    return <p style={{ color: "#c4c4c4", fontSize: 14, margin: 0 }}>Log your weight to see progress here.</p>;
  }
  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const weights = recent.map((w) => w.weight).concat([goalWeight]);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = Math.max(maxW - minW, 1);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 160 }}>
      {recent.map((w) => {
        const pct = Math.round(((w.weight - minW) / range) * 100);
        return (
          <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 34 }}>
            <span style={{ fontSize: 11, fontFamily: "Quicksand", fontWeight: 700, color: "#fff", marginBottom: 6 }}>{w.weight}</span>
            <div style={{ height: 90, width: 20, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
              <div style={{ width: "100%", height: `${Math.max(6, pct)}%`, background: "#FF7A00", boxShadow: "0 0 8px rgba(255,122,0,0.6)", borderRadius: 999, transition: "height 0.6s ease" }} />
            </div>
            <span style={{ fontSize: 11, color: "#c4c4c4", marginTop: 6 }}>{w.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}
