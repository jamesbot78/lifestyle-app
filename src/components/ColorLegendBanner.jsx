export function ColorLegendBanner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ flex: 1, fontSize: 13, color: "#e0e0e0", lineHeight: 1.5 }}>
        <span style={{ color: "#34C759", fontWeight: 700 }}>Green</span> means you already have it.{" "}
        <span style={{ color: "#FF6B5E", fontWeight: 700 }}>Red</span> means you need to buy it.
      </div>
    </div>
  );
}
